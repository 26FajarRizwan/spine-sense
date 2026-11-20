import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type BiomechanicalStatus = "GOOD" | "WARNING" | "SLUMP";

export interface PostureBaseline {
  neckAngle: number;
  shoulderTilt: number;
  torsoCompression: number;
  depthDelta: number;
  earShoulderRatio: number;
  torsoAngle: number;
}

export interface PostureAnalysis {
  score: number;
  status: BiomechanicalStatus;
  neckAlignment: number;
  shoulderBalance: number;
  spineUpright: number;
  postureClass:
    | "Optimal Upright"
    | "Forward Head"
    | "Rounded Shoulders"
    | "Lateral Lean"
    | "Deep Slouch";
  cue: string;
  neckAngle: number;
  forwardHeadDelta: number;
  shoulderTilt: number;
  torsoCompression: number;
  depthDelta: number;
  earShoulderRatio: number;
  torsoAngle: number;
}

interface RawMetrics {
  neckAngle: number;
  shoulderTilt: number;
  torsoCompression: number;
  depthDelta: number;
  earShoulderRatio: number;
  torsoAngle: number;
  hipsVisible: boolean;
}

const DEFAULT_BASELINE: PostureBaseline = {
  neckAngle: 8,
  shoulderTilt: 0,
  torsoCompression: 1.55,
  depthDelta: 0,
  earShoulderRatio: 0.35,
  torsoAngle: 8,
};

function midpoint(
  first: NormalizedLandmark,
  second: NormalizedLandmark,
): { x: number; y: number; z: number } {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
    z: (first.z + second.z) / 2,
  };
}

function visible(landmark: NormalizedLandmark | undefined): landmark is NormalizedLandmark {
  return Boolean(landmark && (landmark.visibility ?? 1) > 0.5);
}

function extractRawMetrics(landmarks: NormalizedLandmark[]): RawMetrics | null {
  if (landmarks.length < 33) return null;

  const leftEar = landmarks[7];
  const rightEar = landmarks[8];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  if (
    !visible(leftEar) ||
    !visible(rightEar) ||
    !visible(leftShoulder) ||
    !visible(rightShoulder)
  ) {
    return null;
  }

  const ear = midpoint(leftEar, rightEar);
  const shoulder = midpoint(leftShoulder, rightShoulder);
  const nose = landmarks[0];
  const headX = visible(nose) ? (ear.x + nose.x) / 2 : ear.x;
  const verticalRise = shoulder.y - ear.y;
  if (verticalRise <= 0.015) return null;

  const headAngle =
    (Math.atan2(
      Math.hypot(headX - shoulder.x, ear.z - shoulder.z),
      verticalRise,
    ) *
      180) /
    Math.PI;
  const shoulderTilt = Math.abs(
    (Math.atan2(
      rightShoulder.y - leftShoulder.y,
      Math.abs(rightShoulder.x - leftShoulder.x),
    ) *
      180) /
      Math.PI,
  );
  const earShoulderRatio = verticalRise / Math.max(
    Math.abs(rightShoulder.x - leftShoulder.x),
    0.01,
  );

  let torsoCompression = DEFAULT_BASELINE.torsoCompression;
  let torsoAngle = DEFAULT_BASELINE.torsoAngle;
  let depthDelta = 0;
  const hipsVisible = visible(leftHip) && visible(rightHip);
  if (hipsVisible) {
    const hip = midpoint(leftHip, rightHip);
    depthDelta = shoulder.z - hip.z;
    const torsoRise = hip.y - shoulder.y;
    if (torsoRise > 0.015) {
      torsoCompression =
        torsoRise / Math.max(Math.abs(rightShoulder.x - leftShoulder.x), 0.01);
      torsoAngle =
        (Math.atan2(Math.abs(hip.x - shoulder.x), torsoRise) * 180) / Math.PI;
    }
  }

  return {
    neckAngle: headAngle,
    shoulderTilt,
    torsoCompression,
    depthDelta,
    earShoulderRatio,
    torsoAngle,
    hipsVisible,
  };
}

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function createPostureBaseline(
  frames: NormalizedLandmark[][],
): PostureBaseline | null {
  const metrics = frames
    .map(extractRawMetrics)
    .filter((value): value is RawMetrics => value !== null);
  if (metrics.length === 0) return null;
  const hipMetrics = metrics.filter((value) => value.hipsVisible);

  return {
    neckAngle: average(metrics.map((value) => value.neckAngle)),
    shoulderTilt: average(metrics.map((value) => value.shoulderTilt)),
    torsoCompression:
      hipMetrics.length > 0
        ? average(hipMetrics.map((value) => value.torsoCompression))
        : DEFAULT_BASELINE.torsoCompression,
    depthDelta:
      hipMetrics.length > 0
        ? average(hipMetrics.map((value) => value.depthDelta))
        : DEFAULT_BASELINE.depthDelta,
    earShoulderRatio: average(metrics.map((value) => value.earShoulderRatio)),
    torsoAngle:
      hipMetrics.length > 0
        ? average(hipMetrics.map((value) => value.torsoAngle))
        : DEFAULT_BASELINE.torsoAngle,
  };
}

