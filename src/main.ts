import './style.css';
import {
  applyPrivacyIfNeeded,
  chapterLabelFor,
  comparePointsForYear,
  compareWorldPoints,
  formatEta,
  parseJsonInWorker,
  privacyEnabled,
  readMapStyle,
  readMarkerStyle,
  readPreviewSpeed,
  chapterMode,
  compareEnabled,
  compareYear,
  showClassifiedError,
  wireAdvancedControls,
} from './advanced';
import { frameAtElapsedSeconds, totalDurationSeconds } from './animation';
import { applyBrandToDom, loadBrand, saveBrand } from './brand';
import { downsamplePoints, suggestMaxPoints } from './downsample';
import { downloadText } from './exportTrack';
import { refreshExtrasLabels, wireExtras } from './extras';
import { formatById } from './formats';
import { cumulativeDistances, project } from './geo';
import { applyGuideLocale } from './guideI18n';
import { drawHeatmapPoster } from './heatmap';
import { t, type Locale } from './i18n';
import { detectImportKind, parseGpx, parseKml } from './importFormats';
import { intlLocale, uiLocale } from './localeUtil';
import { filterLocationOutliers, type LocationFilterMode } from './outlier';
import { recordEncodePerf } from './perf';
import { placeLabelAtProgress } from './places';
import { drawFrame, prepareJourney } from './renderer';
import { withRetry } from './retry';
import { rangeBounds } from './smartSelect';
import { getCachedSampleVideo, setCachedSampleVideo } from './sampleVideoCache';
import { applySelectLocale } from './selectI18n';
import { pushRecent } from './settingsStore';
import { buildJourneySrt } from './srt';
import { themeById } from './themes';
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
import { canCreateMp4, createJourneyMp4, alignEncodeSize } from './video';
import { APP_VERSION } from './version';
import {
  fallbackFormatIds,
  noteEncodeFail,
  noteEncodeOk,
  notePreviewOk,
  refreshChapterToc,
  snapshotStats,
  wireV14,
  type V14Host,
} from './wireV14';
import { saveSuccessSettings, wireV15 } from './wireV15';
import {
  dualExportEnabled,
  introHoldSeconds,
  maybeMixNarration,
  readColorGrade,
  reverseRouteEnabled,
  splitCompareEnabled,
  stayPointsEnabled,
  wireV16,
} from './wireV16';
import { gradeForProgress } from './colorGrade';
import { detectStayPoints } from './stayPoints';
import { pushQualityRow } from './qualityDash';
import { speedKmhAt } from './smartClips';

let v14Host!: V14Host;

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`找不到元素 #${id}`);
  return found as T;
}

function parseLocale(value: string | null): Locale {
  if (value === 'en' || value === 'ja' || value === 'ko') return value;
  return 'zh';
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
const pauseButton = element<HTMLButtonElement>('pause-button');
const playSampleVideoButton = element<HTMLButtonElement>('play-sample-video');
const sampleResultVideo = element<HTMLVideoElement>('sample-result-video');
const brandSiteName = element<HTMLInputElement>('brand-site-name');
const brandTagline = element<HTMLInputElement>('brand-tagline');
const brandSave = element<HTMLButtonElement>('brand-save');
const progress = element<HTMLProgressElement>('export-progress');
const progressLabel = element<HTMLSpanElement>('progress-label');
const errorMessage = element<HTMLParagraphElement>('error-message');
const resultVideo = element<HTMLVideoElement>('result-video');
const resultActions = element<HTMLElement>('result-actions');
const shareButton = element<HTMLButtonElement>('share-button');
const downloadLink = element<HTMLAnchorElement>('download-link');
const copyLinkButton = element<HTMLButtonElement>('copy-link-button');
const downloadPosterButton = element<HTMLButtonElement>('download-poster-button');
const errorHint = element<HTMLParagraphElement>('error-hint');
const etaLabel = element<HTMLSpanElement>('eta-label');
const shareCard = element<HTMLElement>('share-card');
const shareCardTitle = element<HTMLHeadingElement>('share-card-title');
const shareCardMeta = element<HTMLParagraphElement>('share-card-meta');
const shareCardCanvas = element<HTMLCanvasElement>('share-card-canvas');
const rawOnlyDialog = element<HTMLDialogElement>('raw-only-dialog');
const openGoogleMapsButton = element<HTMLButtonElement>('open-google-maps');
const continueRawDataButton = element<HTMLButtonElement>('continue-raw-data');
const visitCount = element<HTMLParagraphElement>('visit-count');
const compareFileInput = element<HTMLInputElement>('compare-file');
const downloadHeatmapButton = element<HTMLButtonElement>('download-heatmap-button');
const downloadSrtButton = element<HTMLButtonElement>('download-srt-button');
const stickyProgress = element<HTMLElement>('sticky-progress');
const stickyProgressLabel = element<HTMLSpanElement>('sticky-progress-label');
const stickyProgressBar = element<HTMLProgressElement>('sticky-progress-bar');
const versionLabel = element<HTMLParagraphElement>('version-label');

let locale: Locale = parseLocale(localStorage.getItem('tv-locale'));
let monthFormatter = new Intl.DateTimeFormat(intlLocale(locale), { year: 'numeric', month: 'long' });
let dateFormatter = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'medium' });

let allPoints: GeoPoint[] = [];
let semanticPoints: GeoPoint[] = [];
let overlayComparePoints: GeoPoint[] = [];
let lastSourceName = '';
let downsampleNote = '';
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
const pauseGate = { paused: false };
let audioBuffer: AudioBuffer | null = null;
let outlierRemoved = 0;
const mergeLabels: string[] = [];

