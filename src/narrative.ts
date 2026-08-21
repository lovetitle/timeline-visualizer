import type { Chapter } from './chapters';
import type { GeoPoint } from './types';

export function buildNarrativeScript(
  title: string,
  periodLabel: string,
  chapters: Chapter[],
  totalKm: number,
  locale: 'zh' | 'en' | 'ja' | 'ko',
): string {
  const km = Math.round(totalKm);
  if (locale === 'en') {
    const lines = [
      `${title || 'My journey'} · ${periodLabel}`,
      `About ${km} km across ${chapters.length} chapters.`,
      ...chapters.map((chapter, index) => `${index + 1}. ${chapter.label}`),
      'Shot on-device with Timeline Visualizer.',
    ];
    return lines.join('\n');
  }
  if (locale === 'ja') {
    return [
      `${title || '旅の記録'} · ${periodLabel}`,
      `およそ ${km} km、${chapters.length} 章。`,
      ...chapters.map((chapter, index) => `${index + 1}. ${chapter.label}`),
      'Timeline Visualizer で端末内作成。',
    ].join('\n');
  }
  if (locale === 'ko') {
    return [
      `${title || '나의 여행'} · ${periodLabel}`,
      `약 ${km} km, ${chapters.length}개 챕터.`,
      ...chapters.map((chapter, index) => `${index + 1}. ${chapter.label}`),
      'Timeline Visualizer로 기기에서 제작.',
    ].join('\n');
  }
  return [
    `${title || '我的旅程'} · ${periodLabel}`,
    `約 ${km} 公里，共 ${chapters.length} 個章節。`,
    ...chapters.map((chapter, index) => `${index + 1}. ${chapter.label}`),
    '以時間軸視覺化在本機產出。',
  ].join('\n');
}

export function speakNarrative(text: string, locale: string): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = locale === 'en' ? 'en-US' : locale === 'ja' ? 'ja-JP' : locale === 'ko' ? 'ko-KR' : 'zh-TW';
  window.speechSynthesis.speak(utter);
}

export function stopNarrativeSpeech(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

export function narrativeFromPoints(
  title: string,
  periodLabel: string,
  chapters: Chapter[],
  points: GeoPoint[],
  cumulativeKm: number[],
  locale: 'zh' | 'en' | 'ja' | 'ko',
): string {
  void points;
  return buildNarrativeScript(title, periodLabel, chapters, cumulativeKm.at(-1) ?? 0, locale);
}
