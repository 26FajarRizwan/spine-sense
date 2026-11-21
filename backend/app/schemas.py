from pydantic import BaseModel, Field


class LandmarkPoint(BaseModel):
    x: float
    y: float
    z: float
    visibility: float = 1.0


class BaselineMetrics(BaseModel):
    neck_angle: float
    shoulder_tilt: float
    torso_compression: float
    depth_delta: float


class PosturePredictRequest(BaseModel):
    landmarks: list[LandmarkPoint] = Field(min_length=33, max_length=33)
    baseline: BaselineMetrics | None = None
    slouch_threshold: float = Field(default=20.0, gt=0)


class PosturePredictResponse(BaseModel):
    score: int
    status: str
    posture_class: str
    confidence: float
    neck_alignment: int
    shoulder_balance: int
    spine_upright: int
    cue: str
    inference_source: str


class BatchAnalyzeRequest(BaseModel):
    frames: list[PosturePredictRequest] = Field(min_length=1, max_length=500)


class BatchAnalyzeResponse(BaseModel):
    total_frames: int
    average_score: float
    min_score: int
    max_score: int
    dominant_posture: str
    slump_frames: int
    class_distribution: dict[str, int]


class ClassMetric(BaseModel):
    posture_class: str
    precision: float
    recall: float
    f1_score: float
    support: int


class ModelMetricsResponse(BaseModel):
    model_loaded: bool
    algorithm: str
    accuracy: float
    macro_f1: float
    classes: list[ClassMetric]
    confusion_matrix: list[list[int]]
