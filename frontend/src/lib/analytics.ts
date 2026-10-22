import type { AnalyticsSummary, SlumpBucket, TrendPoint } from "@/types/posture";

export const SAMPLE_SUMMARY: AnalyticsSummary = {
  totalSessionSeconds: 12 * 3600 + 34 * 60,
  averageScore: 82,
  slumpCount: 17,
};

export const WEEKLY_TREND: TrendPoint[] = [
  { label: "Mon", score: 74, slumps: 4 },
  { label: "Tue", score: 81, slumps: 2 },
  { label: "Wed", score: 69, slumps: 5 },
  { label: "Thu", score: 86, slumps: 1 },
  { label: "Fri", score: 78, slumps: 3 },
  { label: "Sat", score: 90, slumps: 1 },
  { label: "Sun", score: 84, slumps: 1 },
];

export const SLUMP_BY_PERIOD: SlumpBucket[] = [
  { label: "Morning", slumps: 3 },
  { label: "Midday", slumps: 7 },
  { label: "Afternoon", slumps: 5 },
  { label: "Evening", slumps: 2 },
];
