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
    theme: 'sakura',
  },
  {
    id: 'island',
    formatId: 'sq1080',
    duration: '60',
    camera: 'steady',
    compression: 'balanced',
    theme: 'ember',
  },
  {
    id: 'business',
    formatId: 'landscape',
    duration: '30',
    camera: 'fixed',
    compression: 'strong',
    theme: 'ink',
  },
] as const;
