import { applyA11yPrefs, cycleFontScale, toggleContrast, toggleReduceMotion } from './a11yPrefs';
import { gradeForProgress, type ColorGradeMode } from './colorGrade';
import { runHealthCheck } from './healthCheck';
import { bestHighlightClip, yearWrappedStats } from './highlights';
import { drawJourneyReport } from './journeyReport';
import { addLifeTag, loadLifeTags } from './lifeTags';
import { createNarrationChimeBuffer, mixAudioBuffers } from './narrationAudio';
import { drawShareQr } from './shareQr';
import { loadStoryboard } from './storyboard';
import { trimIdleEdges } from './smartSelect';
import { detectStayPoints } from './stayPoints';
import { createZip, downloadBlob } from './zipPack';
import { buildJourneySrt } from './srt';
import { cumulativeDistances } from './geo';
import type { GeoPoint } from './types';
import { t, type Locale } from './i18n';
import { uiLocale } from './localeUtil';
import { buildDayChapters } from './chapters';
import { narrativeFromPoints } from './narrative';

function msg(locale: Locale, key: Parameters<typeof t>[1], extra = ''): string {
  return `${t(locale, key)}${extra}`;
}

export interface V16Host {
  locale: () => Locale;
  currentPoints: () => GeoPoint[];
  updateSelection: () => void;
  applyClipRange: (startDate: string, endDate: string, durationSec: number) => void;
  setPreviewProgress: (progress01: number) => void;
  getTitle: () => string;
  getPeriodLabel: () => string;
  previewLive: () => void;
  announce: (text: string) => void;
  getAudioBuffer: () => AudioBuffer | null;
  setAudioBuffer: (buffer: AudioBuffer | null) => void;
  runExportOnce: () => Promise<void>;
  retryAtFormat: (formatId: string) => void;
  chapterMode: () => string;
}

export function readColorGrade(): ColorGradeMode {
  const value = (document.getElementById('color-grade-select') as HTMLSelectElement | null)?.value;
  if (value === 'auto' || value === 'warm' || value === 'cool' || value === 'night') return value;
  return 'off';
}

export function introHoldSeconds(): number {
  return Number((document.getElementById('intro-hold') as HTMLInputElement | null)?.value || 0) || 0;
}

export function reverseRouteEnabled(): boolean {
  return Boolean((document.getElementById('reverse-route-toggle') as HTMLInputElement | null)?.checked);
}

export function narrationChimeEnabled(): boolean {
  return Boolean((document.getElementById('narration-chime-toggle') as HTMLInputElement | null)?.checked);
}

export function stayPointsEnabled(): boolean {
  return Boolean((document.getElementById('stay-points-toggle') as HTMLInputElement | null)?.checked);
}

export function splitCompareEnabled(): boolean {
  return Boolean((document.getElementById('split-compare-toggle') as HTMLInputElement | null)?.checked);
}

export function dualExportEnabled(): boolean {
  return Boolean((document.getElementById('dual-export-toggle') as HTMLInputElement | null)?.checked);
}

export function trimIntensity(): number {
  return Number((document.getElementById('trim-intensity') as HTMLInputElement | null)?.value || 3);
}

export async function maybeMixNarration(
  base: AudioBuffer | null,
  points: GeoPoint[],
  durationSec: number,
): Promise<AudioBuffer | null> {
  if (!narrationChimeEnabled()) return base;
  const chapters = Math.max(1, new Set(points.map((point) => point.instant.toDateString())).size);
  const chime = await createNarrationChimeBuffer(Math.min(12, chapters), durationSec + 3);
  return mixAudioBuffers(base, chime);
}

