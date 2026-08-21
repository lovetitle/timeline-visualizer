const PERF_KEY = 'tv-perf-log-v1';

export interface PerfEntry {
  at: number;
  durationSec: number;
  encodeMs: number;
  points: number;
  width: number;
  height: number;
}

export function recordEncodePerf(entry: Omit<PerfEntry, 'at'>): void {
  try {
    const list = loadPerfLog();
    list.push({ ...entry, at: Date.now() });
    localStorage.setItem(PERF_KEY, JSON.stringify(list.slice(-30)));
  } catch {
    // ignore
  }
}

export function loadPerfLog(): PerfEntry[] {
  try {
    const raw = localStorage.getItem(PERF_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PerfEntry[];
  } catch {
    return [];
  }
}

export function formatPerfSummary(locale: string): string {
  const list = loadPerfLog();
  if (list.length === 0) {
    return locale === 'en' ? 'No local encode stats yet.' : '尚無本機編碼統計。';
  }
  const avg = list.reduce((sum, entry) => sum + entry.encodeMs, 0) / list.length;
  const last = list.at(-1)!;
  if (locale === 'en') {
    return `Avg encode ${(avg / 1000).toFixed(1)}s · last ${last.width}×${last.height} in ${(last.encodeMs / 1000).toFixed(1)}s`;
  }
  return `平均編碼 ${(avg / 1000).toFixed(1)} 秒 · 最近 ${last.width}×${last.height} 耗時 ${(last.encodeMs / 1000).toFixed(1)} 秒`;
}