langSelect.value = locale;

function activityPaceEnabled(): boolean {
  return Boolean((document.getElementById('activity-pace-toggle') as HTMLInputElement | null)?.checked);
}

function isEnglishLike(): boolean {
  return locale === 'en';
}

function applyI18n(): void {
  document.documentElement.lang = locale === 'zh' ? 'zh-Hant' : locale;
  document.title = t(locale, 'pageTitle');
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n as Parameters<typeof t>[1];
    if (!key) return;
    // Skip brand-customized headline unless empty brand tagline.
    if (key === 'brandTitle' && loadBrand().tagline.trim()) return;
    const text = t(locale, key);
    if (key === 'brandTitle') node.innerHTML = text.replaceAll('\n', '<br />');
    else node.textContent = text;
  });
  applyGuideLocale(locale);
  applySelectLocale(locale);
  versionLabel.textContent = `${t(locale, 'versionLabel')} ${APP_VERSION}`;
  const themeToggle = document.getElementById('theme-mode-toggle');
  if (themeToggle) themeToggle.setAttribute('title', t(locale, 'darkMode'));
  if (!pauseGate.paused) pauseButton.textContent = t(locale, 'pauseEncode');
  applyBrandToDom(loadBrand());
}

function localizeError(error: unknown, fallback: string): string {
  if (error instanceof TimelineParseError) {
    switch (error.reason) {
      case 'malformed-json':
        return isEnglishLike() ? 'This is not valid JSON.' : '這不是有效或完整的 JSON 檔。';
      case 'legacy-format':
        return isEnglishLike() ? 'Legacy Takeout format. Export from your phone instead.' : '這是較舊的 Google Takeout 格式。請改從手機匯出時間軸資料。';
      case 'raw-signals-only':
        return isEnglishLike() ? 'Only raw signals found.' : '這個匯出檔只有原始定位，沒有已整理的旅程。';
      case 'unsupported-format':
        return isEnglishLike() ? 'Unsupported Timeline JSON.' : '時間軸 JSON 必須是陣列，或包含 semanticSegments。';
      case 'no-usable-locations':
        return isEnglishLike() ? 'No usable location points.' : '這個時間軸匯出檔沒有可用的定位點。';
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
  let points: GeoPoint[];
  if (rawSignalsToggle.checked) {
    points = rebuildRawSignalProcessing() ? rawSignalProcessing?.points ?? [] : [];
  } else {
    const source = filteredSemanticPoints();
    points = exactDateToggle.checked
      ? selectDateRange(source, startDateInput.value, endDateInput.value)
      : selectRange(source, startSelect.value, endSelect.value);
  }
  return applyPrivacyIfNeeded(points, privacyEnabled());
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
    `map:${readMapStyle()}`,
    `marker:${readMarkerStyle()}`,
    `chapter:${chapterMode()}`,
    `privacy:${privacyEnabled()}`,
    `compare:${compareEnabled()}:${compareYear()}`,
    `overlay:${overlayComparePoints.length}`,
    `pace:${activityPaceEnabled()}`,
    `lang:${locale}`,
  ].join(';');
}

function selectedDistanceKm(points: GeoPoint[]): number {
  return cumulativeDistances(points).at(-1) ?? 0;
}

function applyCanvasFormat(): void {
  const format = formatById(formatSelect.value);
  canvas.width = alignEncodeSize(format.width);
  canvas.height = alignEncodeSize(format.height);
}

async function refreshEncodingSupport(): Promise<void> {
  const format = formatById(formatSelect.value);
  compatibilityChecked = false;
  refreshActionAvailability();
  const supported = await canCreateMp4(format.width, format.height);
  compatibilityChecked = true;
  encodingSupported = supported;
  if (supported) {
    compatibilityStatus.textContent = t(locale, 'videoOk');
  } else {
    compatibilityStatus.textContent = isEnglishLike()
      ? `This browser cannot encode ${format.width}×${format.height}. Try 720p or 480p.`
      : `此瀏覽器無法編碼 ${format.width}×${format.height}。請改選 720p 或 480p。`;
  }
  refreshActionAvailability();
}

function refreshActionAvailability(points = currentPoints()): void {
  const hasJourney = points.length >= 2 && selectedDistanceKm(points) > 0;
  previewButton.disabled = isExporting || isPreparing || !hasJourney;
  createButton.disabled = isExporting || isPreparing || !hasJourney || !encodingSupported;
  const mobilePreview = document.getElementById('mobile-preview-button') as HTMLButtonElement | null;
  const mobileCreate = document.getElementById('mobile-create-button') as HTMLButtonElement | null;
  if (mobilePreview) mobilePreview.disabled = previewButton.disabled;
  if (mobileCreate) mobileCreate.disabled = createButton.disabled;
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
  snapshotStats(allPoints.length > 0 ? allPoints : points, locale);
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
    readMapStyle(),
    signal,
    (completed, total) => {
      progressLabel.textContent = isEnglishLike()
        ? `Preparing map ${completed}/${total}`
        : `正在準備地圖 ${completed}/${total}`;
    },
    activityPaceEnabled(),
    locale,
  );
  prepared = nextJourney;
  selectedSignature = signature;
  return nextJourney;
}

function requireMapConsent(): boolean {
  if (mapConsent.checked) return true;
  setSettingsError(locale === 'en'
    ? 'Confirm the map privacy notice first.'
    : '請先確認地圖隱私說明，才會載入地圖圖磚。');
  mapConsent.focus();
  return false;
}