function clamp(value: number, low = 0, high = 100): number {
  return Math.min(high, Math.max(low, value));
}

export function analyzePosture(
  landmarks: NormalizedLandmark[],
  baseline?: PostureBaseline | null,
): PostureAnalysis | null {
  const current = extractRawMetrics(landmarks);
  if (!current) return null;

  const reference = baseline ?? DEFAULT_BASELINE;
  const forwardHeadDelta = current.neckAngle - reference.neckAngle;
  const tiltDelta = current.shoulderTilt - reference.shoulderTilt;
  const compression =
    (reference.earShoulderRatio - current.earShoulderRatio) /
    Math.max(reference.earShoulderRatio, 0.05);
  const torsoSquash = current.hipsVisible
    ? (reference.torsoCompression - current.torsoCompression) /
      Math.max(reference.torsoCompression, 0.05)
    : 0;
  const depthDelta = current.hipsVisible
    ? current.depthDelta - reference.depthDelta
    : 0;
  const torsoAngleDelta = current.hipsVisible
    ? current.torsoAngle - reference.torsoAngle
    : 0;

  const neckAlignment = clamp(
    100 -
      Math.max(0, forwardHeadDelta) * 2.8 -
      Math.max(0, compression) * 35,
  );
  const shoulderBalance = clamp(100 - Math.abs(tiltDelta) * 4);
  const spineUpright = clamp(
    100 -
      Math.max(0, compression) * 100 -
      Math.max(0, torsoSquash) * 35 -
      Math.abs(depthDelta) * 120 -
      Math.abs(torsoAngleDelta) * 2.5,
  );
  const score = Math.round(
    clamp(neckAlignment * 0.4 + shoulderBalance * 0.25 + spineUpright * 0.35),
  );
  const status: BiomechanicalStatus =
    score >= 80 ? "GOOD" : score >= 60 ? "WARNING" : "SLUMP";

  let postureClass: PostureAnalysis["postureClass"] = "Optimal Upright";
  let cue = "Aligned";
  if (score < 60 || spineUpright < 48) {
    postureClass = "Deep Slouch";
    cue = "Sit upright and pull shoulders back";
  } else if (neckAlignment <= shoulderBalance && neckAlignment <= spineUpright) {
    postureClass = "Forward Head";
    cue = "Lift chin slightly";
  } else if (shoulderBalance < 72) {
    postureClass = Math.abs(tiltDelta) > 10 ? "Lateral Lean" : "Rounded Shoulders";
    cue =
      postureClass === "Lateral Lean"
        ? "Level your shoulders"
        : "Open your chest slightly";
  } else if (spineUpright < 76) {
    postureClass = "Rounded Shoulders";
    cue = "Sit upright and pull shoulders back";
  }

  return {
    score,
    status,
    neckAlignment: Math.round(neckAlignment),
    shoulderBalance: Math.round(shoulderBalance),
    spineUpright: Math.round(spineUpright),
    postureClass,
    cue,
    neckAngle: current.neckAngle,
    forwardHeadDelta,
    shoulderTilt: current.shoulderTilt,
    torsoCompression: current.torsoCompression,
    depthDelta,
    earShoulderRatio: current.earShoulderRatio,
    torsoAngle: current.torsoAngle,
  };
}
