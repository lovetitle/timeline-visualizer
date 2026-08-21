import type { Locale } from './i18n';
import { L } from './localeUtil';

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

export function runHealthCheck(locale: Locale | string): HealthReport {
  const loc = (locale === 'en' || locale === 'ja' || locale === 'ko' ? locale : 'zh') as Locale;
  const videoEncoder = typeof VideoEncoder !== 'undefined';
  const offlineAudio = typeof OfflineAudioContext !== 'undefined';
  const indexedDb = typeof indexedDB !== 'undefined';
  const wakeLock = 'wakeLock' in navigator;
  const deviceMemoryGb = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null;
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  const tips: string[] = [];
  if (!videoEncoder) {
    tips.push(L(loc,
      '請用 Chrome／Edge／Safari 16.4+ 產出 MP4。',
      'Use Chrome/Edge/Safari 16.4+ for MP4.',
      'MP4 作成には Chrome／Edge／Safari 16.4+ を使ってください。',
      'MP4 만들기는 Chrome/Edge/Safari 16.4+를 사용하세요.',
    ));
  }
  if (deviceMemoryGb !== null && deviceMemoryGb <= 4) {
    tips.push(L(loc,
      '記憶體偏少：建議用 480p／720p。',
      'Low memory: prefer 480p/720p.',
      'メモリが少ないため 480p／720p を推奨。',
      '메모리가 적습니다. 480p/720p를 권장합니다.',
    ));
  }
  if (!indexedDb) {
    tips.push(L(loc,
      '無 IndexedDB：無法快取圖磚。',
      'IndexedDB missing: tile cache disabled.',
      'IndexedDB なし：タイルキャッシュ不可。',
      'IndexedDB 없음: 타일 캐시 불가.',
    ));
  }
  if (tips.length === 0) {
    tips.push(L(loc,
      '瀏覽器狀態正常，可嘗試產出。',
      'Browser looks ready for encode.',
      'ブラウザは問題なさそうなので作成を試せます。',
      '브라우저 상태가 양호합니다. 만들기를 시도하세요.',
    ));
  }
  return {
    videoEncoder,
    offlineAudio,
    indexedDb,
    wakeLock,
    deviceMemoryGb,
    hardwareConcurrency,
    locale: loc,
    tips,
  };
}
