import './style.css';
import { frameAtElapsedSeconds, totalDurationSeconds } from './animation';
import { formatById, VIDEO_FORMATS } from './formats';
import { cumulativeDistances } from './geo';
import { t, type Locale } from './i18n';
import { detectImportKind, parseGpx, parseKml } from './importFormats';
import { filterLocationOutliers, type LocationFilterMode } from './outlier';
import { placeLabelAtProgress } from './places';
import { drawFrame, prepareJourney } from './renderer';
import { themeById, THEMES } from './themes';
import type { CompressionMode } from './timing';
import {
  availableMonths,
  localDateKey,
  parseRawSignalsJson,
  parseTimelineJson,
  pointDateKey,
  processRawSignals,
  selectDateRange,
  selectRange,
  TimelineParseError,
} from './timeline';
import type { RawSignalPoint, RawSignalProcessingResult } from './timeline';
import type { CameraMovement, GeoPoint, MonthOption, PreparedJourney } from './types';
import { canCreateMp4, createJourneyMp4 } from './video';

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`找不到元素 #${id}`);
  return found as T;
}

const langSelect = element<HTMLSelectElement>('lang-select');
const heroDemoCanvas = element<HTMLCanvasElement>('hero-demo-canvas');
const fileInput = element<HTMLInputElement>('timeline-file');
const dropZone = element<HTMLElement>('drop-zone');
const sampleButton = element<HTMLButtonElement>('sample-button');
const addFileButton = element<HTMLButtonElement>('add-file-button');
const fileStatus = element<HTMLParagraphElement>('file-status');
const loadProgress = element<HTMLProgressElement>('load-progress');
const compatibilityStatus = element<HTMLParagraphElement>('compatibility-status');
const emptyTimelineBanner = element<HTMLElement>('empty-timeline-banner');
const settingsCard = element<HTMLElement>('settings-card');
const exactDateToggle = element<HTMLInputElement>('exact-date-toggle');
const periodControls = element<HTMLElement>('period-controls');
const rawSignalsRow = element<HTMLElement>('raw-signals-row');
const rawSignalsToggle = element<HTMLInputElement>('raw-signals-toggle');
const rawSignalsDescription = element<HTMLElement>('raw-signals-description');
const rawAccuracyField = element<HTMLElement>('raw-accuracy-field');
const rawAccuracyLimit = element<HTMLInputElement>('raw-accuracy-limit');
const monthRangeFields = element<HTMLElement>('month-range-fields');
const exactDateFields = element<HTMLElement>('exact-date-fields');
const startSelect = element<HTMLSelectElement>('start-month');
const endSelect = element<HTMLSelectElement>('end-month');
const startDateInput = element<HTMLInputElement>('start-date');
const endDateInput = element<HTMLInputElement>('end-date');
const mergeList = element<HTMLUListElement>('merge-list');
const titleInput = element<HTMLInputElement>('video-title');
const durationSelect = element<HTMLSelectElement>('duration');
const cameraMovementSelect = element<HTMLSelectElement>('camera-movement');
const compressionSelect = element<HTMLSelectElement>('compression-select');
const outlierSelect = element<HTMLSelectElement>('outlier-select');
const themeSelect = element<HTMLSelectElement>('theme-select');
const formatSelect = element<HTMLSelectElement>('format-select');
const placeLabelsToggle = element<HTMLInputElement>('place-labels-toggle');
const outroHoldInput = element<HTMLInputElement>('outro-hold');
const bgmFileInput = element<HTMLInputElement>('bgm-file');
const selectionSummary = element<HTMLParagraphElement>('selection-summary');
const mapConsent = element<HTMLInputElement>('map-consent');
const settingsError = element<HTMLParagraphElement>('settings-error');
const previewCard = element<HTMLElement>('preview-card');
const canvas = element<HTMLCanvasElement>('journey-canvas');
const previewButton = element<HTMLButtonElement>('preview-button');
const createButton = element<HTMLButtonElement>('create-button');
const cancelButton = element<HTMLButtonElement>('cancel-button');
const progress = element<HTMLProgressElement>('export-progress');
const progressLabel = element<HTMLSpanElement>('progress-label');
const errorMessage = element<HTMLParagraphElement>('error-message');
const resultVideo = element<HTMLVideoElement>('result-video');
const resultActions = element<HTMLElement>('result-actions');
const shareButton = element<HTMLButtonElement>('share-button');
const downloadLink = element<HTMLAnchorElement>('download-link');
const copyLinkButton = element<HTMLButtonElement>('copy-link-button');
const downloadPosterButton = element<HTMLButtonElement>('download-poster-button');
const rawOnlyDialog = element<HTMLDialogElement>('raw-only-dialog');
const openGoogleMapsButton = element<HTMLButtonElement>('open-google-maps');
const continueRawDataButton = element<HTMLButtonElement>('continue-raw-data');
const visitCount = element<HTMLParagraphElement>('visit-count');

