export interface TileRequestLog {
  at: number;
  zoom: number;
  x: number;
  y: number;
  style: string;
}

const LOG_KEY = 'tv-tile-log-v1';
const MAX_ENTRIES = 200;

export function recordTileRequest(zoom: number, x: number, y: number, style: string): void {
  try {
    const list = loadTileLog();
    list.push({ at: Date.now(), zoom, x, y, style });
    localStorage.setItem(LOG_KEY, JSON.stringify(list.slice(-MAX_ENTRIES)));
  } catch {
    // Ignore quota errors.
  }
}

export function loadTileLog(): TileRequestLog[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TileRequestLog[];
  } catch {
    return [];
  }
}

export function clearTileLog(): void {
  localStorage.removeItem(LOG_KEY);
}

export function summarizeTileLog(locale: string): string {
  const list = loadTileLog();
  if (list.length === 0) {
    return locale === 'en'
      ? 'No map tile requests recorded on this device yet.'
      : locale === 'ja'
        ? 'この端末では地図タイルの記録がまだありません。'
        : locale === 'ko'
          ? '이 기기에서 지도 타일 요청 기록이 아직 없습니다.'
          : '此裝置尚未記錄任何地圖圖磚請求。';
  }
  const zooms = new Set(list.map((entry) => entry.zoom));
  const styles = new Set(list.map((entry) => entry.style));
  const first = new Date(list[0].at).toLocaleString();
  const last = new Date(list.at(-1)!.at).toLocaleString();
  if (locale === 'en') {
    return `${list.length} tile requests · zoom ${[...zooms].join(', ')} · styles ${[...styles].join(', ')} · ${first} → ${last}`;
  }
  if (locale === 'ja') {
    return `タイル ${list.length} 件 · ズーム ${[...zooms].join(', ')} · スタイル ${[...styles].join(', ')} · ${first} → ${last}`;
  }
  if (locale === 'ko') {
    return `타일 ${list.length}건 · 줌 ${[...zooms].join(', ')} · 스타일 ${[...styles].join(', ')} · ${first} → ${last}`;
  }
  return `圖磚請求 ${list.length} 次 · 縮放 ${[...zooms].join(', ')} · 樣式 ${[...styles].join(', ')} · ${first} → ${last}`;
}
