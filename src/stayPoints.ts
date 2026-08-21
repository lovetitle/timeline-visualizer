import type { GeoPoint } from './types';
import { haversineKm } from './geo';
import { pointDateKey } from './timeline';

export interface StayPoint {
  latitude: number;
  longitude: number;
  label: string;
  dwellMinutes: number;
}

export function detectStayPoints(points: GeoPoint[], minMinutes = 25, radiusKm = 0.12): StayPoint[] {
  if (points.length < 3) return [];
  const stays: StayPoint[] = [];
  let clusterStart = 0;
  for (let index = 1; index <= points.length; index += 1) {
    const ended = index === points.length
      || haversineKm(points[clusterStart], points[index]) > radiusKm;
    if (!ended) continue;
    const slice = points.slice(clusterStart, index);
    const minutes = (slice.at(-1)!.instant.getTime() - slice[0].instant.getTime()) / 60_000;
    if (minutes >= minMinutes) {
      const lat = slice.reduce((sum, point) => sum + point.latitude, 0) / slice.length;
      const lon = slice.reduce((sum, point) => sum + point.longitude, 0) / slice.length;
      stays.push({
        latitude: lat,
        longitude: lon,
        label: pointDateKey(slice[0]),
        dwellMinutes: Math.round(minutes),
      });
    }
    clusterStart = index;
  }
  return stays.slice(0, 40);
}