export function wireV16(host: V16Host): void {
  applyA11yPrefs();

  const flash = (text: string) => host.announce(text);

  document.getElementById('highlight-30-button')?.addEventListener('click', () => {
    const points = host.currentPoints();
    const cum = cumulativeDistances(points);
    const clip = bestHighlightClip(points, cum, 30);
    if (!clip) {
      flash(msg(host.locale(), 'noHighlight'));
      return;
    }
    host.applyClipRange(clip.startDate, clip.endDate, clip.targetSeconds);
    host.setPreviewProgress(clip.startProgress);
    flash(`${msg(host.locale(), 'highlightApplied')} · ${clip.startDate}→${clip.endDate}`);
  });

  document.getElementById('trim-intensity')?.addEventListener('change', () => {
    const points = trimIdleEdges(host.currentPoints(), trimIntensity());
    if (points.length < 2) return;
    const start = points[0].instant.toISOString().slice(0, 10);
    const end = points.at(-1)!.instant.toISOString().slice(0, 10);
    host.applyClipRange(start, end, Number((document.getElementById('duration') as HTMLSelectElement)?.value || 30));
    flash(`${msg(host.locale(), 'trimApplied')} ${trimIntensity()} · ${points.length}`);
  });

  document.getElementById('health-check-button')?.addEventListener('click', () => {
    const report = runHealthCheck(host.locale());
    const panel = document.getElementById('health-check-panel');
    if (!panel) return;
    panel.replaceChildren(...[
      `VideoEncoder: ${report.videoEncoder ? 'OK' : 'NO'}`,
      `IndexedDB: ${report.indexedDb ? 'OK' : 'NO'}`,
      `CPU threads: ${report.hardwareConcurrency}`,
      report.deviceMemoryGb ? `RAM ~${report.deviceMemoryGb} GB` : 'RAM: n/a',
      ...report.tips,
    ].map((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
  });

  document.getElementById('a11y-contrast-button')?.addEventListener('click', () => toggleContrast());
  document.getElementById('a11y-font-button')?.addEventListener('click', () => cycleFontScale());
  document.getElementById('a11y-motion-button')?.addEventListener('click', () => toggleReduceMotion());

  document.getElementById('download-report-button')?.addEventListener('click', () => {
    const points = host.currentPoints();
    if (points.length < 2) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    drawJourneyReport(canvas, points, host.getTitle(), host.getPeriodLabel(), host.locale());
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'timeline-report.png');
    });
  });

  document.getElementById('pack-export-button')?.addEventListener('click', async () => {
    const points = host.currentPoints();
    if (points.length < 2) return;
    const cum = cumulativeDistances(points);
    const chapters = buildDayChapters(points, cum, uiLocale(host.locale()));
    const script = narrativeFromPoints(host.getTitle(), host.getPeriodLabel(), chapters, points, cum, host.locale());
    const srt = buildJourneySrt(
      host.chapterMode() === 'city' ? 'city' : 'day',
      points,
      cum,
      Number((document.getElementById('duration') as HTMLSelectElement)?.value || 30),
      uiLocale(host.locale()),
    );
    const enc = new TextEncoder();
    const zip = createZip([
      { name: 'narrative.txt', data: enc.encode(script) },
      { name: 'chapters.srt', data: enc.encode(srt) },
      { name: 'meta.json', data: enc.encode(JSON.stringify({ title: host.getTitle(), period: host.getPeriodLabel(), points: points.length }, null, 2)) },
    ]);
    downloadBlob(zip, 'timeline-pack.zip');
    flash(msg(host.locale(), 'packDownloaded'));
  });

  document.getElementById('storyboard-zip-button')?.addEventListener('click', () => {
    const items = loadStoryboard();
    const enc = new TextEncoder();
    const zip = createZip([
      { name: 'storyboard.json', data: enc.encode(JSON.stringify(items, null, 2)) },
      { name: 'readme.txt', data: enc.encode('Run each clip from the storyboard queue in the app, then save MP4s.') },
    ]);
    downloadBlob(zip, 'storyboard.zip');
  });

  document.getElementById('add-life-tag-button')?.addEventListener('click', () => {
    const label = (document.getElementById('life-tag-input') as HTMLInputElement | null)?.value || '';
    const start = (document.getElementById('start-date') as HTMLInputElement | null)?.value;
    const end = (document.getElementById('end-date') as HTMLInputElement | null)?.value;
    if (!start || !end) return;
    addLifeTag(label, start, end);
    refreshLifeTags();
  });

  const refreshLifeTags = (): void => {
    const list = document.getElementById('life-tags-list');
    if (!list) return;
    list.replaceChildren(...loadLifeTags().map((tag) => {
      const item = document.createElement('li');
      item.textContent = `${tag.label} · ${tag.startDate}→${tag.endDate}`;
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => host.applyClipRange(tag.startDate, tag.endDate, 30));
      return item;
    }));
  };
  refreshLifeTags();

  document.getElementById('wrapped-refresh-button')?.addEventListener('click', () => {
    const stats = yearWrappedStats(host.currentPoints());
    const panel = document.getElementById('wrapped-panel');
    if (!panel) return;
    panel.textContent = host.locale() === 'en'
      ? `${stats.year} ${t(host.locale(), 'wrappedYear')}: ${stats.km} km · ${stats.days} days · peak ${stats.farthestDate}`
      : host.locale() === 'ja'
        ? `${stats.year}${t(host.locale(), 'wrappedYear')}：${stats.km} km · ${stats.days} 日 · 最長 ${stats.farthestDate}`
        : host.locale() === 'ko'
          ? `${stats.year}${t(host.locale(), 'wrappedYear')}: ${stats.km} km · ${stats.days}일 · 최대 ${stats.farthestDate}`
          : `${stats.year} ${t(host.locale(), 'wrappedYear')}：${stats.km} km · ${stats.days} 天 · 最遠 ${stats.farthestDate}`;
  });

  document.getElementById('retry-720-button')?.addEventListener('click', () => host.retryAtFormat('sq720'));
  document.getElementById('retry-480-button')?.addEventListener('click', () => host.retryAtFormat('sq480'));

  // Live preview when settings change
  let liveTimer = 0;
  const liveIds = [
    'theme-select', 'format-select', 'map-style-select', 'marker-style-select',
    'color-grade-select', 'camera-movement', 'compression-select', 'reverse-route-toggle',
    'stay-points-toggle', 'split-compare-toggle', 'intro-hold', 'burn-captions-toggle',
  ];
  liveIds.forEach((id) => {
    document.getElementById(id)?.addEventListener('change', () => {
      window.clearTimeout(liveTimer);
      liveTimer = window.setTimeout(() => host.previewLive(), 280);
    });
  });

  // Onboarding steps
  const steps = ['step-export', 'step-upload', 'step-preview', 'step-create'];
  const mark = (index: number): void => {
    steps.forEach((id, stepIndex) => {
      document.getElementById(id)?.classList.toggle('onboarding-done', stepIndex <= index);
    });
    localStorage.setItem('tv-onboarding-step', String(index));
  };
  mark(Number(localStorage.getItem('tv-onboarding-step') || 0));
  document.getElementById('onboarding-next')?.addEventListener('click', () => {
    const current = Number(localStorage.getItem('tv-onboarding-step') || 0);
    mark(Math.min(3, current + 1));
  });

  // Calendar chips from unique days
  const refreshCalendar = (): void => {
    const hostEl = document.getElementById('calendar-day-chips');
    if (!hostEl) return;
    const days = [...new Set(host.currentPoints().map((point) => point.instant.toISOString().slice(0, 10)))].sort();
    hostEl.replaceChildren(...days.slice(0, 60).map((day) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ghost heat-cell';
      button.textContent = day.slice(5);
      button.title = day;
      button.addEventListener('click', () => {
        host.applyClipRange(day, day, 15);
        flash(day);
      });
      return button;
    }));
  };
  document.getElementById('refresh-calendar-button')?.addEventListener('click', refreshCalendar);
  refreshCalendar();

  document.getElementById('draw-share-qr-button')?.addEventListener('click', () => {
    const canvas = document.getElementById('share-qr-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    drawShareQr(canvas, window.location.href.split('#')[0]);
    canvas.classList.remove('hidden');
  });

  document.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const scrubber = document.getElementById('preview-scrubber') as HTMLInputElement | null;
      if (scrubber) {
        scrubber.value = String(Math.min(1000, Number(scrubber.value) + 25));
        host.setPreviewProgress(Number(scrubber.value) / 1000);
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const scrubber = document.getElementById('preview-scrubber') as HTMLInputElement | null;
      if (scrubber) {
        scrubber.value = String(Math.max(0, Number(scrubber.value) - 25));
        host.setPreviewProgress(Number(scrubber.value) / 1000);
      }
    } else if (event.key.toLowerCase() === 's') {
      document.getElementById('highlight-30-button')?.dispatchEvent(new Event('click'));
    }
  });

  void detectStayPoints;
  void gradeForProgress;
}