let locale: Locale = (localStorage.getItem('tv-locale') as Locale) || 'zh';
let monthFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'zh-Hant-TW', { year: 'numeric', month: 'long' });
let dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'zh-Hant-TW', { dateStyle: 'medium' });

let allPoints: GeoPoint[] = [];
let semanticPoints: GeoPoint[] = [];
let rawSignalPoints: RawSignalPoint[] = [];
let rawSignalProcessing: RawSignalProcessingResult | null = null;
let pendingRawOnlyImport: { data: unknown; sourceName: string } | null = null;
let months: MonthOption[] = [];
let prepared: PreparedJourney | null = null;
let selectedSignature = '';
let resultUrl: string | null = null;
let resultFile: File | null = null;
let posterUrl: string | null = null;
let previewAnimation = 0;
let heroAnimation = 0;
let encodingSupported = false;
let compatibilityChecked = false;
let isExporting = false;
let isPreparing = false;
let mergeMode = false;
let exportController: AbortController | null = null;
let audioBuffer: AudioBuffer | null = null;
let outlierRemoved = 0;
const mergeLabels: string[] = [];

themeSelect.replaceChildren(...THEMES.map((theme) => (
  new Option(locale === 'en' ? theme.labelEn : theme.labelZh, theme.id)
)));
formatSelect.replaceChildren(...VIDEO_FORMATS.map((format) => (
  new Option(locale === 'en' ? format.labelEn : format.labelZh, format.id)
)));
langSelect.value = locale;

function applyI18n(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n as Parameters<typeof t>[1];
    if (key) node.textContent = t(locale, key);
  });
  themeSelect.replaceChildren(...THEMES.map((theme) => (
    new Option(locale === 'en' ? theme.labelEn : theme.labelZh, theme.id)
  )));
  formatSelect.replaceChildren(...VIDEO_FORMATS.map((format) => (
    new Option(locale === 'en' ? format.labelEn : format.labelZh, format.id)
  )));
}

