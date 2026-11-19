import math
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from app.schemas import BaselineMetrics, LandmarkPoint, PosturePredictResponse

LEFT_EAR = 7
RIGHT_EAR = 8
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_HIP = 23
RIGHT_HIP = 24

FEATURE_NAMES = ["neck_angle", "shoulder_tilt", "torso_compression", "depth_delta"]

DEFAULT_BASELINE = BaselineMetrics(
    neck_angle=8.0,
    shoulder_tilt=0.0,
    torso_compression=1.55,
    depth_delta=0.0,
)

CLASS_OPTIMAL = "Optimal Upright"
CLASS_FORWARD_HEAD = "Forward Head"
CLASS_ROUNDED = "Rounded Shoulders"
CLASS_LATERAL = "Lateral Lean"
CLASS_SLOUCH = "Deep Slouch"

CLASS_SCORES = {
    CLASS_OPTIMAL: 95.0,
    CLASS_FORWARD_HEAD: 60.0,
    CLASS_ROUNDED: 62.0,
    CLASS_LATERAL: 65.0,
    CLASS_SLOUCH: 35.0,
}

CUES = {
    CLASS_OPTIMAL: "Spine aligned. Hold this posture.",
    CLASS_FORWARD_HEAD: "Head is drifting forward. Draw your chin back.",
    CLASS_ROUNDED: "Shoulders are rolling in. Open the chest.",
    CLASS_LATERAL: "Leaning to one side. Level your shoulders.",
    CLASS_SLOUCH: "Slump detected. Sit back and lengthen your spine.",
}

NECK_WEIGHT = 0.40
SHOULDER_WEIGHT = 0.25
SPINE_WEIGHT = 0.35
MODEL_BLEND = 0.40


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _midpoint(a: LandmarkPoint, b: LandmarkPoint) -> np.ndarray:
    return np.array(
        [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2], dtype=float
    )


def extract_features(landmarks: list[LandmarkPoint]) -> dict[str, float]:
    ear = _midpoint(landmarks[LEFT_EAR], landmarks[RIGHT_EAR])
    shoulder = _midpoint(landmarks[LEFT_SHOULDER], landmarks[RIGHT_SHOULDER])
    hip = _midpoint(landmarks[LEFT_HIP], landmarks[RIGHT_HIP])

    vertical_rise = shoulder[1] - ear[1]
    forward_drift = math.hypot(ear[0] - shoulder[0], ear[2] - shoulder[2])
    neck_angle = math.degrees(math.atan2(forward_drift, max(vertical_rise, 1e-6)))

    left = landmarks[LEFT_SHOULDER]
    right = landmarks[RIGHT_SHOULDER]
    shoulder_tilt = abs(math.degrees(math.atan2(right.y - left.y, right.x - left.x)))
    if shoulder_tilt > 90.0:
        shoulder_tilt = 180.0 - shoulder_tilt

    shoulder_width = max(math.hypot(right.x - left.x, right.z - left.z), 1e-6)
    torso_length = math.hypot(hip[1] - shoulder[1], hip[2] - shoulder[2])
    torso_compression = torso_length / shoulder_width

    depth_delta = float(shoulder[2] - hip[2])

    return {
        "neck_angle": float(neck_angle),
        "shoulder_tilt": float(shoulder_tilt),
        "torso_compression": float(torso_compression),
        "depth_delta": depth_delta,
    }


