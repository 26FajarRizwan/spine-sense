import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type BiomechanicalStatus = "GOOD" | "WARNING" | "SLUMP";

export interface PostureBaseline {
  neckAngle: number;
  shoulderTilt: number;
  torsoCompression: number;
  depthDelta: number;
  earShoulderRatio: number;
  torsoAngle: number;
  noseToShoulderY: number;
  noseEarGap: number;
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
    | "Reclined Slouch"
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
  noseToShoulderY: number;
  noseEarGap: number;
  hipsVisible: boolean;
}

const DEFAULT_BASELINE: PostureBaseline = {
  neckAngle: 8,
  shoulderTilt: 0,
  torsoCompression: 1.55,
  depthDelta: 0,
  earShoulderRatio: 0.35,
  torsoAngle: 8,
  noseToShoulderY: 0.35,
  noseEarGap: 0,
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
  const verticalRise = shoulder.y - ear.y;
  if (verticalRise <= 0.015) return null;

  const headAngle =
    ((ear.z <= shoulder.z ? 1 : -1) *
      Math.atan2(Math.hypot(ear.x - shoulder.x, ear.z - shoulder.z), verticalRise) *
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
  const shoulderWidth = Math.max(Math.abs(rightShoulder.x - leftShoulder.x), 0.01);
  const earShoulderRatio = verticalRise / shoulderWidth;
  const noseY = visible(nose) ? nose.y : ear.y;
  const noseToShoulderY = (shoulder.y - noseY) / shoulderWidth;
  const noseEarGap = (noseY - ear.y) / shoulderWidth;

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
        Math.hypot(torsoRise, hip.z - shoulder.z) /
        Math.max(
          Math.hypot(
            rightShoulder.x - leftShoulder.x,
            rightShoulder.z - leftShoulder.z,
          ),
          0.01,
        );
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
    noseToShoulderY,
    noseEarGap,
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
    noseToShoulderY: average(metrics.map((value) => value.noseToShoulderY)),
    noseEarGap: average(metrics.map((value) => value.noseEarGap)),
  };
}

const NATURAL_ANGLE_ZONE = 6;
const NATURAL_DEPTH_ZONE = 0.04;
const NATURAL_TILT_ZONE = 4;
const DEPTH_MULTIPLIER = 90;
const CHIN_LIFT_MULTIPLIER = 65;

function deadZone(value: number, zone: number): number {
  const magnitude = Math.max(0, Math.abs(value) - zone);
  return value < 0 ? -magnitude : magnitude;
}

function clamp(value: number, low = 0, high = 100): number {
  return Math.min(high, Math.max(low, value));
}

export function analyzePosture(
  landmarks: NormalizedLandmark[],
  baseline?: PostureBaseline | null,
  slouchThreshold = 20,
): PostureAnalysis | null {
  const current = extractRawMetrics(landmarks);
  if (!current) return null;

  const reference = baseline ?? DEFAULT_BASELINE;
  const penaltyPerDegree = 66 / Math.max(slouchThreshold - NATURAL_TILT_ZONE, 1);
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

  const neckShift = deadZone(forwardHeadDelta, NATURAL_ANGLE_ZONE);
  const tiltShift = deadZone(tiltDelta, NATURAL_TILT_ZONE);
  const compressionShift = deadZone(compression, NATURAL_DEPTH_ZONE);
  const squashShift = deadZone(torsoSquash, NATURAL_DEPTH_ZONE);
  const depthShift = deadZone(depthDelta, NATURAL_DEPTH_ZONE);
  const torsoShift = deadZone(torsoAngleDelta, NATURAL_ANGLE_ZONE);
  const noseShift = baseline
    ? deadZone(current.noseToShoulderY - reference.noseToShoulderY, NATURAL_DEPTH_ZONE) /
      Math.max(Math.abs(reference.noseToShoulderY), 0.05)
    : 0;
  const chinLift = baseline
    ? deadZone(reference.noseEarGap - current.noseEarGap, NATURAL_DEPTH_ZONE) *
      CHIN_LIFT_MULTIPLIER
    : 0;
  const reclineAmount = Math.max(
    0,
    depthShift * DEPTH_MULTIPLIER,
    chinLift,
    -neckShift,
    noseShift * 100,
    -compressionShift * 100,
  );
  const neckDeviation = Math.max(
    Math.abs(neckShift),
    chinLift,
    Math.abs(noseShift) * 100,
  );
  const spineDeviation = Math.max(
    Math.abs(torsoShift),
    Math.abs(depthShift) * DEPTH_MULTIPLIER,
    reclineAmount,
  );

  const neckAlignment = clamp(
    100 - neckDeviation * penaltyPerDegree - Math.abs(compressionShift) * 35,
  );
  const shoulderBalance = clamp(100 - Math.abs(tiltShift) * penaltyPerDegree);
  const spineUpright = clamp(
    100 -
      spineDeviation * penaltyPerDegree -
      Math.abs(compressionShift) * 100 -
      Math.max(0, squashShift) * 35,
  );
  const minSubScore = Math.min(neckAlignment, shoulderBalance, spineUpright);
  const weightedScore =
    neckAlignment * 0.4 + shoulderBalance * 0.25 + spineUpright * 0.35;
  const score = Math.round(clamp(Math.min(weightedScore, minSubScore + 12)));
  const status: BiomechanicalStatus =
    score >= 80 ? "GOOD" : score >= 60 ? "WARNING" : "SLUMP";

  const tiltLimit = slouchThreshold * 0.5;
  let postureClass: PostureAnalysis["postureClass"] = "Optimal Upright";
  let cue = "Aligned";
  if (
    status !== "GOOD" &&
    reclineAmount >= tiltLimit &&
    reclineAmount >= Math.abs(neckShift)
  ) {
    postureClass = "Reclined Slouch";
    cue = "Sit upright away from backrest";
  } else if (score < 60 || spineUpright < 48) {
    postureClass = "Deep Slouch";
    cue = "Sit upright and pull shoulders back";
  } else if (minSubScore < 80) {
    if (neckAlignment <= shoulderBalance && neckAlignment <= spineUpright) {
      postureClass = "Forward Head";
      cue = "Lift chin slightly";
    } else if (shoulderBalance <= spineUpright) {
      postureClass = Math.abs(tiltShift) > tiltLimit ? "Lateral Lean" : "Rounded Shoulders";
      cue =
        postureClass === "Lateral Lean"
          ? "Level your shoulders"
          : "Open your chest slightly";
    } else {
      postureClass = "Rounded Shoulders";
      cue = "Sit upright and pull shoulders back";
    }
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
