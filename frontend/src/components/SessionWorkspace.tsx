"use client";

import {
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Bell, BellOff, BellRing, Camera, CameraOff, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  analyzePosture,
  createPostureBaseline,
  type PostureAnalysis,
  type PostureBaseline,
} from "@/lib/posture/biomechanics";
import {
  DEFAULT_SETTINGS,
  SETTINGS_COLUMNS,
  loadSettings,
  resolveSettings,
  saveSettings,
  settingsFromRow,
  type UserSettings,
} from "@/lib/settings";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import { useSessionConnection } from "@/components/SessionProvider";
import { StretchBreakModal } from "@/components/StretchBreakModal";
import { playCriticalSlumpAlert } from "@/utils/audioAlert";

interface SessionWorkspaceProps {
  mode?: "demo" | "authenticated";
}

interface AlertSettings {
  slouchAngleThreshold: number;
  gracePeriodSeconds: number;
  audioAlertsEnabled: boolean;
  alertVolume: number;
  desktopAlertsEnabled: boolean;
}

interface PredictionResponse {
  posture_class?: unknown;
  inference_source?: unknown;
}

function toAlertSettings(settings: UserSettings): AlertSettings {
  return {
    slouchAngleThreshold: settings.slouchSensitivityDeg,
    gracePeriodSeconds: settings.gracePeriodSeconds,
    audioAlertsEnabled: settings.audioAlertsEnabled,
    alertVolume: settings.audioVolume,
    desktopAlertsEnabled: settings.desktopAlertsEnabled,
  };
}

const INITIAL_ALERT_SETTINGS: AlertSettings = {
  slouchAngleThreshold: DEFAULT_SETTINGS.slouchSensitivityDeg,
  gracePeriodSeconds: DEFAULT_SETTINGS.gracePeriodSeconds,
  audioAlertsEnabled: DEFAULT_SETTINGS.audioAlertsEnabled,
  alertVolume: DEFAULT_SETTINGS.audioVolume,
  desktopAlertsEnabled: DEFAULT_SETTINGS.desktopAlertsEnabled,
};

const POSE_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
  [17, 19], [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [27, 29], [29, 31],
  [27, 31], [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
];

const STATUS_TONES = {
  GOOD: { label: "GOOD", color: "#059669", background: "bg-emerald-50 text-emerald-800" },
  WARNING: { label: "WARNING", color: "#D97706", background: "bg-amber-50 text-amber-800" },
  SLUMP: { label: "SLUMP", color: "#DC2626", background: "bg-red-50 text-red-800" },
} as const;

const WASM_SOURCES = [
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm",
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
];
const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const POSE_DELEGATES = ["GPU", "CPU"] as const;
const ENGINE_TIMEOUT_MS = 20_000;
const VIDEO_READY_TIMEOUT_MS = 5_000;
const BACKGROUND_INTERVAL_MS = 500;
const NOTIFICATION_COOLDOWN_MS = 12_000;
const DEFAULT_TITLE = "SpineSense";
const ALERT_TITLE = "Posture Alert | SpineSense";

type NotificationState = NotificationPermission | "unsupported";

function subscribeToPermissionChange(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    document.removeEventListener("visibilitychange", onChange);
    window.removeEventListener("focus", onChange);
  };
}

function subscribeToVisibility(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function readTabHidden(): boolean {
  return document.hidden;
}

function readTabVisible(): boolean {
  return false;
}

function readUnsupportedAccess(): NotificationState {
  return "unsupported";
}

function readNotificationPermission(): NotificationState {
  return "Notification" in window ? Notification.permission : "unsupported";
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function hasVideoFrame(video: HTMLVideoElement): boolean {
  return (
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.videoWidth > 0 &&
    video.videoHeight > 0
  );
}

function waitForVideoFrame(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (hasVideoFrame(video)) {
      resolve();
      return;
    }
    const startedAt = performance.now();
    const poll = window.setInterval(() => {
      if (hasVideoFrame(video)) {
        window.clearInterval(poll);
        resolve();
      } else if (performance.now() - startedAt >= VIDEO_READY_TIMEOUT_MS) {
        window.clearInterval(poll);
        reject(new Error("the camera did not deliver any video frames"));
      }
    }, 50);
  });
}

