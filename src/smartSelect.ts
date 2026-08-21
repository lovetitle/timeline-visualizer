import type { GeoPoint } from './types';
import { cumulativeDistances, haversineKm } from './geo';
import { pointDateKey, selectDateRange, selectRange } from './timeline';

export function suggestDurationSeconds(totalDistanceKm: number): number {
  if (totalDistanceKm < 30) return 15;
  if (totalDistanceKm < 120) return 30;
  if (totalDistanceKm < 400) return 45;
  if (totalDistanceKm < 1200) return 60;
  if (totalDistanceKm < 3000) return 90;
  return 120;
}

export function selectThisYear(points: GeoPoint[], year = new Date().getFullYear()): GeoPoint[] {
  const start = `${year}-01`;
  const end = `${year}-12`;
  return selectRange(points, start, end);
}

/** Prefer a contiguous window with the largest movement in the last N days. */
export function selectRecentTrip(points: GeoPoint[], windowDays = 14): GeoPoint[] {
  if (points.length < 2) return points;
  const keys = points.map(pointDateKey);
  const last = keys.at(-1)!;
  const end = new Date(`${last}T00:00:00`);
  const start = new Date(end);
  start.setDate(start.getDate() - (windowDays - 1));
  const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  const window = selectDateRange(points, startKey, last);
  if (window.length >= 2) return window;
  return points.slice(Math.max(0, points.length - 40));
}

/** Heuristic: largest long-hop cluster away from the median home-ish point. */
export function selectLikelyAbroad(points: GeoPoint[]): GeoPoint[] {
  if (points.length < 4) return points;
  const home = points[Math.floor(points.length * 0.1)];
  let bestStart = 0;
  let bestEnd = points.length - 1;
  let bestScore = 0;
  let runStart = 0;
  for (let index = 1; index < points.length; index += 1) {
    const far = haversineKm(home, points[index]) > 400;
    if (!far) {
      if (index - 1 > runStart) {
        const slice = points.slice(runStart, index);
        const score = cumulativeDistances(slice).at(-1) ?? 0;
        if (score > bestScore) {
          bestScore = score;
          bestStart = runStart;
          bestEnd = index - 1;
        }
      }
      runStart = index;
    }
  }
  const tail = points.slice(runStart);
  const tailScore = cumulativeDistances(tail).at(-1) ?? 0;
  if (tailScore > bestScore) {
    bestStart = runStart;
    bestEnd = points.length - 1;
  }
  if (bestScore < 80) return selectRecentTrip(points, 21);
  return points.slice(bestStart, bestEnd + 1);
}

/** Drop leading/trailing days that barely move. */
export function trimIdleEdges(points: GeoPoint[], minDayKm = 3): GeoPoint[] {
  if (points.length < 3) return points;
  const byDay = new Map<string, GeoPoint[]>();
  for (const point of points) {
    const key = pointDateKey(point);
    const list = byDay.get(key) ?? [];
    list.push(point);
    byDay.set(key, list);
  }
  const days = [...byDay.keys()].sort();
  const dayDistance = (key: string): number => cumulativeDistances(byDay.get(key) ?? []).at(-1) ?? 0;

  let start = 0;
  while (start < days.length - 1 && dayDistance(days[start]) < minDayKm) start += 1;
  let end = days.length - 1;
  while (end > start && dayDistance(days[end]) < minDayKm) end -= 1;

  const keep = new Set(days.slice(start, end + 1));
  return points.filter((point) => keep.has(pointDateKey(point)));
}

export function rangeBounds(points: GeoPoint[]): { startMonth: string; endMonth: string; startDate: string; endDate: string } | null {
  if (points.length === 0) return null;
  const dates = points.map(pointDateKey).sort();
  return {
    startMonth: dates[0].slice(0, 7),
    endMonth: dates.at(-1)!.slice(0, 7),
    startDate: dates[0],
    endDate: dates.at(-1)!,
  };
}
