import type { GeoPoint } from './types';
import { haversineKm } from './geo';
import { pointDateKey } from './timeline';
import { nearestCityLabel } from './places';

export interface JourneyStats {
  pointCount: number;
  totalKm: number;
  dayCount: number;
  cityCount: number;
  cities: string[];
  farthestDay: { date: string; km: number } | null;
  dayKm: { date: string; km: number }[];
  startDate: string;
  endDate: string;
}

export function computeJourneyStats(points: GeoPoint[], locale: 'zh' | 'en'): JourneyStats {
  if (points.length === 0) {
    return {
      pointCount: 0,
      totalKm: 0,
      dayCount: 0,
      cityCount: 0,
      cities: [],
      farthestDay: null,
      dayKm: [],
      startDate: '',
      endDate: '',
    };
  }
  const dayMap = new Map<string, number>();
  let totalKm = 0;
  for (let index = 1; index < points.length; index += 1) {
    const segment = haversineKm(points[index - 1], points[index]);
    totalKm += segment;
    const day = pointDateKey(points[index]);
    dayMap.set(day, (dayMap.get(day) ?? 0) + segment);
  }
  const dayKm = [...dayMap.entries()]
    .map(([date, km]) => ({ date, km }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const farthestDay = dayKm.reduce<(typeof dayKm)[number] | null>((best, row) => (
    !best || row.km > best.km ? row : best
  ), null);
  const citySet = new Set<string>();
  for (const point of points) {
    const label = nearestCityLabel(point, locale);
    if (label) citySet.add(label);
  }
  const dates = points.map(pointDateKey).sort();
  return {
    pointCount: points.length,
    totalKm,
    dayCount: dayMap.size,
    cityCount: citySet.size,
    cities: [...citySet].slice(0, 24),
    farthestDay,
    dayKm,
    startDate: dates[0] ?? '',
    endDate: dates.at(-1) ?? '',
  };
}
