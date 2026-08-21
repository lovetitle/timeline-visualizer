const UI_MODE_KEY = 'tv-ui-mode';

export type UiMode = 'simple' | 'pro';

export function loadUiMode(): UiMode {
  try {
    const value = localStorage.getItem(UI_MODE_KEY);
    return value === 'pro' ? 'pro' : 'simple';
  } catch {
    return 'simple';
  }
}

export function saveUiMode(mode: UiMode): void {
  try {
    localStorage.setItem(UI_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

export function applyUiMode(mode: UiMode): void {
  document.body.dataset.uiMode = mode;
  document.body.classList.toggle('ui-simple', mode === 'simple');
  document.body.classList.toggle('ui-pro', mode === 'pro');
  const toggle = document.getElementById('ui-mode-toggle');
  if (toggle) toggle.setAttribute('aria-pressed', mode === 'pro' ? 'true' : 'false');
  // In simple mode, collapse heavy settings sections (keep period + export open).
  if (mode === 'simple') {
    for (const id of ['section-style-details', 'section-advanced-details', 'section-tools-details', 'section-pack-details']) {
      const node = document.getElementById(id) as HTMLDetailsElement | null;
      if (node) node.open = false;
    }
    const guide = document.getElementById('export-guide-details') as HTMLDetailsElement | null;
    if (guide) guide.open = false;
  }
}

export function wireUiMode(onLabel: (mode: UiMode) => void): void {
  const mode = loadUiMode();
  applyUiMode(mode);
  onLabel(mode);
  document.getElementById('ui-mode-toggle')?.addEventListener('click', () => {
    const next: UiMode = document.body.classList.contains('ui-pro') ? 'simple' : 'pro';
    saveUiMode(next);
    applyUiMode(next);
    onLabel(next);
  });
}

/** First-visit film recipe that beats bare route demos. */
export function applyDefaultFilmRecipeIfFresh(): void {
  if (localStorage.getItem('tv-film-recipe-v1')) return;
  try {
    if (localStorage.getItem('tv-settings-v1')) return;
  } catch {
    // ignore
  }
  const set = (id: string, value: string) => {
    const node = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
    if (node) node.value = value;
  };
  const check = (id: string, checked: boolean) => {
    const node = document.getElementById(id) as HTMLInputElement | null;
    if (node) node.checked = checked;
  };
  set('format-select', 'portrait');
  set('duration', '30');
  set('camera-movement', 'dynamic');
  set('compression-select', 'balanced');
  set('theme-select', 'ember');
  set('chapter-select', 'city');
  set('color-grade-select', 'warm');
  set('intro-hold', '1.5');
  set('outro-hold', '2.5');
  check('place-labels-toggle', true);
  check('burn-captions-toggle', true);
  check('stay-points-toggle', true);
  check('auto-fallback-toggle', true);
  try {
    localStorage.setItem('tv-film-recipe-v1', '1');
  } catch {
    // ignore
  }
}
