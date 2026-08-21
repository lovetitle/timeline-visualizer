import type { GeoPoint } from './types';
import { pointDateKey } from './timeline';
import { nearestCityLabel } from './places';

export interface Chapter {
  label: string;
  startProgress: number;
  endProgress: number;
}

export function buildDayChapters(
  points: GeoPoint[],
  cumulativeDistanceKm: number[],
  locale: 'zh' | 'en',
): Chapter[] {
  if (points.length === 0) return [];
  const total = cumulativeDistanceKm.at(-1) ?? 0;
  if (total <= 0) return [];
  const chapters: Chapter[] = [];
  let day = pointDateKey(points[0]);
  let startProgress = 0;
  for (let index = 1; index < points.length; index += 1) {
    const key = pointDateKey(points[index]);
    if (key === day) continue;
    const endProgress = (cumulativeDistanceKm[index - 1] ?? 0) / total;
    chapters.push({
      label: locale === 'en' ? day : day.replaceAll('-', '/'),
      startProgress,
      endProgress,
    });
    day = key;
    startProgress = endProgress;
  }
  chapters.push({
    label: locale === 'en' ? day : day.replaceAll('-', '/'),
    startProgress,
    endProgress: 1,
  });
  return chapters;
}

export function buildCityChapters(
  points: GeoPoint[],
  cumulativeDistanceKm: number[],
  locale: 'zh' | 'en',
): Chapter[] {
  if (points.length === 0) return [];
  const total = cumulativeDistanceKm.at(-1) ?? 0;
  if (total <= 0) return [];
  const chapters: Chapter[] = [];
  let current = nearestCityLabel(points[0], locale) ?? (locale === 'en' ? 'On the road' : '旅途中');
  let startProgress = 0;
  for (let index = 1; index < points.length; index += 1) {
    const label = nearestCityLabel(points[index], locale) ?? current;
    if (label === current) continue;
    const endProgress = (cumulativeDistanceKm[index] ?? 0) / total;
    if (endProgress - startProgress > 0.02) {
      chapters.push({ label: current, startProgress, endProgress });
      startProgress = endProgress;
    }
    current = label;
  }
  chapters.push({ label: current, startProgress, endProgress: 1 });
  return chapters;
}

export function chapterAt(chapters: Chapter[], progress: number): string | null {
  const hit = chapters.find((chapter) => progress >= chapter.startProgress && progress <= chapter.endProgress);
  return hit?.label ?? chapters.at(-1)?.label ?? null;
}

export function chapterLabelFor(
  mode: string,
  points: GeoPoint[],
  cumulativeDistanceKm: number[],
  progress: number,
  locale: 'zh' | 'en',
): string | null {
  if (mode === 'day') return chapterAt(buildDayChapters(points, cumulativeDistanceKm, locale), progress);
  if (mode === 'city') return chapterAt(buildCityChapters(points, cumulativeDistanceKm, locale), progress);
  return null;
}
