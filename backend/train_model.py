from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

FEATURE_NAMES = [
    "neck_angle",
    "shoulder_tilt",
    "torso_compression",
    "depth_delta",
]
CLASS_LABELS = [
    "Optimal Upright",
    "Forward Head",
    "Rounded Shoulders",
    "Lateral Lean",
    "Deep Slouch",
]
SAMPLES_PER_CLASS = 1_000
RANDOM_STATE = 42


def generate_dataset(
    samples_per_class: int = SAMPLES_PER_CLASS,
    random_state: int = RANDOM_STATE,
) -> tuple[pd.DataFrame, np.ndarray]:
    if samples_per_class < 1:
        raise ValueError("samples_per_class must be positive")

    rng = np.random.default_rng(random_state)
    class_parameters = {
        "Optimal Upright": (8.0, 2.6, 2.4, 0.8, 1.55, 0.035, 0.0, 0.018),
        "Forward Head": (27.0, 4.5, 5.0, 2.8, 1.46, 0.075, 0.085, 0.032),
        "Rounded Shoulders": (
            16.0,
            3.5,
            6.0,
            2.7,
            1.30,
            0.060,
            0.135,
            0.028,
        ),
        "Lateral Lean": (11.0, 3.0, 24.0, 4.5, 1.52, 0.050, 0.015, 0.028),
        "Deep Slouch": (24.0, 4.0, 7.0, 3.0, 1.04, 0.075, 0.17, 0.035),
    }

    feature_rows = []
    labels = []
    for label in CLASS_LABELS:
        (
            neck_mean,
            neck_scale,
            tilt_mean,
            tilt_scale,
            compression_mean,
            compression_scale,
            depth_mean,
            depth_scale,
        ) = class_parameters[label]
        count = samples_per_class
        severity = rng.normal(0.0, 1.0, count)
        neck_angle = np.clip(
            neck_mean
            + neck_scale * severity
            + rng.normal(0.0, 1.5, count),
            0.0,
            60.0,
        )
        shoulder_tilt = np.clip(
            tilt_mean
            + tilt_scale * severity
            + rng.normal(0.0, 1.5, count),
            0.0,
            60.0,
        )
        torso_compression = np.clip(
            compression_mean
            - compression_scale * severity
            + rng.normal(0.0, 0.035, count),
            0.65,
            2.0,
        )
        depth_delta = np.clip(
            depth_mean
            + depth_scale * severity
            + rng.normal(0.0, 0.012, count),
            -0.2,
            0.45,
        )
        feature_rows.append(
            np.column_stack(
                (neck_angle, shoulder_tilt, torso_compression, depth_delta)
            )
        )
        labels.extend([label] * count)

    features = np.vstack(feature_rows)
    target = np.asarray(labels)
    order = rng.permutation(len(target))
    return pd.DataFrame(features[order], columns=FEATURE_NAMES), target[order]


def train_model() -> tuple[CalibratedClassifierCV, float, str]:
    features, labels = generate_dataset()
    x_train, x_test, y_train, y_test = train_test_split(
        features,
        labels,
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=labels,
    )
    classifier = CalibratedClassifierCV(
        estimator=RandomForestClassifier(
            n_estimators=240,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
        method="sigmoid",
        cv=3,
        n_jobs=1,
    )
    classifier.fit(x_train, y_train)
    predictions = classifier.predict(x_test)
    accuracy = accuracy_score(y_test, predictions)
    report = classification_report(
        y_test,
        predictions,
        labels=CLASS_LABELS,
        zero_division=0,
    )
    return classifier, accuracy, report


def main() -> None:
    model, accuracy, report = train_model()
    model_directory = Path(__file__).resolve().parent / "models"
    model_directory.mkdir(parents=True, exist_ok=True)
    model_path = model_directory / "posture_classifier.joblib"
    joblib.dump(model, model_path)
    print(f"Test accuracy: {accuracy:.4f}")
    print(report, end="")
    print(f"Model saved to {model_path}")


if __name__ == "__main__":
    main()
