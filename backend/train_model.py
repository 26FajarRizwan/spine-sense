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
    "Reclined Slouch",
    "Deep Slouch",
]
SAMPLES_PER_CLASS = 1_000
RANDOM_STATE = 42

CLASS_PARAMETERS = {
    "Optimal Upright": ((0.0, 3.0), (2.0, 1.3), (1.00, 0.04), (0.0, 0.015)),
    "Forward Head": ((19.0, 4.5), (3.0, 1.8), (0.97, 0.05), (0.04, 0.025)),
    "Rounded Shoulders": ((8.0, 3.5), (4.0, 2.0), (0.84, 0.05), (0.07, 0.025)),
    "Lateral Lean": ((2.0, 3.0), (14.0, 4.0), (0.98, 0.04), (0.0, 0.02)),
    "Reclined Slouch": ((-14.0, 4.5), (3.0, 1.8), (0.97, 0.04), (-0.09, 0.025)),
    "Deep Slouch": ((22.0, 4.5), (5.0, 2.5), (0.68, 0.06), (0.13, 0.03)),
}


def generate_dataset(
    samples_per_class: int = SAMPLES_PER_CLASS,
    random_state: int = RANDOM_STATE,
) -> tuple[pd.DataFrame, np.ndarray]:
    if samples_per_class < 1:
        raise ValueError("samples_per_class must be positive")

    rng = np.random.default_rng(random_state)
    feature_rows = []
    labels = []
    for label in CLASS_LABELS:
        neck, tilt, compression, depth = CLASS_PARAMETERS[label]
        count = samples_per_class
        neck_angle = np.clip(rng.normal(*neck, count), -45.0, 60.0)
        shoulder_tilt = np.clip(np.abs(rng.normal(*tilt, count)), 0.0, 45.0)
        torso_compression = np.clip(rng.normal(*compression, count), 0.45, 1.3)
        depth_delta = np.clip(rng.normal(*depth, count), -0.3, 0.4)
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
