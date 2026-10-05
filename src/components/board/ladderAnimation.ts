import { getCellCenter } from '@/game/rules/boardConfig';

// Each rung is an evenly spaced point along the artwork's ladder endpoints.
// The perpendicular offset alternates to suggest hands and feet changing sides.
export function ladderFrames(from: number, to: number, width: number, height: number) {
  const a = getCellCenter(from), b = getCellCenter(to);
  const dx = (b.x - a.x) * width / 100;
  const dy = (b.y - a.y) * height / 100;
  const length = Math.hypot(dx, dy);
  const rungs = Math.max(7, Math.min(15, Math.round(length / 36)));
  const sideX = -dy / length, sideY = dx / length;
  const frames: Keyframe[] = [
    { transform: 'translate(-50%, -50%)', offset: 0 },
    { transform: 'translate(-50%, -50%)', offset: .08 },
  ];
  for (let rung = 1; rung <= rungs; rung++) {
    const t = rung / (rungs + 1);
    const sway = (rung % 2 ? 1 : -1) * Math.min(5, width * .006);
    const x = dx * t + sideX * sway;
    const y = dy * t + sideY * sway - Math.min(4, height * .004);
    frames.push({ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`, offset: .08 + .82 * Math.pow(t, .86) });
  }
  frames.push({ transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy - 9}px))`, offset: .94 });
  frames.push({ transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`, offset: 1 });
  return { frames, duration: Math.max(1500, Math.min(2300, 1350 + length * 1.2)) };
}
