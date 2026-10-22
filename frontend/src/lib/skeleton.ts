import type { Joint, PostureStatus } from "@/types/posture";

export const DEMO_JOINTS: readonly Joint[] = [
  { x: 0.5, y: 0.16 },
  { x: 0.5, y: 0.28 },
  { x: 0.34, y: 0.32 },
  { x: 0.66, y: 0.32 },
  { x: 0.28, y: 0.5 },
  { x: 0.72, y: 0.5 },
  { x: 0.33, y: 0.66 },
  { x: 0.67, y: 0.66 },
  { x: 0.5, y: 0.46 },
  { x: 0.4, y: 0.7 },
  { x: 0.6, y: 0.7 },
];

export const DEMO_BONES: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 2],
  [1, 3],
  [2, 4],
  [3, 5],
  [4, 6],
  [5, 7],
  [1, 8],
  [8, 9],
  [8, 10],
  [9, 10],
];

const BONE_COLOR: Record<PostureStatus, string> = {
  GOOD: "#10B981",
  WARNING: "#F59E0B",
  SLUMPING: "#EF4444",
};

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  joints: readonly Joint[],
  bones: readonly (readonly [number, number])[],
  status: PostureStatus,
): void {
  const slump = status === "SLUMPING" ? 0.045 : status === "WARNING" ? 0.02 : 0;
  const points = joints.map((joint, index) => {
    const drop = index <= 8 ? slump : slump * 0.35;
    return {
      x: joint.x * width,
      y: (joint.y + drop) * height,
    };
  });

  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = BONE_COLOR[status];
  ctx.lineWidth = Math.max(3, width * 0.006);
  ctx.globalAlpha = 0.95;

  for (const [start, end] of bones) {
    const a = points[start];
    const b = points[end];
    if (!a || !b) continue;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  points.forEach((point, index) => {
    const isSpine = index === 1 || index === 8;
    const radius = isSpine ? Math.max(7, width * 0.014) : Math.max(4.5, width * 0.009);

    if (isSpine) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(99, 102, 241, 0.22)";
      ctx.arc(point.x, point.y, radius * 2.1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.fillStyle = "#6366F1";
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();
  });

  ctx.globalAlpha = 1;
}