function localizeError(error: unknown, fallback: string): string {
  if (error instanceof TimelineParseError) {
    switch (error.reason) {
      case 'malformed-json':
        return locale === 'en' ? 'This is not valid JSON.' : '這不是有效或完整的 JSON 檔。';
      case 'legacy-format':
        return locale === 'en' ? 'Legacy Takeout format. Export from your phone instead.' : '這是較舊的 Google Takeout 格式。請改從手機匯出時間軸資料。';
      case 'raw-signals-only':
        return locale === 'en' ? 'Only raw signals found.' : '這個匯出檔只有原始定位，沒有已整理的旅程。';
      case 'unsupported-format':
        return locale === 'en' ? 'Unsupported Timeline JSON.' : '時間軸 JSON 必須是陣列，或包含 semanticSegments。';
      case 'no-usable-locations':
        return locale === 'en' ? 'No usable location points.' : '這個時間軸匯出檔沒有可用的定位點。';
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function setError(message: string | null): void {
  errorMessage.textContent = message ?? '';
  errorMessage.classList.toggle('hidden', !message);
}

function setSettingsError(message: string | null): void {
  settingsError.textContent = message ?? '';
  settingsError.classList.toggle('hidden', !message);
}

function beforeUnloadGuard(event: BeforeUnloadEvent): void {
  if (!isExporting) return;
  event.preventDefault();
  event.returnValue = '';
}

function populateMonths(select: HTMLSelectElement, options: MonthOption[]): void {
  select.replaceChildren(...options.map(({ key, label }) => new Option(label, key)));
}

function localizeMonths(options: MonthOption[]): MonthOption[] {
  return options.map(({ key }) => {
    const [year, month] = key.split('-').map(Number);
    return { key, label: monthFormatter.format(new Date(year, month - 1, 1)) };
  });
}

function rebuildRawSignalProcessing(): boolean {
  const trimmed = rawAccuracyLimit.value.trim();
  const limit = trimmed === '' ? null : Number(trimmed);
  if (limit !== null && (!Number.isFinite(limit) || limit < 0)) {
    setSettingsError(locale === 'en' ? 'Enter a non-negative accuracy limit.' : '請輸入大於或等於 0 的準確度上限，或留空。');
    return false;
  }
  rawSignalProcessing = processRawSignals(rawSignalPoints, limit);
  return true;
}

function filteredSemanticPoints(): GeoPoint[] {
  const mode = outlierSelect.value as LocationFilterMode;
  const result = filterLocationOutliers(semanticPoints, mode);
  outlierRemoved = result.removedCount;
  return result.points;
}

function currentPoints(): GeoPoint[] {
  if (rawSignalsToggle.checked) {
    return rebuildRawSignalProcessing() ? rawSignalProcessing?.points ?? [] : [];
  }
  const source = filteredSemanticPoints();
  if (exactDateToggle.checked) return selectDateRange(source, startDateInput.value, endDateInput.value);
  return selectRange(source, startSelect.value, endSelect.value);
}

function formatInputDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

function currentPeriodLabel(): string {
  if (mergeLabels.length > 1) return mergeLabels.join(' + ');
  if (rawSignalsToggle.checked) return locale === 'en' ? 'Raw location data' : '原始定位資料';
  if (exactDateToggle.checked) {
    const start = formatInputDate(startDateInput.value);
    const end = formatInputDate(endDateInput.value);
    return startDateInput.value === endDateInput.value ? start : `${start} – ${end}`;
  }
  const start = months.find((month) => month.key === startSelect.value)?.label ?? startSelect.value;
  const end = months.find((month) => month.key === endSelect.value)?.label ?? endSelect.value;
  return startSelect.value === endSelect.value ? start : `${start} – ${end}`;
}

function currentRangeSignature(): string {
  const format = formatById(formatSelect.value);
  return [
    rawSignalsToggle.checked ? `raw:${rawAccuracyLimit.value.trim()}` : exactDateToggle.checked
      ? `dates:${startDateInput.value}:${endDateInput.value}`
      : `months:${startSelect.value}:${endSelect.value}`,
    `cam:${cameraMovementSelect.value}`,
    `dur:${durationSelect.value}`,
    `cmp:${compressionSelect.value}`,
    `out:${outlierSelect.value}`,
    `thm:${themeSelect.value}`,
    `fmt:${format.id}`,
    `labels:${placeLabelsToggle.checked}`,
    `outro:${outroHoldInput.value}`,
    `merge:${mergeLabels.join('|')}`,
  ].join(';');
}

function selectedDistanceKm(points: GeoPoint[]): number {
  return cumulativeDistances(points).at(-1) ?? 0;
}

function applyCanvasFormat(): void {
  const format = formatById(formatSelect.value);
  canvas.width = format.width;
  canvas.height = format.height;
}

function refreshActionAvailability(points = currentPoints()): void {
  const hasJourney = points.length >= 2 && selectedDistanceKm(points) > 0;
  previewButton.disabled = isExporting || isPreparing || !hasJourney;
  createButton.disabled = isExporting || isPreparing || !hasJourney || !encodingSupported;
  if (!compatibilityChecked) {
    createButton.title = locale === 'en' ? 'Checking video support.' : '正在檢查瀏覽器的影片支援。';
  } else if (!encodingSupported) {
    createButton.title = locale === 'en'
      ? 'MP4 needs WebCodecs and H.264.'
      : '產出 MP4 需要支援 WebCodecs 與 H.264 的瀏覽器。';
  } else if (!hasJourney) {
    createButton.title = locale === 'en'
      ? 'Select a period with movement.'
      : '請選擇至少包含兩個不同地點的期間。';
  } else {
    createButton.removeAttribute('title');
  }
}

function defaultRecentRange(points: GeoPoint[]): void {
  if (points.length === 0 || months.length === 0) return;
  const lastMonth = months.at(-1)?.key ?? months[0].key;
  let startMonth = lastMonth;
  for (let index = months.length - 1; index >= 0; index -= 1) {
    const slice = selectRange(points, months[index].key, lastMonth);
    if (selectedDistanceKm(slice) > 5 || months.length - index >= 3) {
      startMonth = months[index].key;
      break;
    }
    startMonth = months[index].key;
  }
  startSelect.value = startMonth;
  endSelect.value = lastMonth;
  const dateKeys = selectRange(points, startMonth, lastMonth).map(pointDateKey).sort();
  if (dateKeys.length > 0) {
    startDateInput.value = dateKeys[0];
    endDateInput.value = dateKeys.at(-1) ?? dateKeys[0];
  }
}

function updateSelection(): void {
  cancelAnimationFrame(previewAnimation);
  setSettingsError(null);
  if (!rawSignalsToggle.checked && exactDateToggle.checked) {
    if (startDateInput.value > endDateInput.value) endDateInput.value = startDateInput.value;
  } else if (!rawSignalsToggle.checked && startSelect.value > endSelect.value) {
    endSelect.value = startSelect.value;
  }

  const points = currentPoints();
  const distanceKm = selectedDistanceKm(points);
  emptyTimelineBanner.classList.toggle('hidden', allPoints.length >= 5);
  if (points.length === 0) {
    selectionSummary.textContent = locale === 'en' ? 'No locations in this period' : '這段期間沒有定位點';
  } else if (points.length === 1 || distanceKm <= 0) {
    selectionSummary.textContent = locale === 'en'
      ? 'Not enough movement — widen the period'
      : '移動不足 · 請擴大期間';
  } else {
    const ignored = outlierRemoved > 0
      ? (locale === 'en'
        ? ` · ${outlierRemoved} outliers ignored`
        : ` · 已忽略 ${outlierRemoved} 個離群點`)
      : '';
    selectionSummary.textContent = locale === 'en'
      ? `${points.length.toLocaleString()} points · ~${Math.round(distanceKm).toLocaleString()} km${ignored}`
      : `${points.length.toLocaleString('zh-Hant-TW')} 個定位點 · 約 ${Math.round(distanceKm).toLocaleString('zh-Hant-TW')} 公里${ignored}`;
  }
  prepared = null;
  selectedSignature = '';
  refreshActionAvailability(points);
}

function renderMergeList(): void {
  mergeList.replaceChildren(...mergeLabels.map((label) => {
    const item = document.createElement('li');
    item.textContent = label;
    return item;
  }));
}

async function getPreparedJourney(signal?: AbortSignal): Promise<PreparedJourney> {
  applyCanvasFormat();
  const signature = currentRangeSignature();
  if (prepared && signature === selectedSignature) return prepared;
  if (signal?.aborted) throw new DOMException('已取消產出影片。', 'AbortError');
  progressLabel.textContent = locale === 'en' ? 'Preparing map' : '正在準備地圖';
  const format = formatById(formatSelect.value);
  const nextJourney = await prepareJourney(
    currentPoints(),
    format.width,
    format.height,
    cameraMovementSelect.value as CameraMovement,
    Number(durationSelect.value),
    compressionSelect.value as CompressionMode,
    signal,
    (completed, total) => {
      progressLabel.textContent = locale === 'en'
        ? `Preparing map ${completed}/${total}`
        : `正在準備地圖 ${completed}/${total}`;
    },
  );
  prepared = nextJourney;
  selectedSignature = signature;
  return nextJourney;
}

function requireMapConsent(): boolean {
  if (mapConsent.checked) return true;
  setSettingsError(locale === 'en'
    ? 'Confirm the map privacy notice first.'
    : '請先確認地圖隱私說明，才會向 CARTO 請求地圖圖磚。');
  mapConsent.focus();
  return false;
}

function parseTimelineText(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new TimelineParseError('malformed-json', '這不是有效或完整的 JSON 檔。');
  }
}

function applyPoints(points: GeoPoint[], sourceName: string, append: boolean): void {
  if (append && semanticPoints.length > 0) {
    const merged = [...semanticPoints, ...points]
      .sort((a, b) => a.instant.getTime() - b.instant.getTime());
    const unique = new Map<string, GeoPoint>();
    for (const point of merged) {
      unique.set(`${point.instant.getTime()}:${point.latitude}:${point.longitude}`, point);
    }
    semanticPoints = [...unique.values()];
    mergeLabels.push(sourceName);
  } else {
    semanticPoints = points;
    mergeLabels.length = 0;
    mergeLabels.push(sourceName);
  }
  allPoints = semanticPoints;
  rawSignalPoints = [];
  rawSignalProcessing = null;
  if (allPoints.length === 0) {
    throw new TimelineParseError('no-usable-locations', '這個時間軸匯出檔沒有可用的定位點。');
  }
  months = localizeMonths(availableMonths(allPoints));
  populateMonths(startSelect, months);
  populateMonths(endSelect, months);
  const dateKeys = allPoints.map(pointDateKey).sort();
  const firstDate = dateKeys[0] ?? localDateKey(allPoints[0].instant);
  const lastDate = dateKeys.at(-1) ?? firstDate;
  startDateInput.min = firstDate;
  startDateInput.max = lastDate;
  endDateInput.min = firstDate;
  endDateInput.max = lastDate;
  exactDateToggle.checked = false;
  rawSignalsToggle.checked = false;
  rawSignalsRow.classList.add('hidden');
  periodControls.classList.remove('hidden');
  monthRangeFields.classList.remove('hidden');
  exactDateFields.classList.add('hidden');
  mapConsent.checked = false;
  settingsCard.classList.remove('hidden');
  previewCard.classList.add('hidden');
  defaultRecentRange(allPoints);
  renderMergeList();
  fileStatus.textContent = locale === 'en'
    ? `${sourceName} · ${allPoints.length.toLocaleString()} points`
    : `${sourceName} · ${allPoints.length.toLocaleString('zh-Hant-TW')} 個有效點`;
  emptyTimelineBanner.classList.toggle('hidden', allPoints.length >= 5);
  updateSelection();
}

function applyTimeline(data: unknown, sourceName: string, useRawOnly = false, append = false): void {
  rawSignalPoints = parseRawSignalsJson(data);
  rawSignalProcessing = processRawSignals(rawSignalPoints, Number(rawAccuracyLimit.value));
  const parsed = useRawOnly ? [] : parseTimelineJson(data);
  const points = useRawOnly ? rawSignalProcessing.points : parsed;
  if (append) {
    applyPoints(points, sourceName, true);
  } else {
    applyPoints(points, sourceName, false);
    rawSignalsToggle.checked = useRawOnly;
    rawSignalsRow.classList.toggle('hidden', useRawOnly || rawSignalPoints.length === 0);
    rawSignalsDescription.classList.toggle('hidden', !useRawOnly);
    rawAccuracyField.classList.toggle('hidden', !useRawOnly);
    periodControls.classList.toggle('hidden', useRawOnly);
    if (useRawOnly) {
      semanticPoints = [];
      allPoints = rawSignalProcessing.points;
    }
  }
}

async function readFileWithProgress(file: File): Promise<string> {
  loadProgress.classList.remove('hidden');
  loadProgress.value = 0;
  if (file.size < 256_000) {
    const text = await file.text();
    loadProgress.value = 1;
    return text;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) loadProgress.value = event.loaded / event.total;
    };
    reader.onload = () => {
      loadProgress.value = 1;
      resolve(String(reader.result ?? ''));
    };
    reader.onerror = () => reject(new Error(locale === 'en' ? 'Could not read file.' : '無法讀取檔案。'));
    reader.readAsText(file);
  });
}

