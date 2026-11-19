import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.posture_engine import PostureInferenceEngine
from app.schemas import PosturePredictRequest, PosturePredictResponse

load_dotenv()

DEFAULT_MODEL_PATH = (
    Path(__file__).resolve().parents[1] / "models" / "posture_classifier.joblib"
)
ALLOWED_ORIGINS = ["http://localhost:3000", "https://spine-sense.vercel.app"]

engine = PostureInferenceEngine(
    Path(os.getenv("POSTURE_MODEL_PATH", str(DEFAULT_MODEL_PATH)))
)

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


@app.post("/api/v1/predict", response_model=PosturePredictResponse)
def predict(payload: PosturePredictRequest) -> PosturePredictResponse:
    return engine.predict(
        payload.landmarks, payload.baseline, payload.slouch_threshold
    )
