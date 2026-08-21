export interface HealthReport {
  videoEncoder: boolean;
  offlineAudio: boolean;
  indexedDb: boolean;
  wakeLock: boolean;
  deviceMemoryGb: number | null;
  hardwareConcurrency: number;
  locale: string;
  tips: string[];
}

export function runHealthCheck(locale: string): HealthReport {
  const videoEncoder = typeof VideoEncoder !== 'undefined';
  const offlineAudio = typeof OfflineAudioContext !== 'undefined';
  const indexedDb = typeof indexedDB !== 'undefined';
  const wakeLock = 'wakeLock' in navigator;
  const deviceMemoryGb = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null;
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  const tips: string[] = [];
  if (!videoEncoder) {
    tips.push(locale === 'en' ? 'Use Chrome/Edge/Safari 16.4+ for MP4.' : '請用 Chrome／Edge／Safari 16.4+ 產出 MP4。');
  }
  if (deviceMemoryGb !== null && deviceMemoryGb <= 4) {
    tips.push(locale === 'en' ? 'Low memory: prefer 480p/720p.' : '記憶體偏少：建議用 480p／720p。');
  }
  if (!indexedDb) {
    tips.push(locale === 'en' ? 'IndexedDB missing: tile cache disabled.' : '無 IndexedDB：無法快取圖磚。');
  }
  if (tips.length === 0) {
    tips.push(locale === 'en' ? 'Browser looks ready for encode.' : '瀏覽器狀態正常，可嘗試產出。');
  }
  return {
    videoEncoder,
    offlineAudio,
    indexedDb,
    wakeLock,
    deviceMemoryGb,
    hardwareConcurrency,
    locale,
    tips,
  };
}