function parseTimelineText(text: string): Promise<unknown> {
  return parseJsonInWorker(text).catch(() => {
    throw new TimelineParseError('malformed-json', '這不是有效或完整的 JSON 檔。');
  });
}

function applyPoints(points: GeoPoint[], sourceName: string, append: boolean): void {
  const capped = downsamplePoints(points, suggestMaxPoints());
  downsampleNote = capped.removed > 0
    ? (isEnglishLike()
      ? ` · thinned ${capped.removed.toLocaleString()} points for memory`
      : ` · 為節省記憶體已精簡 ${capped.removed.toLocaleString('zh-Hant-TW')} 點`)
    : '';
  const nextPoints = capped.points;
  lastSourceName = sourceName;
  if (append && semanticPoints.length > 0) {
    const merged = [...semanticPoints, ...nextPoints]
      .sort((a, b) => a.instant.getTime() - b.instant.getTime());
    const unique = new Map<string, GeoPoint>();
    for (const point of merged) {
      unique.set(`${point.instant.getTime()}:${point.latitude}:${point.longitude}`, point);
    }
    semanticPoints = [...unique.values()];
    mergeLabels.push(sourceName);
  } else {
    semanticPoints = nextPoints;
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
  document.getElementById('step-upload')?.classList.add('onboarding-done');
  localStorage.setItem('tv-onboarding-step', '1');
  previewCard.classList.add('hidden');
  defaultRecentRange(allPoints);
  renderMergeList();
  fileStatus.textContent = (isEnglishLike()
    ? `${sourceName} · ${allPoints.length.toLocaleString()} points`
    : `${sourceName} · ${allPoints.length.toLocaleString('zh-Hant-TW')} 個有效點`) + downsampleNote;
  emptyTimelineBanner.classList.toggle('hidden', allPoints.length >= 5);
  updateSelection();
  pushRecent(sourceName, currentPeriodLabel());
  refreshExtrasLabels(locale);
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
  const data = await parseTimelineText(text);
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
  let compareWorld: ReturnType<typeof compareWorldPoints> | undefined;
  const overlay = overlayComparePoints.length > 1
    ? overlayComparePoints
    : (compareEnabled() && compareYear() > 2000
      ? comparePointsForYear(allPoints, compareYear())
      : []);
  if (overlay.length > 1) compareWorld = compareWorldPoints(overlay);
  const opacityInput = document.getElementById('compare-opacity') as HTMLInputElement | null;
  const burn = Boolean((document.getElementById('burn-captions-toggle') as HTMLInputElement | null)?.checked);
  const showAttribution = Boolean((document.getElementById('show-attribution-toggle') as HTMLInputElement | null)?.checked ?? true);
  const mapStyle = readMapStyle();
  const attributionText = (locale === 'en' && mapStyle !== 'dark' && mapStyle !== 'night' && mapStyle !== 'satellite' && mapStyle !== 'terrain')
    ? '© OpenStreetMap contributors  © CARTO'
    : mapStyle === 'satellite'
      ? '© Esri'
      : mapStyle === 'terrain'
        ? '© OpenStreetMap © OpenTopoMap'
        : '© OpenStreetMap contributors';
  return {
    route: theme.route,
    routeFade: theme.routeFade,
    marker: theme.marker,
    markerRing: theme.markerRing,
    titleBg: theme.titleBg,
    title: theme.title,
    subtitle: theme.subtitle,
    markerStyle: readMarkerStyle(),
    compareWorldPoints: compareWorld,
    compareOpacity: Number(opacityInput?.value || 35) / 100,
    burnCaptions: burn,
    showAttribution,
    attributionText,
    splitCompareProgress: splitCompareEnabled() ? 0.5 : undefined,
  };
}

function stayMarkersForJourney(journey: PreparedJourney): { x: number; y: number; label: string }[] {
  if (!stayPointsEnabled()) return [];
  const viewport = journey.overviewViewport;
  const width = canvas.width;
  const height = canvas.height;
  return detectStayPoints(journey.points).map((stay) => {
    const point = project(stay.latitude, stay.longitude);
    return {
      x: ((point.x - viewport.minX) / Math.max(1e-9, viewport.maxX - viewport.minX)) * width,
      y: ((point.y - viewport.minY) / Math.max(1e-9, viewport.maxY - viewport.minY)) * height,
      label: stay.label,
    };
  });
}

async function renderPreviewAt(progress01: number): Promise<void> {
  if (!requireMapConsent()) return;
  const journey = await getPreparedJourney();
  const frame = {
    journeyProgress: Math.max(0, Math.min(1, progress01)),
    outroProgress: 0,
  };
  const burn = currentStyle().burnCaptions;
  const placeLabel = (placeLabelsToggle.checked || burn)
    ? placeLabelAtProgress(journey.points, journey.cumulativeDistanceKm, frame.journeyProgress, uiLocale(locale))
    : null;
  const mode = burn && chapterMode() === 'off' ? 'day' : chapterMode();
  const chapterLabel = chapterLabelFor(
    mode,
    journey.points,
    journey.cumulativeDistanceKm,
    frame.journeyProgress,
    uiLocale(locale),
  );
  drawFrame(canvas, journey, frame, titleInput.value.trim(), currentPeriodLabel(), {
    ...currentStyle(),
    placeLabel,
    chapterLabel,
    hudText: (() => {
      const hud = speedKmhAt(journey.points, journey.cumulativeDistanceKm, frame.journeyProgress);
      return `${Math.round(hud.distanceKm)} km · ${Math.round(hud.speedKmh)} km/h`;
    })(),
    gradeOverlay: gradeForProgress(journey.points, frame.journeyProgress, readColorGrade()),
    stayMarkers: stayMarkersForJourney(journey),
  });
  const scrubber = document.getElementById('preview-scrubber') as HTMLInputElement | null;
  if (scrubber) scrubber.value = String(Math.round(progress01 * 1000));
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
    applyTimeline(await parseTimelineText(await response.text()), locale === 'en' ? 'Fictional sample' : '虛構範例');
  } catch (error) {
    setError(localizeError(error, locale === 'en' ? 'Sample missing.' : '無法載入虛構範例。'));
    previewCard.classList.remove('hidden');
  }
});

