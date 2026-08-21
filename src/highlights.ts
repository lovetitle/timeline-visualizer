import type { GeoPoint } from './types';
import { haversineKm } from './geo';
import { pointDateKey } from './timeline';
import { suggestSmartClips, type ClipSuggestion } from './smartClips';

/** Higher score = more “highlight-worthy” (distance density + turniness). */
export function scoreHighlightWindow(points: GeoPoint[], start: number, end: number): number {
  if (end <= start + 1) return 0;
  let distance = 0;
  let turns = 0;
  let prevBearing: number | null = null;
  for (let index = start + 1; index <= end; index += 1) {
    distance += haversineKm(points[index - 1], points[index]);
    const bearing = Math.atan2(
      points[index].longitude - points[index - 1].longitude,
      points[index].latitude - points[index - 1].latitude,
    );
    if (prevBearing !== null) {
      const delta = Math.abs(bearing - prevBearing);
      turns += Math.min(delta, Math.PI * 2 - delta);
    }
    prevBearing = bearing;
  }
  const hours = Math.max(
    0.05,
    (points[end].instant.getTime() - points[start].instant.getTime()) / 3_600_000,
  );
  return distance * 1.4 + turns * 8 + distance / hours * 0.15;
}

export function bestHighlightClip(
  points: GeoPoint[],
  cumulativeKm: number[],
  targetSeconds: 15 | 30 | 60 = 30,
): ClipSuggestion | null {
  const clips = suggestSmartClips(points, cumulativeKm).filter((clip) => clip.targetSeconds === targetSeconds);
  if (clips.length === 0) {
    const all = suggestSmartClips(points, cumulativeKm);
    return all[0] ?? null;
  }
  let best = clips[0];
  let bestScore = -1;
  for (const clip of clips) {
    const start = Math.floor(clip.startProgress * (points.length - 1));
    const end = Math.floor(clip.endProgress * (points.length - 1));
    const score = scoreHighlightWindow(points, start, end);
    if (score > bestScore) {
      bestScore = score;
      best = clip;
    }
  }
  return { ...best, label: `${targetSeconds}s★` };
}

export function yearWrappedStats(points: GeoPoint[]): {
  year: number;
  days: number;
  km: number;
  citiesApprox: number;
  farthestDate: string;
} {
  if (points.length === 0) {
    return { year: new Date().getFullYear(), days: 0, km: 0, citiesApprox: 0, farthestDate: '' };
  }
  const year = points[0].instant.getFullYear();
  const days = new Set(points.map(pointDateKey)).size;
  let km = 0;
  let farthest = 0;
  let farthestDate = pointDateKey(points[0]);
  const dayKm = new Map<string, number>();
  for (let index = 1; index < points.length; index += 1) {
    const segment = haversineKm(points[index - 1], points[index]);
    km += segment;
    const day = pointDateKey(points[index]);
    dayKm.set(day, (dayKm.get(day) ?? 0) + segment);
  }
  for (const [day, value] of dayKm) {
    if (value > farthest) {
      farthest = value;
      farthestDate = day;
    }
  }
  return {
    year,
    days,
    km: Math.round(km),
    citiesApprox: Math.max(1, Math.round(days / 3)),
    farthestDate,
  };
}
