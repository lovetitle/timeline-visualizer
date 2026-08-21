import ParseWorker from './parseWorker?worker';
import { chapterLabelFor } from './chapters';
import { classifyError } from './errors';
import { downloadText, pointsToGeoJson, pointsToGpx } from './exportTrack';
import type { MapStyleId, MarkerStyleId } from './mapStyles';
import { inferPrivacyZones, blurPointsNearZones } from './privacy';
import { project, unwrapWorldPoints } from './geo';
import {
  rangeBounds,
  selectLikelyAbroad,
  selectRecentTrip,
  selectThisYear,
  suggestDurationSeconds,
  trimIdleEdges,
} from './smartSelect';
import { templateById } from './templates';
import { selectRange } from './timeline';
import type { GeoPoint } from './types';

export { chapterLabelFor };

export interface AdvancedHost {
  locale: () => 'zh' | 'en';
  allPoints: () => GeoPoint[];
  setPointsSelection: (points: GeoPoint[]) => void;
  currentPoints: () => GeoPoint[];
  selectedDistanceKm: (points: GeoPoint[]) => number;
  updateSelection: () => void;
  requireMapConsent: () => boolean;
  runExportOnce: () => Promise<void>;
  setError: (message: string | null) => void;
  setSettingsError: (message: string | null) => void;
  getTitle: () => string;
  getPeriodLabel: () => string;
  canvas: HTMLCanvasElement;
}

let parseWorker: Worker | null = null;
let parseSeq = 0;

export function parseJsonInWorker(text: string): Promise<unknown> {
  if (text.length < 500_000) {
    return Promise.resolve(JSON.parse(text) as unknown);
  }
  if (!parseWorker) parseWorker = new ParseWorker();
  const worker = parseWorker;
  const id = (parseSeq += 1);
  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent<{ id: number; ok: boolean; data?: unknown; error?: string }>) => {
      if (event.data.id !== id) return;
      worker.removeEventListener('message', onMessage);
      if (event.data.ok) resolve(event.data.data);
      else reject(new Error(event.data.error ?? 'parse failed'));
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage({ id, text });
  });
}

export function applyPrivacyIfNeeded(points: GeoPoint[], enabled: boolean): GeoPoint[] {
  if (!enabled) return points;
  return blurPointsNearZones(points, inferPrivacyZones(points));
}

export function comparePointsForYear(all: GeoPoint[], year: number): GeoPoint[] {
  return selectRange(all, `${year}-01`, `${year}-12`);
}

export function compareWorldPoints(points: GeoPoint[]) {
  return unwrapWorldPoints(points.map((point) => project(point.latitude, point.longitude)));
}

export function formatEta(seconds: number, locale: 'zh' | 'en'): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  if (seconds < 60) return locale === 'en' ? `~${Math.ceil(seconds)}s left` : `剩餘約 ${Math.ceil(seconds)} 秒`;
  return locale === 'en'
    ? `~${Math.ceil(seconds / 60)}m left`
    : `剩餘約 ${Math.ceil(seconds / 60)} 分鐘`;
}

export function showClassifiedError(
  error: unknown,
  locale: 'zh' | 'en',
  setError: (message: string | null) => void,
  hintEl: HTMLElement,
): void {
  const classified = classifyError(error);
  setError(locale === 'en' ? classified.titleEn : classified.titleZh);
  hintEl.textContent = locale === 'en' ? classified.hintEn : classified.hintZh;
}

