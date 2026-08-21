const KEY = 'tv-success-settings-v1';

export interface SuccessSettings {
  formatId: string;
  themeId: string;
  duration: string;
  camera: string;
}

export function loadSuccessSettings(): SuccessSettings | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as SuccessSettings : null;
  } catch {
    return null;
  }
}

export function saveSuccessSettings(settings: SuccessSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export function applySuccessSettingsToDom(): void {
  const saved = loadSuccessSettings();
  if (!saved) return;
  const set = (id: string, value: string) => {
    const node = document.getElementById(id) as HTMLSelectElement | null;
    if (node && [...node.options].some((option) => option.value === value)) node.value = value;
  };
  set('format-select', saved.formatId);
  set('theme-select', saved.themeId);
  set('duration', saved.duration);
  set('camera-movement', saved.camera);
}