async function loadFile(file: File, append = false): Promise<void> {
  setError(null);
  setSettingsError(null);
  fileStatus.textContent = locale === 'en' ? `Reading ${file.name}…` : `正在讀取 ${file.name}…`;
  const kind = detectImportKind(file);
  const text = await readFileWithProgress(file);
  loadProgress.classList.add('hidden');
  if (kind === 'gpx') {
    applyPoints(parseGpx(text), file.name, append);
    return;
  }
  if (kind === 'kml') {
    applyPoints(parseKml(text), file.name, append);
    return;
  }
  const data = parseTimelineText(text);
  try {
    applyTimeline(data, file.name, false, append);
  } catch (error) {
    const rawPoints = parseRawSignalsJson(data);
    if (!append && error instanceof TimelineParseError && error.reason === 'raw-signals-only' && rawPoints.length > 0) {
      pendingRawOnlyImport = { data, sourceName: file.name };
      fileStatus.textContent = locale === 'en' ? 'Only raw location data found' : '只找到原始定位資料';
      rawOnlyDialog.showModal();
      return;
    }
    throw error;
  }
}

async function requestWakeLock(): Promise<WakeLockSentinel | null> {
  try {
    return await navigator.wakeLock.request('screen');
  } catch {
    return null;
  }
}

