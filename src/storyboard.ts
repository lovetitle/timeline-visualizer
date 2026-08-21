import type { ClipSuggestion } from './smartClips';

export interface StoryboardItem {
  id: string;
  title: string;
  targetSeconds: number;
  startDate: string;
  endDate: string;
  startProgress: number;
  endProgress: number;
}

const KEY = 'tv-storyboard-v1';

export function loadStoryboard(): StoryboardItem[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as StoryboardItem[] : [];
  } catch {
    return [];
  }
}

export function saveStoryboard(items: StoryboardItem[]): void {
  sessionStorage.setItem(KEY, JSON.stringify(items));
}

export function clipToStoryboard(clip: ClipSuggestion, title: string): StoryboardItem {
  return {
    id: clip.id,
    title: `${title} · ${clip.label}`,
    targetSeconds: clip.targetSeconds,
    startDate: clip.startDate,
    endDate: clip.endDate,
    startProgress: clip.startProgress,
    endProgress: clip.endProgress,
  };
}
