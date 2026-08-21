export type AppErrorCode =
  | 'file-unreadable'
  | 'json-malformed'
  | 'legacy-takeout'
  | 'raw-only'
  | 'unsupported-format'
  | 'no-locations'
  | 'no-movement'
  | 'encoder-unsupported'
  | 'encode-failed'
  | 'audio-failed'
  | 'map-consent'
  | 'cancelled'
  | 'unknown';

export interface ClassifiedError {
  code: AppErrorCode;
  titleZh: string;
  titleEn: string;
  hintZh: string;
  hintEn: string;
}

export function classifyError(error: unknown): ClassifiedError {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const name = error instanceof Error ? error.name : '';

  if (name === 'AbortError' || /cancel|取消/i.test(message)) {
    return {
      code: 'cancelled',
      titleZh: '已取消',
      titleEn: 'Cancelled',
      hintZh: '你可以調整設定後再試一次。',
      hintEn: 'Adjust settings and try again.',
    };
  }
  if (/malformed|不是有效|JSON/i.test(message) && /json|檔/i.test(message)) {
    return {
      code: 'json-malformed',
      titleZh: '檔案損壞或不是完整 JSON',
      titleEn: 'Broken or incomplete JSON',
      hintZh: '請重新從手機匯出 Timeline.json，不要用未解壓完的檔案。',
      hintEn: 'Export Timeline.json again from your phone.',
    };
  }
  if (/Takeout|legacy|舊/i.test(message)) {
    return {
      code: 'legacy-takeout',
      titleZh: '這是舊版 Takeout 格式',
      titleEn: 'Legacy Takeout format',
      hintZh: '請改從手機：地圖 → 頭像 → 設定 → 位置和隱私 → 匯出檔案。',
      hintEn: 'Export from Maps → profile → Settings → Location and privacy.',
    };
  }
  if (/raw|原始定位/i.test(message)) {
    return {
      code: 'raw-only',
      titleZh: '只有原始定位',
      titleEn: 'Raw signals only',
      hintZh: '可勉強使用，但建議先在 Google 地圖還原時間軸再匯出。',
      hintEn: 'Usable with noise. Prefer restoring Timeline in Google Maps first.',
    };
  }
  if (/no usable|沒有可用|no location/i.test(message)) {
    return {
      code: 'no-locations',
      titleZh: '找不到定位點',
      titleEn: 'No location points',
      hintZh: '時間軸可能是空的。請先還原備份，或確認匯出的是正確檔案。',
      hintEn: 'Timeline may be empty. Restore backup or check the file.',
    };
  }
  if (/WebCodecs|H\.264|無法產出 MP4|encoder|編碼|解析度|720p|480p/i.test(message)) {
    return {
      code: 'encoder-unsupported',
      titleZh: '此解析度無法編碼',
      titleEn: 'Cannot encode this resolution',
      hintZh: message.includes('720') || message.includes('480') || message.includes('×')
        ? message
        : '1080p 需要較高的 H.264 等級。請改用最新 Chrome／Edge，或先選 720p／480p。',
      hintEn: '1080p needs a higher H.264 level. Use latest Chrome/Edge, or try 720p/480p.',
    };
  }
  if (/audio|音訊|BGM/i.test(message)) {
    return {
      code: 'audio-failed',
      titleZh: '背景音樂無法寫入',
      titleEn: 'Could not mux audio',
      hintZh: '影片仍可無聲產出；可換 MP3/M4A 再試。',
      hintEn: 'Video can still export silently; try another audio file.',
    };
  }
  if (/consent|隱私|CARTO/i.test(message)) {
    return {
      code: 'map-consent',
      titleZh: '尚未同意載入地圖',
      titleEn: 'Map consent required',
      hintZh: '勾選地圖隱私說明後再預覽或產出。',
      hintEn: 'Accept the map privacy notice first.',
    };
  }
  if (/movement|移動不足|兩個/i.test(message)) {
    return {
      code: 'no-movement',
      titleZh: '這段期間幾乎沒有移動',
      titleEn: 'Not enough movement',
      hintZh: '請擴大日期範圍，或改用智慧選段。',
      hintEn: 'Widen the date range or use smart selection.',
    };
  }
  return {
    code: 'unknown',
    titleZh: '發生錯誤',
    titleEn: 'Something went wrong',
    hintZh: message || '請重試；若持續失敗，可到頁尾回報問題。',
    hintEn: message || 'Retry, or report the issue from the footer.',
  };
}