async function decodeBgm(file: File): Promise<AudioBuffer> {
  const context = new AudioContext();
  const buffer = await file.arrayBuffer();
  return context.decodeAudioData(buffer.slice(0));
}

function currentStyle() {
  const theme = themeById(themeSelect.value);
  return {
    route: theme.route,
    routeFade: theme.routeFade,
    marker: theme.marker,
    markerRing: theme.markerRing,
    titleBg: theme.titleBg,
    title: theme.title,
    subtitle: theme.subtitle,
  };
}

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  try {
    await loadFile(file, mergeMode);
    mergeMode = false;
  } catch (error) {
    settingsCard.classList.add('hidden');
    fileStatus.textContent = locale === 'en' ? 'Could not load Timeline' : '無法載入時間軸';
    setError(localizeError(error, locale === 'en' ? 'Could not read file.' : '無法讀取所選檔案。'));
    previewCard.classList.remove('hidden');
    emptyTimelineBanner.classList.remove('hidden');
  } finally {
    fileInput.value = '';
  }
});

addFileButton.addEventListener('click', () => {
  mergeMode = true;
  fileInput.click();
});

['dragenter', 'dragover'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add('is-dragging');
  });
});
['dragleave', 'drop'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove('is-dragging');
  });
});
dropZone.addEventListener('drop', async (event) => {
  const file = event.dataTransfer?.files[0];
  if (!file) return;
  try {
    await loadFile(file, false);
  } catch (error) {
    setError(localizeError(error, locale === 'en' ? 'Could not read file.' : '無法讀取所選檔案。'));
    previewCard.classList.remove('hidden');
  }
});

