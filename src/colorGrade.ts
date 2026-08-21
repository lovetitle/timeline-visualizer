import type { GeoPoint } from './types';

/** Approximate solar elevation factor 0..1 for gentle color grading (no network). */
export function daylightFactor(instant: Date, latitude: number): number {
  const day = Math.floor(
    (Date.UTC(instant.getFullYear(), instant.getMonth(), instant.getDate())
      - Date.UTC(instant.getFullYear(), 0, 0)) / 86_400_000,
  );
  const decl = 23.44 * Math.sin(((360 / 365) * (day - 81) * Math.PI) / 180);
  const hourAngle = (instant.getHours() + instant.getMinutes() / 60 - 12) * 15;
  const sinAlt = Math.sin((latitude * Math.PI) / 180) * Math.sin((decl * Math.PI) / 180)
    + Math.cos((latitude * Math.PI) / 180) * Math.cos((decl * Math.PI) / 180)
      * Math.cos((hourAngle * Math.PI) / 180);
  return Math.max(0, Math.min(1, (sinAlt + 0.2) / 1.2));
}

export type ColorGradeMode = 'off' | 'auto' | 'warm' | 'cool' | 'night';

export function gradeFillStyle(mode: ColorGradeMode, factor: number): string | null {
  if (mode === 'off') return null;
  if (mode === 'warm') return 'rgba(255, 140, 60, 0.12)';
  if (mode === 'cool') return 'rgba(60, 120, 200, 0.12)';
  if (mode === 'night') return 'rgba(10, 20, 50, 0.28)';
  // auto
  if (factor < 0.25) return 'rgba(20, 30, 70, 0.22)';
  if (factor > 0.75) return 'rgba(255, 210, 140, 0.1)';
  return null;
}

export function gradeForProgress(points: GeoPoint[], progress: number, mode: ColorGradeMode): string | null {
  if (mode === 'off' || points.length === 0) return null;
  const index = Math.max(0, Math.min(points.length - 1, Math.floor(progress * (points.length - 1))));
  const point = points[index];
  return gradeFillStyle(mode, daylightFactor(point.instant, point.latitude));
}