function loadPoseLandmarker(
  wasmSource: string,
  delegate: (typeof POSE_DELEGATES)[number],
): Promise<PoseLandmarker> {
  return new Promise((resolve, reject) => {
    let expired = false;
    const timer = window.setTimeout(() => {
      expired = true;
      reject(new Error("the posture model took too long to load"));
    }, ENGINE_TIMEOUT_MS);

    FilesetResolver.forVisionTasks(wasmSource)
      .then((fileset) =>
        PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate },
          runningMode: "VIDEO",
          numPoses: 1,
        }),
      )
      .then((instance) => {
        if (expired) {
          instance.close();
          return;
        }
        window.clearTimeout(timer);
        resolve(instance);
      })
      .catch((loadError: unknown) => {
        window.clearTimeout(timer);
        reject(loadError);
      });
  });
}

async function createPoseLandmarker(isCancelled: () => boolean): Promise<PoseLandmarker | null> {
  for (const wasmSource of WASM_SOURCES) {
    for (const delegate of POSE_DELEGATES) {
      if (isCancelled()) return null;
      try {
        return await loadPoseLandmarker(wasmSource, delegate);
      } catch {
        continue;
      }
    }
  }
  throw new Error("Posture tracking could not load. Check your connection and press Start Camera to retry.");
}

function drawPose(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  landmarks: { x: number; y: number; visibility?: number }[],
  color: string,
): void {
  const bounds = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.floor(bounds.width * ratio);
  const height = Math.floor(bounds.height * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext("2d");
  if (!context || width === 0 || height === 0) return;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, bounds.width, bounds.height);

  const scale = Math.max(bounds.width / video.videoWidth, bounds.height / video.videoHeight);
  const offsetX = (bounds.width - video.videoWidth * scale) / 2;
  const offsetY = (bounds.height - video.videoHeight * scale) / 2;
  const point = (index: number) => ({
    x: offsetX + landmarks[index]!.x * video.videoWidth * scale,
    y: offsetY + landmarks[index]!.y * video.videoHeight * scale,
  });

  context.lineWidth = 3;
  context.lineCap = "round";
  context.strokeStyle = color;
  context.fillStyle = color;
  for (const [start, end] of POSE_CONNECTIONS) {
    if (
      landmarks[start]!.visibility !== undefined &&
      landmarks[start]!.visibility! < 0.35
    ) continue;
    if (
      landmarks[end]!.visibility !== undefined &&
      landmarks[end]!.visibility! < 0.35
    ) continue;
    const first = point(start);
    const second = point(end);
    context.beginPath();
    context.moveTo(first.x, first.y);
    context.lineTo(second.x, second.y);
    context.stroke();
  }

  for (const landmark of landmarks) {
    if (landmark.visibility !== undefined && landmark.visibility < 0.35) continue;
    const x = offsetX + landmark.x * video.videoWidth * scale;
    const y = offsetY + landmark.y * video.videoHeight * scale;
    context.beginPath();
    context.arc(x, y, 4, 0, Math.PI * 2);
    context.fill();
  }
}

