import { buildDayChapters, buildCityChapters, type Chapter } from './chapters';
import { buildExportChecklist, renderChecklist } from './exportChecklist';
import { narrativeFromPoints, speakNarrative, stopNarrativeSpeech } from './narrative';
import { packTilesFromKeys } from './offlineTiles';
import { summarizeQuality } from './qualityDash';
import { saveLocalSharePreview, sharePreviewUrl } from './shareLocal';
import { suggestSmartClips } from './smartClips';
import { clipToStoryboard, loadStoryboard, saveStoryboard } from './storyboard';
import { applySuccessSettingsToDom, saveSuccessSettings } from './successSettings';
import type { GeoPoint, PreparedJourney } from './types';
import type { Locale } from './i18n';
import { t } from './i18n';
import { uiLocale } from './localeUtil';

export interface V15Host {
  locale: () => Locale;
  currentPoints: () => GeoPoint[];
  prepared: () => PreparedJourney | null;
  cumulativeFor: (points: GeoPoint[]) => number[];
  updateSelection: () => void;
  setPreviewProgress: (progress01: number) => void;
  applyClipRange: (startDate: string, endDate: string, durationSec: number) => void;
  getTitle: () => string;
  getPeriodLabel: () => string;
  chapterMode: () => string;
  mapConsent: () => boolean;
  encodingSupported: () => boolean;
  formatId: () => string;
  readMapStyle: () => string;
  getResultFile: () => File | null;
  announce: (text: string) => void;
}

let chapterOrder: Chapter[] = [];

export function getOrderedChapters(): Chapter[] {
  return chapterOrder;
}