[
  startSelect, endSelect, startDateInput, endDateInput, durationSelect, cameraMovementSelect,
  compressionSelect, outlierSelect, themeSelect, placeLabelsToggle, outroHoldInput,
].forEach((node) => node.addEventListener('change', updateSelection));

formatSelect.addEventListener('change', () => {
  updateSelection();
  void refreshEncodingSupport();
});

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
  locale = parseLocale(langSelect.value);
  localStorage.setItem('tv-locale', locale);
  monthFormatter = new Intl.DateTimeFormat(intlLocale(locale), { year: 'numeric', month: 'long' });
  dateFormatter = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'medium' });
  applyI18n();
  refreshExtrasLabels(locale);
  prepared = null;
  selectedSignature = '';
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
    refreshChapterToc(v14Host);
    const started = performance.now();
    const previewJourneyDuration = Math.min(8, Number(durationSelect.value));
    const outroHold = Number(outroHoldInput.value) || 2.5;
    const previewDuration = totalDurationSeconds(previewJourneyDuration, outroHold);
    const speed = Math.max(1, readPreviewSpeed());
    const tick = (now: number): void => {
      const elapsedSeconds = Math.min(previewDuration, ((now - started) / 1000) * speed);
      const fraction = elapsedSeconds / previewDuration;
      const frame = frameAtElapsedSeconds(elapsedSeconds, previewJourneyDuration, outroHold);
      const scrubber = document.getElementById('preview-scrubber') as HTMLInputElement | null;
      if (scrubber) scrubber.value = String(Math.round(frame.journeyProgress * 1000));
      const burn = currentStyle().burnCaptions;
      const placeLabel = (placeLabelsToggle.checked || burn)
        ? placeLabelAtProgress(journey.points, journey.cumulativeDistanceKm, frame.journeyProgress, uiLocale(locale))
        : null;
      const chapterLabel = chapterLabelFor(
        burn && chapterMode() === 'off' ? 'day' : chapterMode(),
        journey.points,
        journey.cumulativeDistanceKm,
        frame.journeyProgress,
        uiLocale(locale),
      );
      drawFrame(canvas, journey, frame, titleInput.value.trim(), currentPeriodLabel(), {
        ...currentStyle(),
        placeLabel,
        chapterLabel,
        hudText: (() => {
          const hud = speedKmhAt(journey.points, journey.cumulativeDistanceKm, frame.journeyProgress);
          return `${Math.round(hud.distanceKm)} km · ${Math.round(hud.speedKmh)} km/h`;
        })(),
        gradeOverlay: gradeForProgress(journey.points, frame.journeyProgress, readColorGrade()),
        stayMarkers: stayMarkersForJourney(journey),
      });
      progressLabel.textContent = fraction < 1
        ? (locale === 'en' ? `Previewing ${speed}x` : `預覽中 ${speed}x`)
        : (locale === 'en' ? 'Preview complete' : '預覽完成');
      const live = document.getElementById('a11y-live');
      if (live && Math.round(fraction * 20) % 5 === 0) live.textContent = progressLabel.textContent;
      localStorage.setItem('tv-onboarding-step', '2');
      document.getElementById('step-preview')?.classList.add('onboarding-done');
      if (fraction < 1) previewAnimation = requestAnimationFrame(tick);
    };
    previewAnimation = requestAnimationFrame(tick);
    notePreviewOk();
    snapshotStats(journey.points, locale);
  } catch (error) {
    setError(localizeError(error, locale === 'en' ? 'Preview failed.' : '預覽失敗。'));
  } finally {
    isPreparing = false;
    refreshActionAvailability();
  }
});

cancelButton.addEventListener('click', () => {
  cancelButton.disabled = true;
  pauseGate.paused = false;
  progressLabel.textContent = isEnglishLike() ? 'Cancelling…' : '正在取消…';
  exportController?.abort();
});

pauseButton.addEventListener('click', () => {
  pauseGate.paused = !pauseGate.paused;
  pauseButton.textContent = pauseGate.paused ? t(locale, 'resumeEncode') : t(locale, 'pauseEncode');
  if (pauseGate.paused) {
    progressLabel.textContent = isEnglishLike() ? 'Paused' : '已暫停';
  }
});

createButton.addEventListener('click', () => {
  void runExportOnce();
});

