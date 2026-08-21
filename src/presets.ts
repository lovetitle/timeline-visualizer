/** Fallback chain when HD encode fails. */
export function fallbackFormatIds(currentId: string): string[] {
  const chain = [currentId, 'sq720', 'sq480'];
  return [...new Set(chain)].filter((id) => id !== currentId || chain.indexOf(id) === 0).slice(1);
}

export const QUICK_PRESETS = [
  {
    id: 'reels',
    formatId: 'portrait',
    duration: '30',
    camera: 'dynamic',
    compression: 'gentle',
    theme: 'ember',
    chapter: 'city',
    placeLabels: true,
    titleZh: '社群成片',
    titleEn: 'Social cut',
  },
  {
    id: 'island',
    formatId: 'sq1080',
    duration: '60',
    camera: 'steady',
    compression: 'balanced',
    theme: 'ember',
    chapter: 'day',
    placeLabels: true,
    titleZh: '環島日記',
    titleEn: 'Island diary',
  },
  {
    id: 'business',
    formatId: 'landscape',
    duration: '30',
    camera: 'fixed',
    compression: 'strong',
    theme: 'ink',
    chapter: 'city',
    placeLabels: false,
    titleZh: '出差紀實',
    titleEn: 'Business trip',
  },
] as const;