export function wireV15(host: V15Host): void {
  applySuccessSettingsToDom();

  const clipsList = document.getElementById('smart-clips-list');
  const storyList = document.getElementById('storyboard-list');
  const narrativeBox = document.getElementById('narrative-text') as HTMLTextAreaElement | null;
  const checklist = document.getElementById('export-checklist');
  const qualityLabel = document.getElementById('quality-summary-label');

  const refreshChecklist = (): void => {
    if (!checklist) return;
    renderChecklist(checklist, buildExportChecklist({
      locale: host.locale(),
      hasPoints: host.currentPoints().length >= 2,
      mapConsent: host.mapConsent(),
      encodingSupported: host.encodingSupported(),
      formatId: host.formatId(),
    }));
  };

  const refreshStoryboard = (): void => {
    if (!storyList) return;
    const items = loadStoryboard();
    storyList.replaceChildren(...items.map((item) => {
      const li = document.createElement('li');
      const apply = document.createElement('button');
      apply.type = 'button';
      apply.className = 'ghost';
      apply.textContent = item.title;
      apply.addEventListener('click', () => {
        host.applyClipRange(item.startDate, item.endDate, item.targetSeconds);
        host.setPreviewProgress(item.startProgress);
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'ghost';
      remove.textContent = '×';
      remove.setAttribute('aria-label', 'remove');
      remove.addEventListener('click', () => {
        saveStoryboard(loadStoryboard().filter((row) => row.id !== item.id));
        refreshStoryboard();
      });
      li.append(apply, remove);
      return li;
    }));
  };

  const refreshClips = (): void => {
    if (!clipsList) return;
    const points = host.currentPoints();
    const cum = host.cumulativeFor(points);
    const clips = suggestSmartClips(points, cum);
    clipsList.replaceChildren(...clips.map((clip) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ghost';
      btn.textContent = `${clip.label} · ${clip.startDate}→${clip.endDate} · ${Math.round(clip.scoreKm)}km`;
      btn.addEventListener('click', () => {
        host.applyClipRange(clip.startDate, clip.endDate, clip.targetSeconds);
        host.setPreviewProgress(clip.startProgress);
      });
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'ghost';
      add.textContent = '+';
      add.title = 'storyboard';
      add.addEventListener('click', () => {
        const next = [...loadStoryboard(), clipToStoryboard(clip, host.getTitle())];
        saveStoryboard(next);
        refreshStoryboard();
      });
      li.append(btn, add);
      return li;
    }));
  };

  const refreshNarrative = (): void => {
    if (!narrativeBox) return;
    const points = host.currentPoints();
    const cum = host.cumulativeFor(points);
    const mode = host.chapterMode() === 'off' ? 'day' : host.chapterMode();
    const locale = uiLocale(host.locale());
    const base = mode === 'city'
      ? buildCityChapters(points, cum, locale)
      : buildDayChapters(points, cum, locale);
    if (chapterOrder.length === 0 || chapterOrder.length !== base.length) chapterOrder = base;
    narrativeBox.value = narrativeFromPoints(
      host.getTitle(),
      host.getPeriodLabel(),
      chapterOrder,
      points,
      cum,
      host.locale() === 'en' || host.locale() === 'ja' || host.locale() === 'ko' ? host.locale() : 'zh',
    );
  };

  document.getElementById('refresh-clips-button')?.addEventListener('click', () => {
    refreshClips();
    refreshNarrative();
    refreshChecklist();
  });
  document.getElementById('copy-narrative-button')?.addEventListener('click', async () => {
    if (!narrativeBox?.value) return;
    await navigator.clipboard.writeText(narrativeBox.value);
    host.announce(t(host.locale(), 'scriptCopied'));
  });
  document.getElementById('speak-narrative-button')?.addEventListener('click', () => {
    if (narrativeBox?.value) speakNarrative(narrativeBox.value, host.locale());
  });
  document.getElementById('stop-narrative-button')?.addEventListener('click', () => stopNarrativeSpeech());

  document.getElementById('prefetch-tiles-button')?.addEventListener('click', async () => {
    const journey = host.prepared();
    if (!journey) {
      host.announce(t(host.locale(), 'previewTilesFirst'));
      return;
    }
    const style = host.readMapStyle();
    const keys = [...journey.tiles.keys()].map((key) => `${style}:${key}`);
    await packTilesFromKeys(keys);
    host.announce(`${t(host.locale(), 'tilesCached')} · ${keys.length}`);
  });

  document.getElementById('local-share-button')?.addEventListener('click', async () => {
    const file = host.getResultFile();
    if (!file) return;
    const id = await saveLocalSharePreview(file, {
      title: host.getTitle(),
      period: host.getPeriodLabel(),
    });
    const url = sharePreviewUrl(id);
    await navigator.clipboard.writeText(url);
    host.announce(t(host.locale(), 'localShareCopied'));
  });

  refreshClips();
  refreshStoryboard();
  refreshNarrative();
  refreshChecklist();
  if (qualityLabel) qualityLabel.textContent = summarizeQuality(host.locale());

  host.updateSelection();
  const observerIds = ['map-consent', 'format-select', 'chapter-select'];
  observerIds.forEach((id) => {
    document.getElementById(id)?.addEventListener('change', () => {
      refreshChecklist();
      refreshNarrative();
      refreshClips();
    });
  });

  // Expose refresh for main after load
  (window as unknown as { __tvRefreshV15?: () => void }).__tvRefreshV15 = () => {
    refreshClips();
    refreshStoryboard();
    refreshNarrative();
    refreshChecklist();
    if (qualityLabel) qualityLabel.textContent = summarizeQuality(host.locale());
  };
}

export function wireChapterDrag(
  toc: HTMLElement,
  chapters: Chapter[],
  onJump: (progress: number) => void,
  onReorder: (next: Chapter[]) => void,
): void {
  chapterOrder = [...chapters];
  toc.replaceChildren(...chapterOrder.map((chapter, index) => {
    const item = document.createElement('li');
    item.draggable = true;
    item.dataset.index = String(index);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ghost';
    button.textContent = `⋮⋮ ${chapter.label}`;
    button.addEventListener('click', () => onJump(chapter.startProgress));
    item.append(button);
    item.addEventListener('dragstart', (event) => {
      event.dataTransfer?.setData('text/plain', String(index));
    });
    item.addEventListener('dragover', (event) => event.preventDefault());
    item.addEventListener('drop', (event) => {
      event.preventDefault();
      const from = Number(event.dataTransfer?.getData('text/plain'));
      const to = Number(item.dataset.index);
      if (Number.isNaN(from) || Number.isNaN(to) || from === to) return;
      const next = [...chapterOrder];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      chapterOrder = next;
      onReorder(next);
      wireChapterDrag(toc, next, onJump, onReorder);
    });
    return item;
  }));
}

export { saveSuccessSettings };