async function runExportOnce(): Promise<void> {
  if (!requireMapConsent()) return;
  cancelAnimationFrame(previewAnimation);
  setError(null);
  errorHint.textContent = '';
  resultActions.classList.add('hidden');
  resultVideo.classList.add('hidden');
  shareCard.classList.add('hidden');
  previewCard.classList.remove('hidden');
  progress.classList.remove('hidden');
  cancelButton.classList.remove('hidden');
  pauseButton.classList.remove('hidden');
  cancelButton.disabled = false;
  pauseGate.paused = false;
  pauseButton.textContent = t(locale, 'pauseEncode');
  progress.value = 0;
  stickyProgressBar.value = 0;
  etaLabel.textContent = '';
  isExporting = true;
  document.body.classList.add('is-exporting');
  stickyProgress.classList.remove('hidden');
  window.addEventListener('beforeunload', beforeUnloadGuard);
  refreshActionAvailability();
  exportController = new AbortController();
  const wakeLock = await requestWakeLock();
  const startedAt = performance.now();
  const updateProgress = (fraction: number, label: string): void => {
    progress.value = fraction;
    progressLabel.textContent = label;
    stickyProgressBar.value = fraction;
    stickyProgressLabel.textContent = label;
    if (fraction > 0.05 && !pauseGate.paused) {
      const elapsed = (performance.now() - startedAt) / 1000;
      const remaining = elapsed / fraction - elapsed;
      etaLabel.textContent = formatEta(remaining, uiLocale(locale));
    }
  };
  try {
    const originalFormat = formatSelect.value;
    const autoFallback = Boolean((document.getElementById('auto-fallback-toggle') as HTMLInputElement | null)?.checked);
    const formatAttempts = autoFallback
      ? [originalFormat, ...fallbackFormatIds(originalFormat)]
      : [originalFormat];
    let blob: Blob | null = null;
    let lastError: unknown;
    for (const formatId of formatAttempts) {
      if (exportController.signal.aborted) throw new DOMException('已取消產出影片。', 'AbortError');
      if (formatId !== formatSelect.value) {
        formatSelect.value = formatId;
        prepared = null;
        selectedSignature = '';
        applyCanvasFormat();
        progressLabel.textContent = isEnglishLike()
          ? `Falling back to ${formatId}…`
          : `改以降級解析度 ${formatId} 重試…`;
      }
      try {
        blob = await withRetry(async (attempt) => {
          if (attempt > 0) {
            prepared = null;
            selectedSignature = '';
            progressLabel.textContent = isEnglishLike()
              ? `Retrying encode (${attempt + 1})…`
              : `正在重試產出（第 ${attempt + 1} 次）…`;
          }
          const journey = await getPreparedJourney(exportController!.signal);
          const style = currentStyle();
          const burn = Boolean(style.burnCaptions);
          const mixedAudio = await maybeMixNarration(
            audioBuffer,
            journey.points,
            Number(durationSelect.value) + Number(outroHoldInput.value || 2.5) + introHoldSeconds(),
          );
          progressLabel.textContent = isEnglishLike() ? 'Creating MP4' : '正在產出 MP4';
          const makeBlob = async (withAudio: AudioBuffer | null) => createJourneyMp4(canvas, journey, {
            durationSeconds: Number(durationSelect.value),
            title: titleInput.value.trim() || (isEnglishLike() ? 'My Journey' : '我的旅程'),
            periodLabel: currentPeriodLabel(),
            style: {
              ...style,
              stayMarkers: stayMarkersForJourney(journey),
            },
            outroHoldSeconds: Number(outroHoldInput.value) || 2.5,
            introHoldSeconds: introHoldSeconds(),
            showPlaceLabels: placeLabelsToggle.checked || burn,
            chapterMode: burn && chapterMode() === 'off' ? 'day' : chapterMode(),
            locale: uiLocale(locale),
            audioBuffer: withAudio,
            signal: exportController!.signal,
            pauseGate,
            reverseRoute: reverseRouteEnabled(),
            gradeOverlayAt: (progress) => gradeForProgress(journey.points, progress, readColorGrade()),
            onProgress: (fraction) => {
              updateProgress(
                fraction,
                isEnglishLike()
                  ? `Creating MP4 ${Math.round(fraction * 100)}%`
                  : `正在產出 MP4 ${Math.round(fraction * 100)}%`,
              );
            },
          });
          const primary = await makeBlob(mixedAudio);
          if (dualExportEnabled() && mixedAudio) {
            const silent = await makeBlob(null);
            const silentUrl = URL.createObjectURL(silent);
            const anchor = document.createElement('a');
            anchor.href = silentUrl;
            anchor.download = 'timeline-journey-silent.mp4';
            anchor.click();
            URL.revokeObjectURL(silentUrl);
          }
          return primary;
        }, { retries: 1, delayMs: 400 });
        break;
      } catch (error) {
        lastError = error;
        if (error instanceof DOMException && error.name === 'AbortError') throw error;
      }
    }
    if (!blob) throw lastError ?? new Error('encode failed');
    if (formatSelect.value !== originalFormat) {
      // keep successful fallback selection
      void refreshEncodingSupport();
    }
    const journey = prepared;
    noteEncodeOk();
    document.getElementById('step-create')?.classList.add('onboarding-done');
    localStorage.setItem('tv-onboarding-step', '3');
    saveSuccessSettings({
      formatId: formatSelect.value,
      themeId: themeSelect.value,
      duration: durationSelect.value,
      camera: cameraMovementSelect.value,
    });
    pushQualityRow({
      at: Date.now(),
      ok: true,
      formatId: formatSelect.value,
      durationSec: Number(durationSelect.value),
      encodeMs: performance.now() - startedAt,
    });
    snapshotStats(journey?.points ?? currentPoints(), locale);
    (window as unknown as { __tvRefreshV15?: () => void }).__tvRefreshV15?.();
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);
    resultFile = new File([blob], 'timeline-journey.mp4', { type: 'video/mp4' });
    downloadLink.href = resultUrl;
    resultVideo.src = resultUrl;
    resultVideo.classList.remove('hidden');
    resultActions.classList.remove('hidden');
    progressLabel.textContent = isEnglishLike()
      ? `Video ready · ${(blob.size / 1_000_000).toFixed(1)} MB`
      : `影片已就緒 · ${(blob.size / 1_000_000).toFixed(1)} MB`;
    stickyProgressLabel.textContent = progressLabel.textContent;
    etaLabel.textContent = '';
    const distance = Math.round(selectedDistanceKm(journey?.points ?? currentPoints()));
    shareCard.classList.remove('hidden');
    shareCardTitle.textContent = titleInput.value.trim() || (isEnglishLike() ? 'My Journey' : '我的旅程');
    shareCardMeta.textContent = `${currentPeriodLabel()} · ${distance} km`;
    shareCardCanvas.width = 480;
    shareCardCanvas.height = 480;
    const ctx = shareCardCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1c2a24';
      ctx.fillRect(0, 0, 480, 480);
      ctx.drawImage(canvas, 0, 0, 480, 480);
      ctx.fillStyle = 'rgba(255,252,247,0.92)';
      ctx.fillRect(24, 360, 432, 96);
      ctx.fillStyle = '#1c2a24';
      ctx.font = '700 28px sans-serif';
      ctx.fillText(shareCardTitle.textContent, 40, 400, 400);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#5d6b64';
      ctx.fillText(shareCardMeta.textContent, 40, 430, 400);
    }
    canvas.toBlob((poster) => {
      if (!poster) return;
      if (posterUrl) URL.revokeObjectURL(posterUrl);
      posterUrl = URL.createObjectURL(poster);
    }, 'image/png');
    const shareData = { files: [resultFile] };
    shareButton.hidden = !(typeof navigator.share === 'function'
      && (typeof navigator.canShare !== 'function' || navigator.canShare(shareData)));
    recordEncodePerf({
      durationSec: Number(durationSelect.value),
      encodeMs: performance.now() - startedAt,
      points: journey?.points.length ?? currentPoints().length,
      width: canvas.width,
      height: canvas.height,
    });
    refreshExtrasLabels(locale);
    pushRecent(lastSourceName || 'timeline', currentPeriodLabel());
  } catch (error) {
    if (exportController.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      progressLabel.textContent = isEnglishLike() ? 'Cancelled' : '已取消產出影片';
      progress.value = 0;
      etaLabel.textContent = '';
    } else {
      noteEncodeFail();
      pushQualityRow({
        at: Date.now(),
        ok: false,
        formatId: formatSelect.value,
        durationSec: Number(durationSelect.value),
        encodeMs: performance.now() - startedAt,
        message: error instanceof Error ? error.message.slice(0, 80) : 'fail',
      });
      showClassifiedError(error, uiLocale(locale), setError, errorHint);
      progressLabel.textContent = isEnglishLike() ? 'Could not create video' : '無法產出影片';
    }
  } finally {
    await wakeLock?.release().catch(() => undefined);
    exportController = null;
    isExporting = false;
    pauseGate.paused = false;
    document.body.classList.remove('is-exporting');
    stickyProgress.classList.add('hidden');
    window.removeEventListener('beforeunload', beforeUnloadGuard);
    cancelButton.classList.add('hidden');
    pauseButton.classList.add('hidden');
    refreshActionAvailability();
  }
}

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

