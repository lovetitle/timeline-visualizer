import { buildCityChapters, buildDayChapters, type Chapter } from './chapters';
import type { Locale } from './i18n';
import type { GeoPoint } from './types';

function formatSrtTime(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const secs = Math.floor(clamped % 60);
  const millis = Math.round((clamped - Math.floor(clamped)) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

export function chaptersToSrt(
  chapters: Chapter[],
  durationSeconds: number,
): string {
  if (chapters.length === 0 || durationSeconds <= 0) return '';
  return chapters.map((chapter, index) => {
    const start = chapter.startProgress * durationSeconds;
    const end = Math.max(start + 0.2, chapter.endProgress * durationSeconds);
    return `${index + 1}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${chapter.label}\n`;
  }).join('\n');
}

export function buildJourneySrt(
  mode: string,
  points: GeoPoint[],
  cumulativeDistanceKm: number[],
  durationSeconds: number,
  locale: Locale,
): string {
  const chapters = mode === 'city'
    ? buildCityChapters(points, cumulativeDistanceKm, locale)
    : buildDayChapters(points, cumulativeDistanceKm, locale);
  return chaptersToSrt(chapters, durationSeconds);
}