export function SessionWorkspace({ mode = "demo" }: SessionWorkspaceProps) {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { setConnection } = useSessionConnection();
  const protectedMode = mode === "authenticated";
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baselineRef = useRef<PostureBaseline | null>(null);
  const calibrationFramesRef = useRef<NormalizedLandmark[][]>([]);
  const calibrationStartedRef = useRef<number | null>(null);
  const settingsRef = useRef(INITIAL_ALERT_SETTINGS);
  const startedAtRef = useRef<number | null>(null);
  const completedDurationRef = useRef<number | null>(null);
  const slumpStartedRef = useRef<number | null>(null);
  const alertActiveRef = useRef(false);
  const slumpCountRef = useRef(0);
  const scoreTotalRef = useRef(0);
  const scoreSamplesRef = useRef(0);
  const analysisRef = useRef<PostureAnalysis | null>(null);
  const lastSyncRef = useRef(0);
  const syncInFlightRef = useRef(false);
  const backendAvailableRef = useRef(false);
  const predictionClassRef = useRef("");
  const lastNotificationRef = useRef(Number.NEGATIVE_INFINITY);
  const [, refreshNotificationState] = useState(0);
  const notificationPermission = useSyncExternalStore(
    subscribeToPermissionChange,
    readNotificationPermission,
    readUnsupportedAccess,
  );
  const tabHidden = useSyncExternalStore(
    subscribeToVisibility,
    readTabHidden,
    readTabVisible,
  );
  const [stretchOpen, setStretchOpen] = useState(false);
  const [stretchPromptDismissedAt, setStretchPromptDismissedAt] = useState(0);
  const [active, setActive] = useState(false);
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [analysis, setAnalysis] = useState<PostureAnalysis | null>(null);
  const [baseline, setBaseline] = useState<PostureBaseline | null>(null);
  const [calibrationSeconds, setCalibrationSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [slumpCount, setSlumpCount] = useState(0);
  const [alertActive, setAlertActive] = useState(false);
  const [alertSettings, setAlertSettings] = useState(INITIAL_ALERT_SETTINGS);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [predictionClass, setPredictionClass] = useState("Waiting for calibration");
  const [inferenceSource, setInferenceSource] = useState("Local biomechanics");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  settingsRef.current = alertSettings;
  useEffect(() => {
    predictionClassRef.current = predictionClass;
  }, [predictionClass]);

  const postureAlerting =
    active && tabHidden && (analysis?.status ?? "GOOD") !== "GOOD";

  useEffect(() => {
    if (!postureAlerting) return;
    document.title = ALERT_TITLE;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [postureAlerting]);

  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    refreshNotificationState((version) => version + 1);
  }, []);

  const changeActive = useCallback((next: boolean) => {
    setActive(next);
  }, []);

  const beginCalibration = useCallback(() => {
    baselineRef.current = null;
    setBaseline(null);
    calibrationFramesRef.current = [];
    calibrationStartedRef.current = performance.now();
    setCalibrationSeconds(5);
    setAnalysis(null);
    analysisRef.current = null;
    setPredictionClass("Calibrating");
    setInferenceSource("Local biomechanics");
    backendAvailableRef.current = false;
    setError(null);
    slumpStartedRef.current = null;
    alertActiveRef.current = false;
    setAlertActive(false);
  }, []);

  useEffect(() => {
    if (protectedMode && !authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, protectedMode, router]);

  useEffect(() => {
    if (!protectedMode) {
      setAlertSettings(toAlertSettings(loadSettings()));
      return;
    }
    if (!user) return;
    const userId = user.id;
    const profileSettings = user.settings;

    let cancelled = false;
    async function loadAlertSettings() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setSettingsError("Supabase is not configured. Default alert settings are active.");
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .from("user_settings")
          .select(SETTINGS_COLUMNS)
          .eq("user_id", userId)
          .maybeSingle();
        if (cancelled) return;
        if (queryError) {
          setSettingsError(`Could not load alert settings: ${queryError.message}`);
        }
        const resolved = resolveSettings(
          queryError ? {} : settingsFromRow(data),
          profileSettings,
        );
        saveSettings(resolved);
        setAlertSettings(toAlertSettings(resolved));
      } catch (loadError) {
        if (!cancelled) {
          setSettingsError(
            `Could not load alert settings: ${
              loadError instanceof Error ? loadError.message : "unexpected error"
            }`,
          );
        }
      }
    }

    void loadAlertSettings();
    return () => {
      cancelled = true;
    };
  }, [protectedMode, user]);

  useEffect(() => {
    if (protectedMode && (authLoading || !isAuthenticated)) return;
    if (!active) {
      setConnection("standby");
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let landmarker: PoseLandmarker | null = null;
    let frameId = 0;
    let intervalId = 0;
    let handleVisibility: (() => void) | null = null;
    let lastDetectionAt = 0;
    let lastUiUpdateAt = 0;
    const predictUrl = `${
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
    }/api/v1/predict`;

    async function startTracking() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      try {
        setLoadingCamera(true);
        setError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        await waitForVideoFrame(video);
        if (cancelled) return;

        setLoadingCamera(false);
        setPredictionClass("Loading posture model");

        try {
          landmarker = await createPoseLandmarker(() => cancelled);
        } catch (engineError) {
          if (cancelled) return;
          setError(
            engineError instanceof Error ? engineError.message : "Posture tracking could not load.",
          );
          setConnection("offline");
          changeActive(false);
          return;
        }
        if (cancelled || !landmarker) {
          landmarker?.close();
          landmarker = null;
          return;
        }

        setConnection("live");
        beginCalibration();

        const notifyPosture = (timestamp: number, current: PostureAnalysis) => {
          if (
            !document.hidden ||
            current.status === "GOOD" ||
            !settingsRef.current.desktopAlertsEnabled ||
            !("Notification" in window) ||
            Notification.permission !== "granted" ||
            timestamp - lastNotificationRef.current < NOTIFICATION_COOLDOWN_MS
          ) {
            return;
          }
          lastNotificationRef.current = timestamp;
          const classification = predictionClassRef.current || current.postureClass;
          try {
            const notification = new Notification("SpineSense Posture Alert", {
              body: `${classification} detected (Score ${current.score}). ${current.cue}`,
              tag: "spinesense-posture-alert",
              renotify: true,
            } as NotificationOptions);
            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          } catch {
            return;
          }
        };

        const trackFrame = (timestamp: number) => {
          if (cancelled || !landmarker || !video || !canvas) return;
          if (hasVideoFrame(video) && timestamp - lastDetectionAt >= 30) {
            lastDetectionAt = timestamp;
            try {
              const result = landmarker.detectForVideo(video, timestamp);
              const landmarks = result.landmarks[0];
              const calibrationStarted = calibrationStartedRef.current;
              if (calibrationStarted !== null) {
                if (landmarks?.length === 33) calibrationFramesRef.current.push(landmarks);
                const remaining = Math.max(
                  0,
                  5 - Math.floor((timestamp - calibrationStarted) / 1000),
                );
                setCalibrationSeconds(remaining);
                if (timestamp - calibrationStarted >= 5000) {
                  const nextBaseline = createPostureBaseline(calibrationFramesRef.current);
                  calibrationStartedRef.current = null;
                  if (nextBaseline) {
                    baselineRef.current = nextBaseline;
                    setBaseline(nextBaseline);
                    setCalibrationSeconds(0);
                    setPredictionClass("Optimal Upright");
                    setError(null);
                  } else {
                    setCalibrationSeconds(0);
                    setError("Calibration could not detect your upper body. Reposition and recalibrate.");
                  }
                }
              }

              if (landmarks) {
                drawPose(
                  canvas,
                  video,
                  landmarks,
                  STATUS_TONES[analysisRef.current?.status ?? "GOOD"].color,
                );

                const currentBaseline = baselineRef.current;
                if (currentBaseline) {
                  const nextAnalysis = analyzePosture(
                    landmarks,
                    currentBaseline,
                    settingsRef.current.slouchAngleThreshold,
                  );
                  if (nextAnalysis) {
                    const previous = analysisRef.current;
                    const smoothedScore = previous
                      ? Math.round(previous.score * 0.75 + nextAnalysis.score * 0.25)
                      : nextAnalysis.score;
                    const displayAnalysis: PostureAnalysis = {
                      ...nextAnalysis,
                      score: smoothedScore,
                      neckAlignment: previous
                        ? Math.round(previous.neckAlignment * 0.75 + nextAnalysis.neckAlignment * 0.25)
                        : nextAnalysis.neckAlignment,
                      shoulderBalance: previous
                        ? Math.round(previous.shoulderBalance * 0.75 + nextAnalysis.shoulderBalance * 0.25)
                        : nextAnalysis.shoulderBalance,
                      spineUpright: previous
                        ? Math.round(previous.spineUpright * 0.75 + nextAnalysis.spineUpright * 0.25)
                        : nextAnalysis.spineUpright,
                      status:
                        smoothedScore >= 80
                          ? "GOOD"
                          : smoothedScore >= 60
                            ? "WARNING"
                            : "SLUMP",
                    };
                    analysisRef.current = displayAnalysis;
                    scoreTotalRef.current += displayAnalysis.score;
                    scoreSamplesRef.current += 1;
                    notifyPosture(timestamp, displayAnalysis);

                    const settings = settingsRef.current;
                    const belowThreshold =
                      nextAnalysis.forwardHeadDelta >= settings.slouchAngleThreshold ||
                      nextAnalysis.score < 60;
                    if (belowThreshold) {
                      if (slumpStartedRef.current === null) slumpStartedRef.current = timestamp;
                      const graceElapsed =
                        timestamp - slumpStartedRef.current >= settings.gracePeriodSeconds * 1000;
                      if (!alertActiveRef.current && graceElapsed) {
                        alertActiveRef.current = true;
                        setAlertActive(true);
                        slumpCountRef.current += 1;
                        setSlumpCount(slumpCountRef.current);
                        if (settings.audioAlertsEnabled) {
                          playCriticalSlumpAlert(settings.alertVolume);
                        }
                      }
                    } else {
                      slumpStartedRef.current = null;
                      alertActiveRef.current = false;
                      setAlertActive(false);
                    }

                    if (timestamp - lastUiUpdateAt >= 100) {
                      lastUiUpdateAt = timestamp;
                      setAnalysis(displayAnalysis);
                      if (!backendAvailableRef.current) {
                        setPredictionClass(nextAnalysis.postureClass);
                        setInferenceSource("Local biomechanics");
                      }
                    }

                    if (
                      timestamp - lastSyncRef.current >= 500 &&
                      !syncInFlightRef.current
                    ) {
                      lastSyncRef.current = timestamp;
                      syncInFlightRef.current = true;
                      void fetch(predictUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          landmarks: landmarks.slice(0, 33).map((landmark) => ({
                            x: landmark.x,
                            y: landmark.y,
                            z: landmark.z,
                            visibility: landmark.visibility ?? 1,
                          })),
                          baseline: {
                            neck_angle: currentBaseline.neckAngle,
                            shoulder_tilt: currentBaseline.shoulderTilt,
                            torso_compression: currentBaseline.torsoCompression,
                            depth_delta: currentBaseline.depthDelta,
                          },
                          slouch_threshold: settings.slouchAngleThreshold,
                        }),
                      })
                        .then(async (response) => {
                          if (!response.ok) throw new Error(`Prediction request failed with status ${response.status}`);
                          return (await response.json()) as PredictionResponse;
                        })
                        .then((prediction) => {
                          if (cancelled) return;
                          backendAvailableRef.current = true;
                          if (typeof prediction.posture_class === "string") {
                            setPredictionClass(prediction.posture_class);
                          }
                          setInferenceSource(
                            typeof prediction.inference_source === "string"
                              ? prediction.inference_source
                              : "FastAPI",
                          );
                        })
                        .catch(() => {
                          if (!cancelled) {
                            backendAvailableRef.current = false;
                            setPredictionClass(nextAnalysis.postureClass);
                            setInferenceSource("Local biomechanics");
                          }
                        })
                        .finally(() => {
                          syncInFlightRef.current = false;
                        });
                    }
                  } else {
                    slumpStartedRef.current = null;
                    alertActiveRef.current = false;
                    setAlertActive(false);
                  }
                }
              } else {
                const context = canvas.getContext("2d");
                context?.clearRect(0, 0, canvas.width, canvas.height);
                slumpStartedRef.current = null;
                alertActiveRef.current = false;
                setAlertActive(false);
              }
            } catch (trackingError) {
              if (!cancelled) {
                setError(
                  `Pose tracking stopped: ${
                    trackingError instanceof Error ? trackingError.message : "unexpected error"
                  }`,
                );
                changeActive(false);
              }
            }
          }
        };

        const animationLoop = (timestamp: number) => {
          trackFrame(timestamp);
          if (!cancelled && !document.hidden) {
            frameId = window.requestAnimationFrame(animationLoop);
          }
        };

        const startLoop = () => {
          window.cancelAnimationFrame(frameId);
          window.clearInterval(intervalId);
          if (document.hidden) {
            intervalId = window.setInterval(
              () => trackFrame(performance.now()),
              BACKGROUND_INTERVAL_MS,
            );
          } else {
            frameId = window.requestAnimationFrame(animationLoop);
          }
        };

        handleVisibility = startLoop;
        document.addEventListener("visibilitychange", startLoop);
        startLoop();
      } catch (cameraError) {
        if (cancelled) return;
        setLoadingCamera(false);
        setError(
          `Could not start camera tracking: ${
            cameraError instanceof Error ? cameraError.message : "unexpected error"
          }`,
        );
        setConnection("offline");
        changeActive(false);
      }
    }

    void startTracking();
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      window.clearInterval(intervalId);
      if (handleVisibility) {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
      landmarker?.close();
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setLoadingCamera(false);
      setConnection("standby");
      calibrationStartedRef.current = null;
    };
  }, [active, authLoading, beginCalibration, changeActive, isAuthenticated, protectedMode, setConnection]);

  useEffect(() => {
    if (!active) return;
    const interval = window.setInterval(() => {
      if (startedAtRef.current !== null) {
        setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [active]);

  function startSession() {
    startedAtRef.current = Date.now();
    completedDurationRef.current = null;
    baselineRef.current = null;
    analysisRef.current = null;
    slumpStartedRef.current = null;
    alertActiveRef.current = false;
    setBaseline(null);
    setAnalysis(null);
    setAlertActive(false);
    scoreTotalRef.current = 0;
    scoreSamplesRef.current = 0;
    slumpCountRef.current = 0;
    setElapsedSeconds(0);
    setSlumpCount(0);
    setStretchPromptDismissedAt(0);
    setSaved(false);
    setSaveError(null);
    lastSyncRef.current = 0;
    backendAvailableRef.current = false;
    setPredictionClass("Preparing camera");
    setInferenceSource("Local biomechanics");
    lastNotificationRef.current = Number.NEGATIVE_INFINITY;
    void requestNotificationPermission();
    setActive(true);
  }

  async function enableDesktopAlerts() {
    await requestNotificationPermission();
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      new Notification("SpineSense alerts active", {
        body: "Desktop posture alerts will appear when you switch tabs.",
        tag: "spinesense-posture-alert",
      });
    } catch {
      return;
    }
  }

  async function endAndSave() {
    if (!user || (startedAtRef.current === null && completedDurationRef.current === null)) return;
    const duration =
      completedDurationRef.current ??
      Math.max(0, Math.floor((Date.now() - (startedAtRef.current ?? Date.now())) / 1000));
    setActive(false);
    setElapsedSeconds(duration);
    startedAtRef.current = null;
    completedDurationRef.current = duration;
    setSaving(true);
    setSaveError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase is not configured. Session data was not saved.");
      const averageScore =
        scoreSamplesRef.current > 0
          ? scoreTotalRef.current / scoreSamplesRef.current
          : 0;
      const { error: insertError } = await supabase.from("posture_sessions").insert({
        user_id: user.id,
        duration_seconds: duration,
        average_score: averageScore,
        slump_count: slumpCountRef.current,
      });
      if (insertError) throw new Error(`Could not save session: ${insertError.message}`);
      setSaved(true);
      completedDurationRef.current = null;
    } catch (saveFailure) {
      setSaveError(
        saveFailure instanceof Error ? saveFailure.message : "Could not save this session.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (protectedMode && (authLoading || !isAuthenticated)) {
    return (
      <div className="container mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-sm font-medium text-slate-600">
          {authLoading ? "Checking your session" : "Redirecting to sign in"}
        </p>
      </div>
    );
  }

  const showStretchPrompt =
    active &&
    !stretchOpen &&
    slumpCount > 0 &&
    slumpCount % 3 === 0 &&
    stretchPromptDismissedAt !== slumpCount;
  const currentStatus = analysis?.status ?? "GOOD";
  const tone = analysis
    ? STATUS_TONES[currentStatus]
    : { label: "READY", color: "#64748B", background: "bg-slate-100 text-slate-600" };
  const metricValues = [
    ["Neck Alignment", analysis?.neckAlignment ?? 0],
    ["Shoulder Balance", analysis?.shoulderBalance ?? 0],
    ["Spine Upright", analysis?.spineUpright ?? 0],
  ] as const;

  return (
    <div className="container mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:py-10">
      {stretchOpen ? <StretchBreakModal onClose={() => setStretchOpen(false)} /> : null}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            {protectedMode ? "Live workspace" : "Guest demo"}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Live posture session
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Realtime posture scoring runs in your browser. Your webcam feed is not uploaded.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setAlertSettings((settings) => ({
                ...settings,
                audioAlertsEnabled: !settings.audioAlertsEnabled,
              }))
            }
            aria-pressed={alertSettings.audioAlertsEnabled}
            className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold ${
              alertSettings.audioAlertsEnabled
                ? "border-brand bg-brand text-white"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            {alertSettings.audioAlertsEnabled ? (
              <Bell className="h-4 w-4" aria-hidden="true" />
            ) : (
              <BellOff className="h-4 w-4" aria-hidden="true" />
            )}
            Audio {alertSettings.audioAlertsEnabled ? "on" : "off"}
          </button>
          <button
            type="button"
            onClick={() => setPrivacyMode((value) => !value)}
            aria-pressed={privacyMode}
            className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold ${
              privacyMode
                ? "border-slate-800 bg-slate-800 text-white"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            {privacyMode ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
            Skeleton Only Mode
          </button>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Camera tracking</h2>
              <p className="mt-1 text-xs text-slate-500">
                {baseline ? "Baseline calibrated" : "A 5 second neutral baseline is required"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {notificationPermission === "granted" ? (
                <button
                  type="button"
                  onClick={() =>
                    setAlertSettings((settings) => ({
                      ...settings,
                      desktopAlertsEnabled: !settings.desktopAlertsEnabled,
                    }))
                  }
                  aria-pressed={alertSettings.desktopAlertsEnabled}
                  className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
                    alertSettings.desktopAlertsEnabled
                      ? "bg-emerald-50 text-[#059669]"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <BellRing className="h-4 w-4" aria-hidden="true" />
                  Desktop alerts {alertSettings.desktopAlertsEnabled ? "on" : "off"}
                </button>
              ) : notificationPermission === "default" ? (
                <button
                  type="button"
                  onClick={() => void enableDesktopAlerts()}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[#2563EB] px-4 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <BellRing className="h-4 w-4" aria-hidden="true" />
                  Enable desktop alerts
                </button>
              ) : notificationPermission === "denied" ? (
                <span className="inline-flex h-10 items-center gap-2 rounded-full bg-amber-50 px-4 text-sm font-semibold text-amber-800">
                  <BellOff className="h-4 w-4" aria-hidden="true" />
                  Alerts blocked in browser
                </span>
              ) : null}
              {active ? (
                <button
                  type="button"
                  onClick={beginCalibration}
                  className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-brand hover:text-brand"
                >
                  Recalibrate
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setStretchPromptDismissedAt(slumpCount);
                  setStretchOpen(true);
                }}
                className="inline-flex h-10 items-center rounded-xl border border-[#2563EB] bg-white px-4 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
              >
                Stretch break
              </button>
              <button
                type="button"
                onClick={active ? () => changeActive(false) : startSession}
                disabled={loadingCamera}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
              >
                {active ? (
                  <CameraOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Camera className="h-4 w-4" aria-hidden="true" />
                )}
                {loadingCamera ? "Starting camera" : active ? "Stop camera" : "Start Camera"}
              </button>
            </div>
          </div>

          {showStretchPrompt ? (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-[#059669] sm:px-5"
            >
              <span className="font-medium">
                You have slumped {slumpCount} times. A 30 second stretch break can help you reset.
              </span>
              <span className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStretchPromptDismissedAt(slumpCount);
                    setStretchOpen(true);
                  }}
                  className="rounded-lg bg-[#059669] px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Start stretch
                </button>
                <button
                  type="button"
                  onClick={() => setStretchPromptDismissedAt(slumpCount)}
                  className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#059669]"
                >
                  Dismiss
                </button>
              </span>
            </div>
          ) : null}

          <div className={`relative aspect-video min-h-72 overflow-hidden ${privacyMode ? "bg-slate-900" : "bg-slate-100"}`}>
            <video
              ref={videoRef}
              className={`h-full w-full -scale-x-100 object-cover ${
                active && !privacyMode ? "opacity-100" : "opacity-0"
              }`}
              playsInline
              muted
              autoPlay
            />
            <canvas
              ref={canvasRef}
              className={`pointer-events-none absolute inset-0 h-full w-full -scale-x-100 ${
                active ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden="true"
            />
            {active ? (
              <div className="absolute left-1/2 top-4 flex -translate-x-1/2 flex-col items-center gap-2">
                {calibrationSeconds > 0 ? (
                  <p className="rounded-full bg-slate-900/80 px-4 py-2 text-center text-sm font-medium text-white">
                    Hold upright posture for calibration: {calibrationSeconds} seconds
                  </p>
                ) : null}
                {alertActive ? (
                  <p className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                    Slump alert active
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <CameraOff className="h-9 w-9 text-slate-400" aria-hidden="true" />
                <p className="text-sm text-slate-600">
                  Allow camera access to begin realtime tracking.
                </p>
              </div>
            )}
            {error ? (
              <p role="alert" className="absolute bottom-4 left-4 right-4 rounded-xl bg-white px-4 py-3 text-sm text-red-700 shadow">
                {error}
              </p>
            ) : null}
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Posture score</h2>
              <p className="mt-1 text-xs text-slate-500">Score from 0 to 100</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone.background}`}>
              {tone.label}
            </span>
          </div>
          <div className="mt-7 flex items-end justify-center gap-2">
            <span className="text-6xl font-semibold tabular-nums text-slate-900">
              {analysis?.score ?? 0}
            </span>
            <span className="mb-2 text-sm text-slate-500">out of 100</span>
          </div>
          <p className="mt-3 text-center text-sm font-medium text-slate-700">
            {analysis?.cue ??
              (active && calibrationSeconds > 0
                ? "Hold an upright posture while your baseline is captured"
                : "Calibrate to begin your posture analysis")}
          </p>

          <div className="mt-7 space-y-4">
            {metricValues.map(([label, value]) => (
              <div key={label}>
                <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-600">
                  <span>{label}</span>
                  <span>{value}%</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label={label}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={value}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-200"
                    style={{ width: `${value}%`, backgroundColor: tone.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Session time</span>
              <time className="font-mono text-lg font-semibold tabular-nums text-slate-900">
                {formatDuration(elapsedSeconds)}
              </time>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">Slump count</span>
              <span className="font-semibold text-slate-700">{slumpCount}</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Posture classification</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{predictionClass}</p>
            <p className="mt-1 text-xs text-slate-500">Inference source: {inferenceSource}</p>
          </div>
        </aside>
      </div>

      {protectedMode ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-5 text-sm">
            {settingsError ? (
              <p role="alert" className="text-amber-800">{settingsError}</p>
            ) : saveError ? (
              <p role="alert" className="text-red-700">{saveError}</p>
            ) : saved ? (
              <p role="status" className="font-medium text-emerald-700">
                Session summary saved to your dashboard.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void endAndSave()}
            disabled={
              saving ||
              !baseline ||
              scoreSamplesRef.current === 0 ||
              elapsedSeconds === 0 ||
              (!active &&
                !saveError &&
                completedDurationRef.current === null &&
                startedAtRef.current === null)
            }
            className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving session" : "End Session & Save"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