downloadHeatmapButton.addEventListener('click', () => {
  const points = currentPoints();
  if (points.length < 2) return;
  const heat = document.createElement('canvas');
  heat.width = 1080;
  heat.height = 1080;
  drawHeatmapPoster(
    heat,
    points,
    titleInput.value.trim() || (isEnglishLike() ? 'My Journey' : '我的旅程'),
    `${currentPeriodLabel()} · ${Math.round(selectedDistanceKm(points))} km`,
  );
  heat.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'timeline-heatmap.png';
    anchor.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
});

downloadSrtButton.addEventListener('click', () => {
  const points = prepared?.points ?? currentPoints();
  const distances = prepared?.cumulativeDistanceKm ?? cumulativeDistances(points);
  const mode = chapterMode() === 'off' ? 'day' : chapterMode();
  const srt = buildJourneySrt(
    mode,
    points,
    distances,
    Number(durationSelect.value),
    uiLocale(locale),
  );
  if (!srt) return;
  downloadText('timeline-chapters.srt', srt, 'application/x-subrip');
});

compareFileInput.addEventListener('change', async () => {
  const file = compareFileInput.files?.[0];
  if (!file) return;
  try {
    const kind = detectImportKind(file);
    const text = await file.text();
    let points: GeoPoint[] = [];
    if (kind === 'gpx') points = parseGpx(text);
    else if (kind === 'kml') points = parseKml(text);
    else points = parseTimelineJson(await parseTimelineText(text));
    overlayComparePoints = downsamplePoints(points, suggestMaxPoints()).points;
    fileStatus.textContent = isEnglishLike()
      ? `Compare file loaded · ${overlayComparePoints.length} points`
      : `已載入對照檔 · ${overlayComparePoints.length.toLocaleString('zh-Hant-TW')} 點`;
    updateSelection();
  } catch (error) {
    setSettingsError(localizeError(error, isEnglishLike() ? 'Could not read compare file.' : '無法讀取對照檔。'));
  } finally {
    compareFileInput.value = '';
  }
});

