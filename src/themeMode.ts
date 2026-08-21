export type ThemeMode = 'light' | 'dark' | 'system';

const KEY = 'tv-theme-mode';

export function loadThemeMode(): ThemeMode {
  const value = localStorage.getItem(KEY);
  if (value === 'dark' || value === 'light' || value === 'system') return value;
  return 'system';
}

export function saveThemeMode(mode: ThemeMode): void {
  localStorage.setItem(KEY, mode);
}

export function resolvedTheme(mode: ThemeMode = loadThemeMode()): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') return mode;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyThemeMode(mode: ThemeMode = loadThemeMode()): void {
  const resolved = resolvedTheme(mode);
  if (resolved === 'dark') document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
  document.documentElement.dataset.themeMode = mode;
}

export function cycleThemeMode(): ThemeMode {
  const current = loadThemeMode();
  const next: ThemeMode = current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system';
  saveThemeMode(next);
  applyThemeMode(next);
  return next;
}

export function watchSystemTheme(): void {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = (): void => {
    if (loadThemeMode() === 'system') applyThemeMode('system');
  };
  media.addEventListener('change', onChange);
}
