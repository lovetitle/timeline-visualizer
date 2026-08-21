const KEY = 'tv-anon-stats-v1';

export interface AnonStats {
  encodeOk: number;
  encodeFail: number;
  previewOk: number;
  lastAt: number;
}

export function loadAnonStats(): AnonStats {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { encodeOk: 0, encodeFail: 0, previewOk: 0, lastAt: 0 };
    return { encodeOk: 0, encodeFail: 0, previewOk: 0, lastAt: 0, ...JSON.parse(raw) };
  } catch {
    return { encodeOk: 0, encodeFail: 0, previewOk: 0, lastAt: 0 };
  }
}

function save(stats: AnonStats): void {
  localStorage.setItem(KEY, JSON.stringify(stats));
}

export function recordEncodeOk(): void {
  const stats = loadAnonStats();
  stats.encodeOk += 1;
  stats.lastAt = Date.now();
  save(stats);
}

export function recordEncodeFail(): void {
  const stats = loadAnonStats();
  stats.encodeFail += 1;
  stats.lastAt = Date.now();
  save(stats);
}

export function recordPreviewOk(): void {
  const stats = loadAnonStats();
  stats.previewOk += 1;
  stats.lastAt = Date.now();
  save(stats);
}

export function formatAnonStats(locale: string): string {
  const stats = loadAnonStats();
  if (locale === 'en') {
    return `Local usage: ${stats.encodeOk} encodes OK · ${stats.encodeFail} failed · ${stats.previewOk} previews`;
  }
  if (locale === 'ja') {
    return `端末内利用: 成功 ${stats.encodeOk} · 失敗 ${stats.encodeFail} · プレビュー ${stats.previewOk}`;
  }
  if (locale === 'ko') {
    return `로컬 사용: 성공 ${stats.encodeOk} · 실패 ${stats.encodeFail} · 미리보기 ${stats.previewOk}`;
  }
  return `本機用量：成功 ${stats.encodeOk} · 失敗 ${stats.encodeFail} · 預覽 ${stats.previewOk}`;
}
