import type { GeoPoint } from './types';
import { haversineKm } from './geo';
import { pointDateKey } from './timeline';

export interface ClipSuggestion {
  id: string;
  label: string;
  targetSeconds: 15 | 30 | 60;
  startProgress: number;
  endProgress: number;
  startDate: string;
  endDate: string;
  scoreKm: number;
}

/** Pick densest movement windows as clip candidates. */
export function suggestSmartClips(points: GeoPoint[], cumulativeKm: number[]): ClipSuggestion[] {
  if (points.length < 4 || cumulativeKm.length !== points.length) return [];
  const total = cumulativeKm.at(-1) ?? 0;
  if (total <= 0) return [];

  const windows: { start: number; end: number; km: number }[] = [];
  const step = Math.max(1, Math.floor(points.length / 80));
  for (let start = 0; start < points.length - 2; start += step) {
    for (const span of [Math.floor(points.length * 0.08), Math.floor(points.length * 0.18), Math.floor(points.length * 0.35)]) {
      const end = Math.min(points.length - 1, start + Math.max(3, span));
      const km = cumulativeKm[end] - cumulativeKm[start];
      windows.push({ start, end, km });
    }
  }
  windows.sort((a, b) => b.km - a.km);

  const picked: ClipSuggestion[] = [];
  const targets: Array<15 | 30 | 60> = [15, 30, 60];
  for (const target of targets) {
    const hit = windows.find((window) => {
      const overlap = picked.some((clip) => {
        const a0 = clip.startProgress;
        const a1 = clip.endProgress;
        const b0 = cumulativeKm[window.start] / total;
        const b1 = cumulativeKm[window.end] / total;
        return !(a1 < b0 || b1 < a0);
      });
      return !overlap && window.km > total * 0.04;
    }) ?? windows[picked.length] ?? windows[0];
    if (!hit) continue;
    const startProgress = cumulativeKm[hit.start] / total;
    const endProgress = Math.max(startProgress + 0.05, cumulativeKm[hit.end] / total);
    picked.push({
      id: `clip-${target}-${hit.start}`,
      label: `${target}s`,
      targetSeconds: target,
      startProgress,
      endProgress: Math.min(1, endProgress),
      startDate: pointDateKey(points[hit.start]),
      endDate: pointDateKey(points[hit.end]),
      scoreKm: hit.km,
    });
  }
  return picked;
}

export function speedKmhAt(
  points: GeoPoint[],
  cumulativeKm: number[],
  progress: number,
): { distanceKm: number; speedKmh: number } {
  const total = cumulativeKm.at(-1) ?? 0;
  const distanceKm = total * Math.max(0, Math.min(1, progress));
  if (points.length < 2 || total <= 0) return { distanceKm: 0, speedKmh: 0 };
  const index = Math.max(1, Math.min(points.length - 1, Math.floor(progress * (points.length - 1))));
  const prev = points[index - 1];
  const curr = points[index];
  const hours = Math.max(1 / 3600, (curr.instant.getTime() - prev.instant.getTime()) / 3_600_000);
  const km = haversineKm(prev, curr);
  return { distanceKm, speedKmh: km / hours };
}
