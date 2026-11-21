import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.model_evaluator import ModelEvaluator
from app.posture_engine import PostureInferenceEngine
from app.schemas import (
    BatchAnalyzeRequest,
    BatchAnalyzeResponse,
    ModelMetricsResponse,
    PosturePredictRequest,
    PosturePredictResponse,
)

load_dotenv()

DEFAULT_MODEL_PATH = (
    Path(__file__).resolve().parents[1] / "models" / "posture_classifier.joblib"
)
ALLOWED_ORIGINS = ["http://localhost:3000", "https://spine-sense.vercel.app"]

engine = PostureInferenceEngine(
    Path(os.getenv("POSTURE_MODEL_PATH", str(DEFAULT_MODEL_PATH)))
)

evaluator = ModelEvaluator(engine)

app = FastAPI(title="SpineSense Posture API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, object]:
    return {"status": "ok", "model_loaded": engine.model_loaded}


@app.get("/api/v1/model-metrics", response_model=ModelMetricsResponse)
def model_metrics() -> ModelMetricsResponse:
    return evaluator.report()


@app.post("/api/v1/analyze-session", response_model=BatchAnalyzeResponse)
def analyze_session(payload: BatchAnalyzeRequest) -> BatchAnalyzeResponse:
    return engine.analyze_batch(payload.frames)


@app.post("/api/v1/predict", response_model=PosturePredictResponse)
def predict(payload: PosturePredictRequest) -> PosturePredictResponse:
    return engine.predict(
        payload.landmarks, payload.baseline, payload.slouch_threshold
    )
