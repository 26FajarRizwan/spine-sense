import math
from collections import Counter
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from app.schemas import (
    BaselineMetrics,
    BatchAnalyzeResponse,
    LandmarkPoint,
    PosturePredictRequest,
    PosturePredictResponse,
)

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
CLASS_RECLINED = "Reclined Slouch"
CLASS_SLOUCH = "Deep Slouch"

CLASS_SCORES = {
    CLASS_OPTIMAL: 95.0,
    CLASS_FORWARD_HEAD: 60.0,
    CLASS_ROUNDED: 62.0,
    CLASS_LATERAL: 65.0,
    CLASS_RECLINED: 58.0,
    CLASS_SLOUCH: 35.0,
}

CUES = {
    CLASS_OPTIMAL: "Spine aligned. Hold this posture.",
    CLASS_FORWARD_HEAD: "Head is drifting forward. Draw your chin back.",
    CLASS_ROUNDED: "Shoulders are rolling in. Open the chest.",
    CLASS_LATERAL: "Leaning to one side. Level your shoulders.",
    CLASS_RECLINED: "Sit upright away from backrest.",
    CLASS_SLOUCH: "Slump detected. Sit back and lengthen your spine.",
}

NECK_WEIGHT = 0.40
SHOULDER_WEIGHT = 0.25
SPINE_WEIGHT = 0.35
MODEL_BLEND = 0.40
MIN_SUBSCORE_MARGIN = 12.0
PENALTY_AT_THRESHOLD = 66.0


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _midpoint(a: LandmarkPoint, b: LandmarkPoint) -> np.ndarray:
    return np.array(
        [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2], dtype=float
    )


def extract_features(
    landmarks: list[LandmarkPoint], baseline: BaselineMetrics | None = None
) -> dict[str, float]:
    reference = baseline or DEFAULT_BASELINE
    ear = _midpoint(landmarks[LEFT_EAR], landmarks[RIGHT_EAR])
    shoulder = _midpoint(landmarks[LEFT_SHOULDER], landmarks[RIGHT_SHOULDER])
    hip = _midpoint(landmarks[LEFT_HIP], landmarks[RIGHT_HIP])

    vertical_rise = shoulder[1] - ear[1]
    forward_drift = math.hypot(ear[0] - shoulder[0], ear[2] - shoulder[2])
    head_angle = math.degrees(math.atan2(forward_drift, max(vertical_rise, 1e-6)))
    direction = 1.0 if ear[2] <= shoulder[2] else -1.0
    neck_angle = direction * head_angle - reference.neck_angle

    left = landmarks[LEFT_SHOULDER]
    right = landmarks[RIGHT_SHOULDER]
    tilt = abs(math.degrees(math.atan2(right.y - left.y, right.x - left.x)))
    if tilt > 90.0:
        tilt = 180.0 - tilt
    shoulder_tilt = abs(tilt - reference.shoulder_tilt)

    shoulder_width = max(math.hypot(right.x - left.x, right.z - left.z), 1e-6)
    torso_length = math.hypot(hip[1] - shoulder[1], hip[2] - shoulder[2])
    torso_compression = (torso_length / shoulder_width) / max(
        reference.torso_compression, 1e-6
    )

    depth_delta = reference.depth_delta - float(shoulder[2] - hip[2])

    return {
        "neck_angle": float(neck_angle),
        "shoulder_tilt": float(shoulder_tilt),
        "torso_compression": float(torso_compression),
        "depth_delta": float(depth_delta),
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
        features = extract_features(landmarks, baseline)

        neck = self._neck_alignment(features, slouch_threshold)
        shoulder = self._shoulder_balance(features, slouch_threshold)
        spine = self._spine_upright(features, slouch_threshold)
        ceiling = min(neck, shoulder, spine) + MIN_SUBSCORE_MARGIN

        rule_score = min(
            NECK_WEIGHT * neck + SHOULDER_WEIGHT * shoulder + SPINE_WEIGHT * spine,
            ceiling,
        )
        posture_class, confidence = self._rule_class(
            rule_score, neck, shoulder, spine, features
        )
        score = rule_score
        source = "biomechanical_rules"

        ml_result = self._model_class(features)
        if ml_result is not None:
            posture_class, confidence, expected = ml_result
            score = min(
                (1 - MODEL_BLEND) * rule_score + MODEL_BLEND * expected, ceiling
            )
            source = "ml_classifier"

        final_score = int(round(_clamp(score, 0.0, 100.0)))
        return PosturePredictResponse(
            score=final_score,
            status=self._status(final_score),
            posture_class=posture_class,
            confidence=round(confidence, 4),
            neck_alignment=int(round(_clamp(neck, 0.0, 100.0))),
            shoulder_balance=int(round(_clamp(shoulder, 0.0, 100.0))),
            spine_upright=int(round(_clamp(spine, 0.0, 100.0))),
            cue=CUES.get(posture_class, CUES[CLASS_OPTIMAL]),
            inference_source=source,
        )

    def analyze_batch(
        self, frames: list[PosturePredictRequest]
    ) -> BatchAnalyzeResponse:
        results = [
            self.predict(frame.landmarks, frame.baseline, frame.slouch_threshold)
            for frame in frames
        ]
        scores = [result.score for result in results]
        distribution = Counter(result.posture_class for result in results)
        return BatchAnalyzeResponse(
            total_frames=len(results),
            average_score=round(sum(scores) / len(scores), 2),
            min_score=min(scores),
            max_score=max(scores),
            dominant_posture=distribution.most_common(1)[0][0],
            slump_frames=sum(result.status == "SLUMPING" for result in results),
            class_distribution=dict(distribution),
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
    def _neck_alignment(features: dict[str, float], threshold: float) -> float:
        deviation = abs(features["neck_angle"])
        return max(0.0, 100.0 - deviation * PENALTY_AT_THRESHOLD / threshold)

    @staticmethod
    def _shoulder_balance(features: dict[str, float], threshold: float) -> float:
        deviation = features["shoulder_tilt"]
        return max(0.0, 100.0 - deviation * PENALTY_AT_THRESHOLD / threshold)

    @staticmethod
    def _spine_upright(features: dict[str, float], threshold: float) -> float:
        squash = max(0.0, 1.0 - features["torso_compression"])
        lean = abs(features["depth_delta"])
        penalty = 60.0 * _clamp(squash / 0.3) + 40.0 * _clamp(
            lean / (threshold / 200.0)
        )
        return 100.0 - penalty

    @staticmethod
    def _rule_class(
        score: float,
        neck: float,
        shoulder: float,
        spine: float,
        features: dict[str, float],
    ) -> tuple[str, float]:
        if min(neck, shoulder, spine) >= 80.0:
            return CLASS_OPTIMAL, _clamp(score / 100.0, 0.5, 0.99)

        ranked = sorted([(neck, "neck"), (shoulder, "shoulder"), (spine, "spine")])
        weakest, source = ranked[0]
        backward = features["neck_angle"] < 0.0 or features["depth_delta"] < 0.0
        if source == "neck":
            label = CLASS_RECLINED if features["neck_angle"] < 0.0 else CLASS_FORWARD_HEAD
        elif source == "shoulder":
            label = CLASS_LATERAL
        elif features["depth_delta"] < 0.0 and backward:
            label = CLASS_RECLINED
        else:
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
