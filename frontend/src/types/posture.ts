export type PostureStatus = "GOOD" | "WARNING" | "SLUMPING";

export type ConnectionState = "live" | "standby" | "offline";

export interface Joint {
  x: number;
  y: number;
}

export interface AnalyticsSummary {
  totalSessionSeconds: number;
  averageScore: number;
  slumpCount: number;
}

export interface TrendPoint {
  label: string;
  score: number | null;
  slumps: number;
}

export interface SlumpBucket {
  label: string;
  slumps: number;
}
