import type { GeoPoint } from './types';

export type ActivityKind = 'fly' | 'drive' | 'walk' | 'other';

export function classifyActivity(raw?: string): ActivityKind {
  const value = (raw ?? '').toUpperCase();
  if (value.includes('FLY') || value.includes('AIR')) return 'fly';
  if (value.includes('WALK') || value.includes('RUN') || value.includes('CYCLE') || value.includes('BIKE')) {
    return 'walk';
  }
  if (
    value.includes('VEHICLE')
    || value.includes('CAR')
    || value.includes('BUS')
    || value.includes('TRAIN')
    || value.includes('SUBWAY')
    || value.includes('MOTOR')
  ) {
    return 'drive';
  }
  return 'other';
}

/** Weight for timing: lower = move through faster on screen. */
export function activityWeight(kind: ActivityKind): number {
  switch (kind) {
    case 'fly':
      return 0.35;
    case 'drive':
      return 0.75;
    case 'walk':
      return 1.45;
    default:
      return 1;
  }
}

export function createActivityDistanceAtProgress(
  points: GeoPoint[],
  cumulativeDistanceKm: number[],
): ((progress: number) => number) | null {
  if (points.length < 2 || !points.some((point) => point.activityType)) return null;
  const totalKm = cumulativeDistanceKm.at(-1) ?? 0;
  if (totalKm <= 0) return null;

  const distances = [0];
  const effective = [0];
  let effectiveTotal = 0;
  for (let index = 1; index < cumulativeDistanceKm.length; index += 1) {
    const segment = cumulativeDistanceKm[index] - cumulativeDistanceKm[index - 1];
    const kind = classifyActivity(points[index]?.activityType ?? points[index - 1]?.activityType);
    const weight = activityWeight(kind);
    effectiveTotal += Math.max(0, segment) * weight;
    distances.push(cumulativeDistanceKm[index]);
    effective.push(effectiveTotal);
  }
  if (effectiveTotal <= 0) return null;

  return (progress: number) => {
    const target = Math.max(0, Math.min(1, progress)) * effectiveTotal;
    let low = 0;
    let high = effective.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (effective[mid] < target) low = mid + 1;
      else high = mid;
    }
    const index = Math.max(1, low);
    const beforeE = effective[index - 1];
    const afterE = effective[index];
    const beforeD = distances[index - 1];
    const afterD = distances[index];
    if (afterE === beforeE) return afterD;
    const t = (target - beforeE) / (afterE - beforeE);
    return beforeD + (afterD - beforeD) * t;
  };
}
