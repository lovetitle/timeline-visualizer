export interface SavedSettings {
  version: 1;
  title?: string;
  duration?: string;
  camera?: string;
  compression?: string;
  outlier?: string;
  theme?: string;
  format?: string;
  mapStyle?: string;
  markerStyle?: string;
  chapter?: string;
  previewSpeed?: string;
  placeLabels?: boolean;
  privacyBlur?: boolean;
  outroHold?: string;
  activityPace?: boolean;
}

export interface RecentEntry {
  name: string;
  period: string;
  at: number;
}

const SETTINGS_KEY = 'tv-settings-v1';
const RECENT_KEY = 'tv-recent-v1';
const SEEN_VERSION_KEY = 'tv-seen-version';

export function collectSettingsFromDom(): SavedSettings {
  const value = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value;
  const checked = (id: string) => Boolean((document.getElementById(id) as HTMLInputElement | null)?.checked);
  return {
    version: 1,
    title: value('video-title'),
    duration: value('duration'),
    camera: value('camera-movement'),
    compression: value('compression-select'),
    outlier: value('outlier-select'),
    theme: value('theme-select'),
    format: value('format-select'),
    mapStyle: value('map-style-select'),
    markerStyle: value('marker-style-select'),
    chapter: value('chapter-select'),
    previewSpeed: value('preview-speed-select'),
    placeLabels: checked('place-labels-toggle'),
    privacyBlur: checked('privacy-blur-toggle'),
    outroHold: value('outro-hold'),
    activityPace: checked('activity-pace-toggle'),
  };
}

export function applySettingsToDom(settings: SavedSettings): void {
  const setValue = (id: string, next?: string) => {
    const node = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
    if (node && next !== undefined) node.value = next;
  };
  const setChecked = (id: string, next?: boolean) => {
    const node = document.getElementById(id) as HTMLInputElement | null;
    if (node && next !== undefined) node.checked = next;
  };
  setValue('video-title', settings.title);
  setValue('duration', settings.duration);
  setValue('camera-movement', settings.camera);
  setValue('compression-select', settings.compression);
  setValue('outlier-select', settings.outlier);
  setValue('theme-select', settings.theme);
  setValue('format-select', settings.format);
  setValue('map-style-select', settings.mapStyle);
  setValue('marker-style-select', settings.markerStyle);
  setValue('chapter-select', settings.chapter);
  setValue('preview-speed-select', settings.previewSpeed);
  setValue('outro-hold', settings.outroHold);
  setChecked('place-labels-toggle', settings.placeLabels);
  setChecked('privacy-blur-toggle', settings.privacyBlur);
  setChecked('activity-pace-toggle', settings.activityPace);
}

export function persistSettingsLocally(settings: SavedSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadLocalSettings(): SavedSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedSettings;
  } catch {
    return null;
  }
}

export function exportSettingsJson(): string {
  return JSON.stringify(collectSettingsFromDom(), null, 2);
}

export function importSettingsJson(text: string): SavedSettings {
  const parsed = JSON.parse(text) as SavedSettings;
  if (!parsed || parsed.version !== 1) throw new Error('unsupported settings');
  applySettingsToDom(parsed);
  persistSettingsLocally(parsed);
  return parsed;
}

export function pushRecent(name: string, period: string): void {
  const list = loadRecent().filter((entry) => entry.name !== name || entry.period !== period);
  list.unshift({ name, period, at: Date.now() });
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)));
}

export function loadRecent(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentEntry[];
  } catch {
    return [];
  }
}

export function getSeenVersion(): string | null {
  return localStorage.getItem(SEEN_VERSION_KEY);
}

export function markVersionSeen(version: string): void {
  localStorage.setItem(SEEN_VERSION_KEY, version);
}