export function wireAdvancedControls(host: AdvancedHost): void {
  const smartThisYear = document.getElementById('smart-this-year') as HTMLButtonElement;
  const smartRecent = document.getElementById('smart-recent') as HTMLButtonElement;
  const smartAbroad = document.getElementById('smart-abroad') as HTMLButtonElement;
  const smartTrim = document.getElementById('smart-trim') as HTMLButtonElement;
  const templateSelect = document.getElementById('template-select') as HTMLSelectElement;
  const suggestDuration = document.getElementById('suggest-duration-button') as HTMLButtonElement;
  const exportGpx = document.getElementById('export-gpx-button') as HTMLButtonElement;
  const exportGeo = document.getElementById('export-geojson-button') as HTMLButtonElement;
  const batchAdd = document.getElementById('batch-add-button') as HTMLButtonElement;
  const batchList = document.getElementById('batch-list') as HTMLUListElement;
  const batchRun = document.getElementById('batch-run-button') as HTMLButtonElement;
  const startMonth = document.getElementById('start-month') as HTMLSelectElement;
  const endMonth = document.getElementById('end-month') as HTMLSelectElement;
  const startDate = document.getElementById('start-date') as HTMLInputElement;
  const endDate = document.getElementById('end-date') as HTMLInputElement;
  const exactToggle = document.getElementById('exact-date-toggle') as HTMLInputElement;
  const durationSelect = document.getElementById('duration') as HTMLSelectElement;
  const titleInput = document.getElementById('video-title') as HTMLInputElement;
  const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
  const cameraSelect = document.getElementById('camera-movement') as HTMLSelectElement;
  const compressionSelect = document.getElementById('compression-select') as HTMLSelectElement;
  const formatSelect = document.getElementById('format-select') as HTMLSelectElement;

  const batchQueue: { label: string; start: string; end: string; exact: boolean }[] = [];

  function applySmart(points: GeoPoint[]): void {
    const bounds = rangeBounds(points);
    if (!bounds) return;
    host.setPointsSelection(points);
    exactToggle.checked = true;
    startDate.value = bounds.startDate;
    endDate.value = bounds.endDate;
    startMonth.value = bounds.startMonth;
    endMonth.value = bounds.endMonth;
    document.getElementById('month-range-fields')?.classList.add('hidden');
    document.getElementById('exact-date-fields')?.classList.remove('hidden');
    host.updateSelection();
  }

  smartThisYear.addEventListener('click', () => applySmart(selectThisYear(host.allPoints())));
  smartRecent.addEventListener('click', () => applySmart(selectRecentTrip(host.allPoints())));
  smartAbroad.addEventListener('click', () => applySmart(selectLikelyAbroad(host.allPoints())));
  smartTrim.addEventListener('click', () => applySmart(trimIdleEdges(host.currentPoints())));

  suggestDuration.addEventListener('click', () => {
    const km = host.selectedDistanceKm(host.currentPoints());
    const seconds = suggestDurationSeconds(km);
    durationSelect.value = String(seconds);
    host.updateSelection();
  });

  templateSelect.addEventListener('change', () => {
    const template = templateById(templateSelect.value);
    if (!template) return;
    titleInput.value = host.locale() === 'en' ? template.titleEn : template.titleZh;
    themeSelect.value = template.themeId;
    cameraSelect.value = template.camera;
    compressionSelect.value = template.compression;
    formatSelect.value = template.formatId;
    durationSelect.value = String(template.durationHint);
    host.updateSelection();
  });

  exportGpx.addEventListener('click', () => {
    const points = host.currentPoints();
    if (points.length < 2) return;
    downloadText('timeline-journey.gpx', pointsToGpx(points, host.getTitle()), 'application/gpx+xml');
  });
  exportGeo.addEventListener('click', () => {
    const points = host.currentPoints();
    if (points.length < 2) return;
    downloadText('timeline-journey.geojson', pointsToGeoJson(points, host.getTitle()), 'application/geo+json');
  });

  batchAdd.addEventListener('click', () => {
    const exact = exactToggle.checked;
    const start = exact ? startDate.value : startMonth.value;
    const end = exact ? endDate.value : endMonth.value;
    if (!start || !end) return;
    const label = `${start} → ${end}`;
    batchQueue.push({ label, start, end, exact });
    const item = document.createElement('li');
    item.textContent = label;
    batchList.append(item);
  });

  batchRun.addEventListener('click', async () => {
    if (!host.requireMapConsent() || batchQueue.length === 0) return;
    for (const job of batchQueue) {
      exactToggle.checked = job.exact;
      document.getElementById('month-range-fields')?.classList.toggle('hidden', job.exact);
      document.getElementById('exact-date-fields')?.classList.toggle('hidden', !job.exact);
      if (job.exact) {
        startDate.value = job.start;
        endDate.value = job.end;
      } else {
        startMonth.value = job.start;
        endMonth.value = job.end;
      }
      host.updateSelection();
      await host.runExportOnce();
    }
  });
}

export function readMapStyle(): MapStyleId {
  const value = (document.getElementById('map-style-select') as HTMLSelectElement | null)?.value;
  return value === 'dark' || value === 'voyager' ? value : 'light';
}

export function readMarkerStyle(): MarkerStyleId {
  const value = (document.getElementById('marker-style-select') as HTMLSelectElement | null)?.value;
  return value === 'plane' || value === 'foot' ? value : 'dot';
}

export function readPreviewSpeed(): number {
  return Number((document.getElementById('preview-speed-select') as HTMLSelectElement | null)?.value || 1);
}

export function privacyEnabled(): boolean {
  return Boolean((document.getElementById('privacy-blur-toggle') as HTMLInputElement | null)?.checked);
}

export function chapterMode(): string {
  return (document.getElementById('chapter-select') as HTMLSelectElement | null)?.value || 'off';
}

export function compareEnabled(): boolean {
  return Boolean((document.getElementById('compare-toggle') as HTMLInputElement | null)?.checked);
}

export function compareYear(): number {
  return Number((document.getElementById('compare-year-input') as HTMLInputElement | null)?.value || 0);
}