function anotherRound(): void {
  resultActions.classList.add('hidden');
  resultVideo.classList.add('hidden');
  shareCard.classList.add('hidden');
  setError(null);
  progress.classList.add('hidden');
  progressLabel.textContent = isEnglishLike() ? 'Ready for another round' : '可再開一輪';
  settingsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  startDateInput.focus();
}

void refreshEncodingSupport();

async function startHeroDemo(): Promise<void> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}sample-timeline.json`);
    if (!response.ok) return;
    const points = parseTimelineJson(JSON.parse(await response.text()));
    const journey = await prepareJourney(points, 360, 360, 'steady', 10, 'balanced', 'light', undefined, undefined, false, locale);
    const loop = (now: number): void => {
      const elapsed = (now / 1000) % totalDurationSeconds(8, 1.5);
      const frame = frameAtElapsedSeconds(elapsed, 8, 1.5);
      drawFrame(
        heroDemoCanvas,
        journey,
        frame,
        isEnglishLike() ? 'Sample Journey' : '範例旅程',
        isEnglishLike() ? 'Demo' : '示範',
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

function startTutorialPlayer(): void {
  const dialog = document.getElementById('tutorial-dialog') as HTMLDialogElement | null;
  const slides = [...document.querySelectorAll<HTMLElement>('.tutorial-slide')];
  const bar = document.querySelector<HTMLElement>('.tutorial-progress span');
  const replay = document.getElementById('tutorial-replay');
  let timer = 0;
  let step = 0;
  const play = (): void => {
    window.clearInterval(timer);
    step = 0;
    const tick = (): void => {
      slides.forEach((slide, index) => slide.classList.toggle('is-active', index === step));
      if (bar) {
        bar.style.width = `${100 / slides.length}%`;
        bar.style.marginLeft = `${(100 / slides.length) * step}%`;
      }
      step = (step + 1) % slides.length;
    };
    tick();
    timer = window.setInterval(tick, 2800);
  };
  dialog?.addEventListener('close', () => window.clearInterval(timer));
  document.getElementById('tutorial-open-button')?.addEventListener('click', () => {
    play();
  });
  replay?.addEventListener('click', play);
}

const visits = Number(localStorage.getItem('tv-visits') ?? '0') + 1;
localStorage.setItem('tv-visits', String(visits));
visitCount.textContent = isEnglishLike()
  ? `Local visits on this device: ${visits}`
  : `此裝置本機造訪次數：${visits}`;

applyI18n();
const brand = loadBrand();
brandSiteName.value = brand.siteName;
brandTagline.value = brand.tagline;
brandSave.addEventListener('click', () => {
  const next = {
    siteName: brandSiteName.value.trim() || 'Timeline Visualizer',
    tagline: brandTagline.value.trim(),
    customDomainNote: '',
  };
  saveBrand(next);
  applyBrandToDom(next);
  if (!next.tagline) applyI18n();
});

playSampleVideoButton.addEventListener('click', async () => {
  playSampleVideoButton.disabled = true;
  try {
    let blob = await getCachedSampleVideo();
    if (!blob) {
      playSampleVideoButton.textContent = isEnglishLike() ? 'Encoding sample…' : '正在編碼範例…';
      const response = await fetch(`${import.meta.env.BASE_URL}sample-timeline.json`);
      if (!response.ok) throw new Error('sample missing');
      const points = parseTimelineJson(JSON.parse(await response.text()));
      const offscreen = document.createElement('canvas');
      offscreen.width = 480;
      offscreen.height = 480;
      const journey = await prepareJourney(points, 480, 480, 'steady', 8, 'balanced', 'light', undefined, undefined, false, locale);
      blob = await createJourneyMp4(offscreen, journey, {
        durationSeconds: 8,
        title: isEnglishLike() ? 'Sample Journey' : '範例旅程',
        periodLabel: isEnglishLike() ? 'Demo' : '示範',
        style: {
          ...themeById('ember'),
          markerStyle: 'dot',
        },
        outroHoldSeconds: 1.5,
        showPlaceLabels: true,
        chapterMode: 'off',
        locale: uiLocale(locale),
      });
      await setCachedSampleVideo(blob);
    }
    sampleResultVideo.src = URL.createObjectURL(blob);
    sampleResultVideo.classList.remove('hidden');
    heroDemoCanvas.classList.add('hidden');
    await sampleResultVideo.play();
  } catch (error) {
    setError(localizeError(error, isEnglishLike() ? 'Could not play sample video.' : '無法播放範例影片。'));
  } finally {
    playSampleVideoButton.disabled = false;
    playSampleVideoButton.textContent = t(locale, 'playSampleVideo');
  }
});

void startHeroDemo();
startTutorialPlayer();

wireAdvancedControls({
  locale: () => uiLocale(locale),
  allPoints: () => allPoints,
  setPointsSelection: (points) => {
    const bounds = rangeBounds(points);
    if (!bounds) return;
    exactDateToggle.checked = true;
    exactDateToggle.dispatchEvent(new Event('change'));
    startDateInput.value = bounds.startDate;
    endDateInput.value = bounds.endDate;
  },
  currentPoints,
  selectedDistanceKm,
  updateSelection,
  requireMapConsent,
  runExportOnce,
  setError,
  setSettingsError,
  getTitle: () => titleInput.value.trim() || (isEnglishLike() ? 'My Journey' : '我的旅程'),
  getPeriodLabel: currentPeriodLabel,
  canvas,
  flashAction: (message) => {
    selectionSummary.textContent = message;
    const live = document.getElementById('a11y-live');
    if (live) live.textContent = message;
  },
});

wireExtras({
  locale: () => locale,
  preview: () => {
    if (!previewButton.disabled) previewButton.click();
  },
  create: () => {
    if (!createButton.disabled) createButton.click();
  },
  updateSelection,
  anotherRound,
});

v14Host = {
  locale: () => locale,
  currentPoints,
  prepared: () => prepared,
  updateSelection,
  requireMapConsent,
  preview: () => {
    if (!previewButton.disabled) previewButton.click();
  },
  create: () => {
    if (!createButton.disabled) createButton.click();
  },
  getTitle: () => titleInput.value.trim() || (isEnglishLike() ? 'My Journey' : '我的旅程'),
  getPeriodLabel: currentPeriodLabel,
  selectedDistanceKm,
  readMapStyle,
  chapterMode,
  setPreviewProgress: (value: number) => { void renderPreviewAt(value); },
  getCompareOpacity: () => Number((document.getElementById('compare-opacity') as HTMLInputElement | null)?.value || 35) / 100,
  applyDateRangeFraction: (start01: number, end01: number) => {
    if (allPoints.length < 2) return;
    const keys = [...new Set(allPoints.map(pointDateKey))].sort();
    if (keys.length === 0) return;
    const startIndex = Math.max(0, Math.min(keys.length - 1, Math.floor(start01 * (keys.length - 1))));
    const endIndex = Math.max(startIndex, Math.min(keys.length - 1, Math.ceil(end01 * (keys.length - 1))));
    exactDateToggle.checked = true;
    exactDateToggle.dispatchEvent(new Event('change'));
    startDateInput.value = keys[startIndex];
    endDateInput.value = keys[endIndex];
    updateSelection();
  },
};
wireV14(v14Host);
document.getElementById('chapter-select')?.addEventListener('change', () => refreshChapterToc(v14Host));

wireV15({
  locale: () => locale,
  currentPoints,
  prepared: () => prepared,
  cumulativeFor: (points) => cumulativeDistances(points),
  updateSelection,
  setPreviewProgress: (value) => { void renderPreviewAt(value); },
  applyClipRange: (startDate, endDate, durationSec) => {
    exactDateToggle.checked = true;
    exactDateToggle.dispatchEvent(new Event('change'));
    startDateInput.value = startDate;
    endDateInput.value = endDate;
    const duration = String(durationSec);
    if ([...durationSelect.options].some((option) => option.value === duration)) {
      durationSelect.value = duration;
    }
    updateSelection();
  },
  getTitle: () => titleInput.value.trim() || (isEnglishLike() ? 'My Journey' : '我的旅程'),
  getPeriodLabel: currentPeriodLabel,
  chapterMode,
  mapConsent: () => mapConsent.checked,
  encodingSupported: () => encodingSupported,
  formatId: () => formatSelect.value,
  readMapStyle,
  getResultFile: () => resultFile,
  announce: (text) => {
    const live = document.getElementById('a11y-live');
    if (live) live.textContent = text;
  },
});

wireV16({
  locale: () => locale,
  currentPoints,
  updateSelection,
  applyClipRange: (startDate, endDate, durationSec) => {
    exactDateToggle.checked = true;
    exactDateToggle.dispatchEvent(new Event('change'));
    startDateInput.value = startDate;
    endDateInput.value = endDate;
    const duration = String(durationSec);
    if ([...durationSelect.options].some((option) => option.value === duration)) {
      durationSelect.value = duration;
    }
    updateSelection();
  },
  setPreviewProgress: (value) => { void renderPreviewAt(value); },
  getTitle: () => titleInput.value.trim() || (isEnglishLike() ? 'My Journey' : '我的旅程'),
  getPeriodLabel: currentPeriodLabel,
  previewLive: () => {
    if (mapConsent.checked && currentPoints().length >= 2) {
      void renderPreviewAt(Number((document.getElementById('preview-scrubber') as HTMLInputElement | null)?.value || 500) / 1000);
    }
  },
  announce: (text) => {
    const live = document.getElementById('a11y-live');
    if (live) live.textContent = text;
    selectionSummary.textContent = text;
  },
  getAudioBuffer: () => audioBuffer,
  setAudioBuffer: (buffer) => { audioBuffer = buffer; },
  runExportOnce,
  retryAtFormat: (formatId) => {
    formatSelect.value = formatId;
    formatSelect.dispatchEvent(new Event('change'));
    void runExportOnce();
  },
  chapterMode,
});

document.addEventListener('visibilitychange', () => {
  // Keep encode running in background tabs; re-request wake lock when visible again.
  if (document.visibilityState === 'visible' && isExporting) {
    void requestWakeLock();
  }
});

['map-style-select', 'marker-style-select', 'chapter-select', 'preview-speed-select', 'privacy-blur-toggle', 'compare-toggle', 'compare-year-input', 'activity-pace-toggle', 'burn-captions-toggle', 'auto-fallback-toggle', 'show-attribution-toggle']
  .forEach((id) => {
    document.getElementById(id)?.addEventListener('change', updateSelection);
  });

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', async (event) => {
    if (event.data?.type !== 'SHARE_TARGET_FILE') return;
    try {
      const file = new File([event.data.buffer], event.data.name || 'Timeline.json', {
        type: event.data.mime || 'application/json',
      });
      await loadFile(file, false);
    } catch (error) {
      setError(localizeError(error, isEnglishLike() ? 'Could not open shared file.' : '無法開啟分享進來的檔案。'));
      previewCard.classList.remove('hidden');
    }
  });
}
