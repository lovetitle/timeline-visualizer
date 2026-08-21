export interface ChecklistItem {
  id: string;
  ok: boolean;
  label: string;
}

export function buildExportChecklist(input: {
  locale: string;
  hasPoints: boolean;
  mapConsent: boolean;
  encodingSupported: boolean;
  formatId: string;
}): ChecklistItem[] {
  const L = input.locale;
  const t = (zh: string, en: string, ja: string, ko: string) => (
    L === 'en' ? en : L === 'ja' ? ja : L === 'ko' ? ko : zh
  );
  return [
    {
      id: 'points',
      ok: input.hasPoints,
      label: t('已載入有效旅程點', 'Valid journey points loaded', '有効な旅ポイントあり', '유효한 여정 포인트 있음'),
    },
    {
      id: 'consent',
      ok: input.mapConsent,
      label: t('已同意載入地圖', 'Map consent checked', '地図読み込みに同意', '지도 로드 동의함'),
    },
    {
      id: 'codec',
      ok: input.encodingSupported,
      label: t('瀏覽器可編碼 H.264', 'Browser can encode H.264', 'ブラウザが H.264 対応', '브라우저 H.264 인코딩 가능'),
    },
    {
      id: 'format',
      ok: Boolean(input.formatId),
      label: t(`解析度：${input.formatId}`, `Format: ${input.formatId}`, `解像度: ${input.formatId}`, `해상도: ${input.formatId}`),
    },
  ];
}

export function renderChecklist(host: HTMLElement, items: ChecklistItem[]): void {
  host.replaceChildren(...items.map((item) => {
    const row = document.createElement('li');
    row.className = item.ok ? 'check-ok' : 'check-bad';
    row.textContent = `${item.ok ? '✓' : '✗'} ${item.label}`;
    return row;
  }));
}
