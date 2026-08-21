import type { GeoPoint } from './types';

/** Keep memory safer on phones: cap point count with time+distance aware thinning. */
export function downsamplePoints(points: GeoPoint[], maxPoints = 12_000): {
  points: GeoPoint[];
  removed: number;
} {
  if (points.length <= maxPoints) return { points, removed: 0 };
  const step = Math.ceil(points.length / maxPoints);
  const kept: GeoPoint[] = [];
  for (let index = 0; index < points.length; index += step) {
    kept.push(points[index]);
  }
  const last = points.at(-1);
  if (last && kept.at(-1) !== last) kept.push(last);
  return { points: kept, removed: points.length - kept.length };
}

export function suggestMaxPoints(): number {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memory === 'number' && memory <= 2) return 6_000;
  if (typeof memory === 'number' && memory <= 4) return 10_000;
  return 14_000;
}
