const KEY = 'tv-quality-dash-v1';

export interface QualityRow {
  at: number;
  ok: boolean;
  formatId: string;
  durationSec: number;
  encodeMs: number;
  message?: string;
}

export function pushQualityRow(row: QualityRow): void {
  const rows = loadQualityRows();
  rows.unshift(row);
  localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 40)));
}

export function loadQualityRows(): QualityRow[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as QualityRow[] : [];
  } catch {
    return [];
  }
}

export function summarizeQuality(locale: string): string {
  const rows = loadQualityRows();
  const ok = rows.filter((row) => row.ok).length;
  const fail = rows.length - ok;
  const avg = ok
    ? Math.round(rows.filter((row) => row.ok).reduce((sum, row) => sum + row.encodeMs, 0) / ok / 1000)
    : 0;
  if (locale === 'en') return `${rows.length} runs · ${ok} ok · ${fail} fail · avg ${avg}s`;
  if (locale === 'ja') return `${rows.length} 回 · 成功 ${ok} · 失敗 ${fail} · 平均 ${avg}s`;
  if (locale === 'ko') return `${rows.length}회 · 성공 ${ok} · 실패 ${fail} · 평균 ${avg}s`;
  return `${rows.length} 次 · 成功 ${ok} · 失敗 ${fail} · 平均 ${avg} 秒`;
}
