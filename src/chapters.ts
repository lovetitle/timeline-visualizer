import type { Locale } from './i18n';
import { L } from './localeUtil';
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
  locale: Locale,
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
  locale: Locale,
): Chapter[] {
  if (points.length === 0) return [];
  const total = cumulativeDistanceKm.at(-1) ?? 0;
  if (total <= 0) return [];
  const chapters: Chapter[] = [];
  const onRoad = L(locale, '旅途中', 'On the road', '移動中', '이동 중');
  let current = nearestCityLabel(points[0], locale) ?? onRoad;
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

export function chapterLabelFor(
  mode: 'off' | 'day' | 'city' | string,
  points: GeoPoint[],
  cumulativeDistanceKm: number[],
  progress: number,
  locale: Locale,
): string | null {
  if (mode === 'off') return null;
  const chapters = mode === 'city'
    ? buildCityChapters(points, cumulativeDistanceKm, locale)
    : buildDayChapters(points, cumulativeDistanceKm, locale);
  for (const chapter of chapters) {
    if (progress >= chapter.startProgress && progress <= chapter.endProgress) return chapter.label;
  }
  return chapters.at(-1)?.label ?? null;
}
