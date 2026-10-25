export type ReportFrequency = "weekly" | "monthly";
export type GracePeriodSeconds = 3 | 5 | 10;

export interface UserSettings {
  emailReportsEnabled: boolean;
  reportFrequency: ReportFrequency;
  slouchSensitivityDeg: number;
  gracePeriodSeconds: GracePeriodSeconds;
  audioAlertsEnabled: boolean;
  audioVolume: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  emailReportsEnabled: true,
  reportFrequency: "weekly",
  slouchSensitivityDeg: 20,
  gracePeriodSeconds: 5,
  audioAlertsEnabled: true,
  audioVolume: 0.7,
};

export const SETTINGS_STORAGE_KEY = "spinesense.settings.v1";

export function loadSettings(): UserSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      slouchSensitivityDeg: clamp(
        Number(parsed.slouchSensitivityDeg ?? DEFAULT_SETTINGS.slouchSensitivityDeg),
        15,
        30,
      ),
      audioVolume: clamp(
        Number(parsed.audioVolume ?? DEFAULT_SETTINGS.audioVolume),
        0,
        1,
      ),
      gracePeriodSeconds: normalizeGrace(parsed.gracePeriodSeconds),
      reportFrequency:
        parsed.reportFrequency === "monthly" ? "monthly" : "weekly",
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeGrace(value: unknown): GracePeriodSeconds {
  if (value === 3 || value === 5 || value === 10) return value;
  return DEFAULT_SETTINGS.gracePeriodSeconds;
}
