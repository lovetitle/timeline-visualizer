import { recordEncodeFail, recordEncodeOk, recordPreviewOk } from './anonStats';
import { buildDayChapters, buildCityChapters } from './chapters';
import { packTilesFromKeys, importTilePack } from './offlineTiles';
import { QUICK_PRESETS, fallbackFormatIds } from './presets';
import { computeJourneyStats } from './stats';
import { saveJourneyStatsSnapshot } from './statsPage';
import { drawStoryPoster } from './storyPoster';
import type { GeoPoint, PreparedJourney } from './types';
import { uiLocale } from './localeUtil';
import type { Locale } from './i18n';

export interface V14Host {
  locale: () => Locale;
  currentPoints: () => GeoPoint[];
  prepared: () => PreparedJourney | null;
  updateSelection: () => void;
  requireMapConsent: () => boolean;
  preview: () => void;
  create: () => void;
  getTitle: () => string;
  getPeriodLabel: () => string;
  selectedDistanceKm: (points: GeoPoint[]) => number;
  readMapStyle: () => string;
  chapterMode: () => string;
  setPreviewProgress: (progress01: number) => void;
  getCompareOpacity: () => number;
  applyDateRangeFraction: (start01: number, end01: number) => void;
}

export function wireV14(host: V14Host): void {
  const setVal = (id: string, value: string) => {
    const node = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
    if (node) node.value = value;
  };

  document.getElementById('preset-reels')?.addEventListener('click', () => {
    const preset = QUICK_PRESETS[0];
    setVal('format-select', preset.formatId);
    setVal('duration', preset.duration);
    setVal('camera-movement', preset.camera);
    setVal('compression-select', preset.compression);
    setVal('theme-select', preset.theme);
    host.updateSelection();
  });
  document.getElementById('preset-island')?.addEventListener('click', () => {
    const preset = QUICK_PRESETS[1];
    setVal('format-select', preset.formatId);
    setVal('duration', preset.duration);
    setVal('camera-movement', preset.camera);
    setVal('compression-select', preset.compression);
    setVal('theme-select', preset.theme);
    host.updateSelection();
  });
  document.getElementById('preset-business')?.addEventListener('click', () => {
    const preset = QUICK_PRESETS[2];
    setVal('format-select', preset.formatId);
    setVal('duration', preset.duration);
    setVal('camera-movement', preset.camera);
    setVal('compression-select', preset.compression);
    setVal('theme-select', preset.theme);
    host.updateSelection();
  });

  document.getElementById('mobile-preview-button')?.addEventListener('click', () => host.preview());
  document.getElementById('mobile-create-button')?.addEventListener('click', () => host.create());

  const scrubber = document.getElementById('preview-scrubber') as HTMLInputElement | null;
  scrubber?.addEventListener('input', () => {
    host.setPreviewProgress(Number(scrubber.value) / 1000);
  });

  document.getElementById('compare-opacity')?.addEventListener('input', () => host.updateSelection());

  const startScrub = document.getElementById('range-scrub-start') as HTMLInputElement | null;
  const endScrub = document.getElementById('range-scrub-end') as HTMLInputElement | null;
  const syncDateScrub = (): void => {
    if (!startScrub || !endScrub) return;
    let start = Number(startScrub.value);
    let end = Number(endScrub.value);
    if (start > end) {
      const swap = start;
      start = end;
      end = swap;
      startScrub.value = String(start);
      endScrub.value = String(end);
    }
    host.applyDateRangeFraction(start / 1000, end / 1000);
  };
  startScrub?.addEventListener('change', syncDateScrub);
  endScrub?.addEventListener('change', syncDateScrub);

  document.getElementById('download-story-button')?.addEventListener('click', () => {
    const points = host.currentPoints();
    if (points.length < 2) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const km = Math.round(host.selectedDistanceKm(points));
    drawStoryPoster(
      canvas,
      points,
      host.getTitle(),
      host.getPeriodLabel(),
      `${points.length} pts · ${km} km`,
    );
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'timeline-story.png';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  });

  document.getElementById('export-tiles-button')?.addEventListener('click', async () => {
    const journey = host.prepared();
    if (!journey) return;
    const style = host.readMapStyle();
    const keys = [...journey.tiles.keys()].map((key) => `${style}:${key}`);
    const blob = await packTilesFromKeys(keys);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timeline-tiles-offline.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  const importTiles = document.getElementById('import-tiles-input') as HTMLInputElement | null;
  importTiles?.addEventListener('change', async () => {
    const file = importTiles.files?.[0];
    if (!file) return;
    try {
      await importTilePack(await file.text());
    } finally {
      importTiles.value = '';
    }
  });
}

export function refreshChapterToc(host: V14Host): void {
  const toc = document.getElementById('chapter-toc');
  const journey = host.prepared();
  if (!toc) return;
  if (!journey || journey.points.length < 2) {
    toc.replaceChildren();
    return;
  }
  const mode = host.chapterMode() === 'off' ? 'day' : host.chapterMode();
  const locale = uiLocale(host.locale());
  const chapters = mode === 'city'
    ? buildCityChapters(journey.points, journey.cumulativeDistanceKm, locale)
    : buildDayChapters(journey.points, journey.cumulativeDistanceKm, locale);
  toc.replaceChildren(...chapters.map((chapter) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ghost';
    button.textContent = chapter.label;
    button.addEventListener('click', () => host.setPreviewProgress(chapter.startProgress));
    item.append(button);
    return item;
  }));
}

export function snapshotStats(points: GeoPoint[], locale: Locale): void {
  const stats = computeJourneyStats(points, uiLocale(locale));
  saveJourneyStatsSnapshot(stats);
}

export function notePreviewOk(): void {
  recordPreviewOk();
}

export function noteEncodeOk(): void {
  recordEncodeOk();
}

export function noteEncodeFail(): void {
  recordEncodeFail();
}

export { fallbackFormatIds };