sampleButton.addEventListener('click', async () => {
  setError(null);
  fileStatus.textContent = locale === 'en' ? 'Loading sample…' : '正在載入虛構範例…';
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}sample-timeline.json`);
    if (!response.ok) throw new Error(locale === 'en' ? 'Sample missing.' : '無法載入虛構範例。');
    applyTimeline(parseTimelineText(await response.text()), locale === 'en' ? 'Fictional sample' : '虛構範例');
  } catch (error) {
    setError(localizeError(error, locale === 'en' ? 'Sample missing.' : '無法載入虛構範例。'));
    previewCard.classList.remove('hidden');
  }
});

[
  startSelect, endSelect, startDateInput, endDateInput, durationSelect, cameraMovementSelect,
  compressionSelect, outlierSelect, themeSelect, formatSelect, placeLabelsToggle, outroHoldInput,
].forEach((node) => node.addEventListener('change', updateSelection));

exactDateToggle.addEventListener('change', () => {
  monthRangeFields.classList.toggle('hidden', exactDateToggle.checked);
  exactDateFields.classList.toggle('hidden', !exactDateToggle.checked);
  updateSelection();
});
rawSignalsToggle.addEventListener('change', () => {
  periodControls.classList.toggle('hidden', rawSignalsToggle.checked);
  rawSignalsDescription.classList.toggle('hidden', !rawSignalsToggle.checked);
  rawAccuracyField.classList.toggle('hidden', !rawSignalsToggle.checked);
  updateSelection();
});
rawAccuracyLimit.addEventListener('input', updateSelection);
mapConsent.addEventListener('change', () => {
  if (mapConsent.checked) setSettingsError(null);
});

bgmFileInput.addEventListener('change', async () => {
  const file = bgmFileInput.files?.[0];
  if (!file) {
    audioBuffer = null;
    return;
  }
  try {
    audioBuffer = await decodeBgm(file);
  } catch {
    audioBuffer = null;
    setSettingsError(locale === 'en' ? 'Could not decode audio file.' : '無法解碼這個音訊檔。');
  }
});

langSelect.addEventListener('change', () => {
  locale = langSelect.value === 'en' ? 'en' : 'zh';
  localStorage.setItem('tv-locale', locale);
  monthFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'zh-Hant-TW', { year: 'numeric', month: 'long' });
  dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'zh-Hant-TW', { dateStyle: 'medium' });
  applyI18n();
  if (allPoints.length > 0) {
    months = localizeMonths(availableMonths(allPoints));
    const start = startSelect.value;
    const end = endSelect.value;
    populateMonths(startSelect, months);
    populateMonths(endSelect, months);
    startSelect.value = start;
    endSelect.value = end;
    updateSelection();
  }
});

openGoogleMapsButton.addEventListener('click', () => {
  window.open('https://www.google.com/maps', '_blank', 'noopener');
  pendingRawOnlyImport = null;
  rawOnlyDialog.close();
});
continueRawDataButton.addEventListener('click', () => {
  const pending = pendingRawOnlyImport;
  if (!pending) return;
  pendingRawOnlyImport = null;
  rawOnlyDialog.close();
  try {
    applyTimeline(pending.data, pending.sourceName, true);
  } catch (error) {
    setError(localizeError(error, locale === 'en' ? 'Could not read file.' : '無法讀取所選檔案。'));
  }
});

previewButton.addEventListener('click', async () => {
  if (!requireMapConsent()) return;
  cancelAnimationFrame(previewAnimation);
  setError(null);
  resultActions.classList.add('hidden');
  resultVideo.classList.add('hidden');
  previewCard.classList.remove('hidden');
  isPreparing = true;
  refreshActionAvailability();
  try {
    const journey = await getPreparedJourney();
    const started = performance.now();
    const previewJourneyDuration = Math.min(8, Number(durationSelect.value));
    const outroHold = Number(outroHoldInput.value) || 2.5;
    const previewDuration = totalDurationSeconds(previewJourneyDuration, outroHold);
    const tick = (now: number): void => {
      const elapsedSeconds = Math.min(previewDuration, (now - started) / 1000);
      const fraction = elapsedSeconds / previewDuration;
      const frame = frameAtElapsedSeconds(elapsedSeconds, previewJourneyDuration, outroHold);
      const placeLabel = placeLabelsToggle.checked
        ? placeLabelAtProgress(journey.points, journey.cumulativeDistanceKm, frame.journeyProgress, locale)
        : null;
      drawFrame(canvas, journey, frame, titleInput.value.trim(), currentPeriodLabel(), {
        ...currentStyle(),
        placeLabel,
      });
      progressLabel.textContent = fraction < 1
        ? (locale === 'en' ? 'Previewing' : '預覽中')
        : (locale === 'en' ? 'Preview complete' : '預覽完成');
      if (fraction < 1) previewAnimation = requestAnimationFrame(tick);
    };
    previewAnimation = requestAnimationFrame(tick);
  } catch (error) {
    setError(localizeError(error, locale === 'en' ? 'Preview failed.' : '預覽失敗。'));
  } finally {
    isPreparing = false;
    refreshActionAvailability();
  }
});

cancelButton.addEventListener('click', () => {
  cancelButton.disabled = true;
  progressLabel.textContent = locale === 'en' ? 'Cancelling…' : '正在取消…';
  exportController?.abort();
});

createButton.addEventListener('click', async () => {
  if (!requireMapConsent()) return;
  cancelAnimationFrame(previewAnimation);
  setError(null);
  resultActions.classList.add('hidden');
  resultVideo.classList.add('hidden');
  previewCard.classList.remove('hidden');
  progress.classList.remove('hidden');
  cancelButton.classList.remove('hidden');
  cancelButton.disabled = false;
  progress.value = 0;
  isExporting = true;
  window.addEventListener('beforeunload', beforeUnloadGuard);
  refreshActionAvailability();
  exportController = new AbortController();
  const wakeLock = await requestWakeLock();
  try {
    const journey = await getPreparedJourney(exportController.signal);
    progressLabel.textContent = locale === 'en' ? 'Creating MP4' : '正在產出 MP4';
    const blob = await createJourneyMp4(canvas, journey, {
      durationSeconds: Number(durationSelect.value),
      title: titleInput.value.trim() || (locale === 'en' ? 'My Journey' : '我的旅程'),
      periodLabel: currentPeriodLabel(),
      style: currentStyle(),
      outroHoldSeconds: Number(outroHoldInput.value) || 2.5,
      showPlaceLabels: placeLabelsToggle.checked,
      locale,
      audioBuffer,
      signal: exportController.signal,
      onProgress: (fraction) => {
        progress.value = fraction;
        progressLabel.textContent = locale === 'en'
          ? `Creating MP4 ${Math.round(fraction * 100)}%`
          : `正在產出 MP4 ${Math.round(fraction * 100)}%`;
      },
    });
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);
    resultFile = new File([blob], 'timeline-journey.mp4', { type: 'video/mp4' });
    downloadLink.href = resultUrl;
    resultVideo.src = resultUrl;
    resultVideo.classList.remove('hidden');
    resultActions.classList.remove('hidden');
    progressLabel.textContent = locale === 'en'
      ? `Video ready · ${(blob.size / 1_000_000).toFixed(1)} MB`
      : `影片已就緒 · ${(blob.size / 1_000_000).toFixed(1)} MB`;
    canvas.toBlob((poster) => {
      if (!poster) return;
      if (posterUrl) URL.revokeObjectURL(posterUrl);
      posterUrl = URL.createObjectURL(poster);
    }, 'image/png');
    const shareData = { files: [resultFile] };
    shareButton.hidden = !(typeof navigator.share === 'function'
      && (typeof navigator.canShare !== 'function' || navigator.canShare(shareData)));
  } catch (error) {
    if (exportController.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      progressLabel.textContent = locale === 'en' ? 'Cancelled' : '已取消產出影片';
      progress.value = 0;
    } else {
      setError(localizeError(error, locale === 'en' ? 'Video creation failed.' : '產出影片失敗。'));
      progressLabel.textContent = locale === 'en' ? 'Could not create video' : '無法產出影片';
    }
  } finally {
    await wakeLock?.release().catch(() => undefined);
    exportController = null;
    isExporting = false;
    window.removeEventListener('beforeunload', beforeUnloadGuard);
    cancelButton.classList.add('hidden');
    refreshActionAvailability();
  }
});

shareButton.addEventListener('click', async () => {
  if (!resultFile || typeof navigator.share !== 'function') return;
  try {
    await navigator.share({ files: [resultFile], title: titleInput.value.trim() || 'Timeline' });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    setError(locale === 'en' ? 'Share failed. Use download instead.' : '無法開啟分享選單，請改用下載 MP4。');
  }
});

copyLinkButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    copyLinkButton.textContent = locale === 'en' ? 'Copied' : '已複製';
    setTimeout(() => {
      copyLinkButton.textContent = t(locale, 'copyLink');
    }, 1500);
  } catch {
    setError(locale === 'en' ? 'Could not copy link.' : '無法複製連結。');
  }
});

downloadPosterButton.addEventListener('click', () => {
  if (!posterUrl) {
    canvas.toBlob((poster) => {
      if (!poster) return;
      const url = URL.createObjectURL(poster);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'timeline-poster.png';
      anchor.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
    return;
  }
  const anchor = document.createElement('a');
  anchor.href = posterUrl;
  anchor.download = 'timeline-poster.png';
  anchor.click();
});

void canCreateMp4(480, 480).then((supported) => {
  compatibilityChecked = true;
  encodingSupported = supported;
  compatibilityStatus.textContent = supported ? t(locale, 'videoOk') : t(locale, 'videoOnlyPreview');
  refreshActionAvailability();
});

async function startHeroDemo(): Promise<void> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}sample-timeline.json`);
    if (!response.ok) return;
    const points = parseTimelineJson(JSON.parse(await response.text()));
    const journey = await prepareJourney(points, 360, 360, 'steady', 10, 'balanced');
    const loop = (now: number): void => {
      const elapsed = (now / 1000) % totalDurationSeconds(8, 1.5);
      const frame = frameAtElapsedSeconds(elapsed, 8, 1.5);
      drawFrame(
        heroDemoCanvas,
        journey,
        frame,
        locale === 'en' ? 'Sample Journey' : '範例旅程',
        locale === 'en' ? 'Demo' : '示範',
        currentStyle(),
      );
      heroAnimation = requestAnimationFrame(loop);
    };
    cancelAnimationFrame(heroAnimation);
    heroAnimation = requestAnimationFrame(loop);
  } catch {
    // Demo is optional.
  }
}

const visits = Number(localStorage.getItem('tv-visits') ?? '0') + 1;
localStorage.setItem('tv-visits', String(visits));
visitCount.textContent = locale === 'en'
  ? `Local visits on this device: ${visits}`
  : `此裝置本機造訪次數：${visits}`;

applyI18n();
void startHeroDemo();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`);
  });
}
