export type ReportFrequency = "weekly" | "monthly";
export type GracePeriodSeconds = 3 | 5 | 10;

export interface UserSettings {
  emailReportsEnabled: boolean;
  reportFrequency: ReportFrequency;
  slouchSensitivityDeg: number;
  gracePeriodSeconds: GracePeriodSeconds;
  audioAlertsEnabled: boolean;
  audioVolume: number;
  desktopAlertsEnabled: boolean;
  dailyGoalMinutes: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  emailReportsEnabled: true,
  reportFrequency: "weekly",
  slouchSensitivityDeg: 20,
  gracePeriodSeconds: 5,
  audioAlertsEnabled: true,
  audioVolume: 0.7,
  desktopAlertsEnabled: true,
  dailyGoalMinutes: 30,
};

export const SETTINGS_STORAGE_KEY = "spinesense.settings.v1";
export const SETTINGS_COLUMNS =
  "email_reports_enabled, report_frequency, slouch_sensitivity, grace_period_seconds, audio_alerts_enabled, audio_volume";

export function normalizeSettings(raw: Partial<UserSettings>): UserSettings {
  const merged = { ...DEFAULT_SETTINGS, ...raw };
  return {
    emailReportsEnabled: Boolean(merged.emailReportsEnabled),
    reportFrequency: merged.reportFrequency === "monthly" ? "monthly" : "weekly",
    slouchSensitivityDeg: clamp(Number(merged.slouchSensitivityDeg), 15, 30),
    gracePeriodSeconds: normalizeGrace(merged.gracePeriodSeconds),
    audioAlertsEnabled: Boolean(merged.audioAlertsEnabled),
    audioVolume: clamp(Number(merged.audioVolume), 0, 1),
    desktopAlertsEnabled: Boolean(merged.desktopAlertsEnabled),
    dailyGoalMinutes: Math.round(clamp(Number(merged.dailyGoalMinutes), 10, 240)),
  };
}

export function resolveSettings(...layers: Partial<UserSettings>[]): UserSettings {
  return normalizeSettings(Object.assign({}, ...layers) as Partial<UserSettings>);
}

export function settingsFromRow(
  row: Record<string, unknown> | null | undefined,
): Partial<UserSettings> {
  if (!row) return {};
  const settings: Partial<UserSettings> = {};
  if (typeof row.email_reports_enabled === "boolean") {
    settings.emailReportsEnabled = row.email_reports_enabled;
  }
  if (row.report_frequency === "weekly" || row.report_frequency === "monthly") {
    settings.reportFrequency = row.report_frequency;
  }
  if (row.slouch_sensitivity !== null && row.slouch_sensitivity !== undefined) {
    settings.slouchSensitivityDeg = Number(row.slouch_sensitivity);
  }
  if (row.grace_period_seconds !== null && row.grace_period_seconds !== undefined) {
    settings.gracePeriodSeconds = normalizeGrace(Number(row.grace_period_seconds));
  }
  if (typeof row.audio_alerts_enabled === "boolean") {
    settings.audioAlertsEnabled = row.audio_alerts_enabled;
  }
  if (row.audio_volume !== null && row.audio_volume !== undefined) {
    settings.audioVolume = Number(row.audio_volume);
  }
  return settings;
}

export function settingsFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Partial<UserSettings> {
  if (!metadata) return {};
  const settings: Partial<UserSettings> = {};
  if (typeof metadata.email_reports_enabled === "boolean") {
    settings.emailReportsEnabled = metadata.email_reports_enabled;
  }
  if (metadata.report_frequency === "weekly" || metadata.report_frequency === "monthly") {
    settings.reportFrequency = metadata.report_frequency;
  }
  if (typeof metadata.slouch_angle_threshold === "number") {
    settings.slouchSensitivityDeg = metadata.slouch_angle_threshold;
  }
  if (typeof metadata.grace_period_seconds === "number") {
    settings.gracePeriodSeconds = normalizeGrace(metadata.grace_period_seconds);
  }
  if (typeof metadata.audio_alerts_enabled === "boolean") {
    settings.audioAlertsEnabled = metadata.audio_alerts_enabled;
  }
  if (typeof metadata.audio_volume === "number") {
    settings.audioVolume = metadata.audio_volume;
  }
  if (typeof metadata.desktop_alerts_enabled === "boolean") {
    settings.desktopAlertsEnabled = metadata.desktop_alerts_enabled;
  }
  if (typeof metadata.daily_goal_minutes === "number") {
    settings.dailyGoalMinutes = metadata.daily_goal_minutes;
  }
  return settings;
}

export function settingsToMetadata(settings: UserSettings): Record<string, unknown> {
  return {
    email_reports_enabled: settings.emailReportsEnabled,
    report_frequency: settings.reportFrequency,
    slouch_angle_threshold: settings.slouchSensitivityDeg,
    grace_period_seconds: settings.gracePeriodSeconds,
    audio_alerts_enabled: settings.audioAlertsEnabled,
    audio_volume: settings.audioVolume,
    desktop_alerts_enabled: settings.desktopAlertsEnabled,
    daily_goal_minutes: settings.dailyGoalMinutes,
  };
}

export function loadSettings(): UserSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return normalizeSettings(JSON.parse(raw) as Partial<UserSettings>);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    return;
  }
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeGrace(value: unknown): GracePeriodSeconds {
  if (value === 3 || value === 5 || value === 10) return value;
  return DEFAULT_SETTINGS.gracePeriodSeconds;
}