class PostureInferenceEngine:
    def __init__(self, model_path: Path) -> None:
        self.model_path = model_path
        self.model = self._load(model_path)

    @staticmethod
    def _load(path: Path):
        if not path.is_file():
            return None
        try:
            model = joblib.load(path)
        except Exception:
            return None
        return model if hasattr(model, "predict_proba") else None

    @property
    def model_loaded(self) -> bool:
        return self.model is not None

    def predict(
        self,
        landmarks: list[LandmarkPoint],
        baseline: BaselineMetrics | None,
        slouch_threshold: float,
    ) -> PosturePredictResponse:
        features = extract_features(landmarks)
        reference = baseline or DEFAULT_BASELINE

        neck = self._neck_alignment(features, reference, slouch_threshold)
        shoulder = self._shoulder_balance(features, reference, slouch_threshold)
        spine = self._spine_upright(features, reference, slouch_threshold)

        rule_score = (
            NECK_WEIGHT * neck + SHOULDER_WEIGHT * shoulder + SPINE_WEIGHT * spine
        )
        posture_class, confidence = self._rule_class(rule_score, neck, shoulder, spine)
        score = rule_score
        source = "biomechanical_rules"

        ml_result = self._model_class(features)
        if ml_result is not None:
            posture_class, confidence, expected = ml_result
            score = (1 - MODEL_BLEND) * rule_score + MODEL_BLEND * expected
            source = "ml_classifier"

        final_score = int(round(_clamp(score, 0.0, 100.0)))
        return PosturePredictResponse(
            score=final_score,
            status=self._status(final_score),
            posture_class=posture_class,
            confidence=round(confidence, 4),
            neck_alignment=int(round(neck)),
            shoulder_balance=int(round(shoulder)),
            spine_upright=int(round(spine)),
            cue=CUES.get(posture_class, CUES[CLASS_OPTIMAL]),
            inference_source=source,
        )

    def _model_class(
        self, features: dict[str, float]
    ) -> tuple[str, float, float] | None:
        if self.model is None:
            return None
        frame = pd.DataFrame(
            [[features[name] for name in FEATURE_NAMES]], columns=FEATURE_NAMES
        )
        try:
            probabilities = self.model.predict_proba(frame)[0]
        except Exception:
            return None
        labels = [str(label) for label in self.model.classes_]
        best = int(np.argmax(probabilities))
        expected = sum(
            float(p) * CLASS_SCORES.get(label, 50.0)
            for label, p in zip(labels, probabilities)
        )
        return labels[best], float(probabilities[best]), expected

    @staticmethod
    def _neck_alignment(
        features: dict[str, float], baseline: BaselineMetrics, threshold: float
    ) -> float:
        drift = max(0.0, features["neck_angle"] - baseline.neck_angle)
        return 100.0 * (1.0 - _clamp(drift / (threshold * 1.5)))

    @staticmethod
    def _shoulder_balance(
        features: dict[str, float], baseline: BaselineMetrics, threshold: float
    ) -> float:
        skew = abs(features["shoulder_tilt"] - baseline.shoulder_tilt)
        return 100.0 * (1.0 - _clamp(skew / (threshold * 0.75)))

    @staticmethod
    def _spine_upright(
        features: dict[str, float], baseline: BaselineMetrics, threshold: float
    ) -> float:
        reference = max(baseline.torso_compression, 1e-6)
        squash = max(0.0, (reference - features["torso_compression"]) / reference)
        lean = abs(features["depth_delta"] - baseline.depth_delta)
        penalty = 60.0 * _clamp(squash / 0.3) + 40.0 * _clamp(lean / (threshold / 40.0))
        return 100.0 - penalty

    @staticmethod
    def _rule_class(
        score: float, neck: float, shoulder: float, spine: float
    ) -> tuple[str, float]:
        if score >= 80.0:
            return CLASS_OPTIMAL, _clamp(score / 100.0, 0.5, 0.99)

        ranked = sorted(
            [(neck, CLASS_FORWARD_HEAD), (shoulder, CLASS_LATERAL), (spine, "")]
        )
        weakest, label = ranked[0]
        if not label:
            label = CLASS_SLOUCH if score < 60.0 else CLASS_ROUNDED
        margin = (ranked[1][0] - weakest) / 100.0
        return label, _clamp(0.55 + margin, 0.5, 0.95)

    @staticmethod
    def _status(score: int) -> str:
        if score >= 80:
            return "GOOD"
        if score >= 60:
            return "WARNING"
        return "SLUMPING"
