import type { GeoPoint } from './types';

export interface PrivacyZone {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function inferPrivacyZones(points: GeoPoint[], radiusKm = 1.2): PrivacyZone[] {
  if (points.length < 10) return [];
  const sample = [
    ...points.slice(0, Math.min(40, points.length)),
    ...points.slice(Math.max(0, points.length - 40)),
  ];
  const anchors: PrivacyZone[] = [];
  for (const candidate of sample) {
    const nearby = sample.filter((point) => distanceKm(candidate, point) < radiusKm).length;
    if (nearby < 8) continue;
    if (anchors.some((zone) => distanceKm(zone, candidate) < radiusKm)) continue;
    anchors.push({
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      radiusKm,
    });
    if (anchors.length >= 2) break;
  }
  return anchors;
}

export function blurPointsNearZones(points: GeoPoint[], zones: PrivacyZone[]): GeoPoint[] {
  if (zones.length === 0) return points;
  return points.map((point) => {
    const zone = zones.find((item) => distanceKm(item, point) <= item.radiusKm);
    if (!zone) return point;
    return {
      ...point,
      latitude: zone.latitude,
      longitude: zone.longitude,
    };
  });
}
