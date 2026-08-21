const CONTRAST_KEY = 'tv-a11y-contrast';
const FONT_KEY = 'tv-a11y-font';
const MOTION_KEY = 'tv-a11y-motion';

export function applyA11yPrefs(): void {
  const contrast = localStorage.getItem(CONTRAST_KEY) === '1';
  const font = localStorage.getItem(FONT_KEY) || '100';
  const motion = localStorage.getItem(MOTION_KEY) === '1';
  document.documentElement.classList.toggle('a11y-contrast', contrast);
  document.documentElement.classList.toggle('a11y-reduce-motion', motion);
  document.documentElement.style.setProperty('--a11y-font-scale', `${Number(font) / 100}`);
}

export function toggleContrast(): void {
  const next = localStorage.getItem(CONTRAST_KEY) !== '1';
  localStorage.setItem(CONTRAST_KEY, next ? '1' : '0');
  applyA11yPrefs();
}

export function cycleFontScale(): void {
  const current = Number(localStorage.getItem(FONT_KEY) || '100');
  const next = current >= 120 ? 100 : current + 10;
  localStorage.setItem(FONT_KEY, String(next));
  applyA11yPrefs();
}

export function toggleReduceMotion(): void {
  const next = localStorage.getItem(MOTION_KEY) !== '1';
  localStorage.setItem(MOTION_KEY, next ? '1' : '0');
  applyA11yPrefs();
}
