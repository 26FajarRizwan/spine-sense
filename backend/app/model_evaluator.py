from threading import Lock

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_recall_fscore_support,
)

from app.posture_engine import FEATURE_NAMES, PostureInferenceEngine
from app.schemas import ClassMetric, ModelMetricsResponse
from train_model import CLASS_LABELS, generate_dataset

VALIDATION_RANDOM_STATE = 99
VALIDATION_SAMPLES = 1_200


class ModelEvaluator:
    def __init__(self, engine: PostureInferenceEngine) -> None:
        self._engine = engine
        self._report: ModelMetricsResponse | None = None
        self._lock = Lock()

    def report(self) -> ModelMetricsResponse:
        with self._lock:
            if self._report is None:
                self._report = self._evaluate()
            return self._report

    def _evaluate(self) -> ModelMetricsResponse:
        model = self._engine.model
        if model is None:
            return ModelMetricsResponse(
                model_loaded=False,
                algorithm="unavailable",
                accuracy=0.0,
                macro_f1=0.0,
                classes=[],
                confusion_matrix=[],
            )

        features, labels = generate_dataset(
            samples_per_class=VALIDATION_SAMPLES // len(CLASS_LABELS),
            random_state=VALIDATION_RANDOM_STATE,
        )
        predictions = model.predict(features[FEATURE_NAMES])

        precision, recall, f1, support = precision_recall_fscore_support(
            labels, predictions, labels=CLASS_LABELS, zero_division=0
        )
        matrix = confusion_matrix(labels, predictions, labels=CLASS_LABELS)

        return ModelMetricsResponse(
            model_loaded=True,
            algorithm=self._algorithm_name(model),
            accuracy=round(float(accuracy_score(labels, predictions)), 4),
            macro_f1=round(
                float(
                    f1_score(
                        labels,
                        predictions,
                        labels=CLASS_LABELS,
                        average="macro",
                        zero_division=0,
                    )
                ),
                4,
            ),
            classes=[
                ClassMetric(
                    posture_class=label,
                    precision=round(float(precision[i]), 4),
                    recall=round(float(recall[i]), 4),
                    f1_score=round(float(f1[i]), 4),
                    support=int(support[i]),
                )
                for i, label in enumerate(CLASS_LABELS)
            ],
            confusion_matrix=np.asarray(matrix, dtype=int).tolist(),
        )

    @staticmethod
    def _algorithm_name(model: object) -> str:
        base = getattr(model, "estimator", None)
        name = type(base if base is not None else model).__name__
        if base is not None:
            return f"Calibrated {name}"
        return name
