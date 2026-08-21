import { APP_VERSION } from './version';
import {
  exportSettingsJson,
  getSeenVersion,
  importSettingsJson,
  loadLocalSettings,
  loadRecent,
  markVersionSeen,
  persistSettingsLocally,
  collectSettingsFromDom,
  applySettingsToDom,
} from './settingsStore';
import { formatPerfSummary } from './perf';
import { clearTileLog, summarizeTileLog } from './privacyReport';
import { applyThemeMode, cycleThemeMode, watchSystemTheme, loadThemeMode } from './themeMode';
import { formatAnonStats } from './anonStats';

export interface ExtrasHost {
  locale: () => string;
  preview: () => void;
  create: () => void;
  updateSelection: () => void;
  anotherRound: () => void;
}

function themeToggleLabel(locale: string): string {
  const mode = loadThemeMode();
  if (locale === 'en') {
    return mode === 'system' ? 'Theme: System' : mode === 'dark' ? 'Theme: Dark' : 'Theme: Light';
  }
  if (mode === 'system') return locale === 'ja' ? 'テーマ: システム' : locale === 'ko' ? '테마: 시스템' : '主題：跟隨系統';
  if (mode === 'dark') return locale === 'ja' ? 'テーマ: ダーク' : locale === 'ko' ? '테마: 다크' : '主題：深色';
  return locale === 'ja' ? 'テーマ: ライト' : locale === 'ko' ? '테마: 라이트' : '主題：淺色';
}

export function wireExtras(host: ExtrasHost): void {
  const themeToggle = document.getElementById('theme-mode-toggle') as HTMLButtonElement | null;
  const settingsExport = document.getElementById('settings-export-button') as HTMLButtonElement | null;
  const settingsImport = document.getElementById('settings-import-input') as HTMLInputElement | null;
  const anotherRound = document.getElementById('another-round-button') as HTMLButtonElement | null;
  const updateDot = document.getElementById('update-dot');
  const updateBanner = document.getElementById('sw-update-banner');
  const updateReload = document.getElementById('sw-reload-button');
  const recentList = document.getElementById('recent-list');
  const perfLabel = document.getElementById('perf-label');
  const anonLabel = document.getElementById('anon-stats-label');
  const privacySummary = document.getElementById('privacy-summary');
  const privacyClear = document.getElementById('privacy-clear-button');
  const tutorialOpen = document.getElementById('tutorial-open-button');
  const tutorialDialog = document.getElementById('tutorial-dialog') as HTMLDialogElement | null;
  const stickyProgress = document.getElementById('sticky-progress');

  applyThemeMode();
  watchSystemTheme();
  if (themeToggle) {
    themeToggle.textContent = themeToggleLabel(host.locale());
    themeToggle.addEventListener('click', () => {
      cycleThemeMode();
      themeToggle.textContent = themeToggleLabel(host.locale());
    });
  }

  const local = loadLocalSettings();
  if (local) applySettingsToDom(local);

  settingsExport?.addEventListener('click', () => {
    const blob = new Blob([exportSettingsJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'timeline-visualizer-settings.json';
    anchor.click();
    URL.revokeObjectURL(url);
    persistSettingsLocally(collectSettingsFromDom());
  });

  settingsImport?.addEventListener('change', async () => {
    const file = settingsImport.files?.[0];
    if (!file) return;
    try {
      importSettingsJson(await file.text());
      host.updateSelection();
    } catch {
      // ignore bad files
    } finally {
      settingsImport.value = '';
    }
  });

  anotherRound?.addEventListener('click', () => host.anotherRound());

  if (updateDot && getSeenVersion() !== APP_VERSION) {
    updateDot.classList.remove('hidden');
  }
  document.querySelectorAll('a[href="./updates.html"]').forEach((link) => {
    link.addEventListener('click', () => {
      markVersionSeen(APP_VERSION);
      updateDot?.classList.add('hidden');
    });
  });

  if (recentList) {
    recentList.replaceChildren(...loadRecent().map((entry) => {
      const item = document.createElement('li');
      item.textContent = `${entry.name} · ${entry.period}`;
      return item;
    }));
  }

  if (perfLabel) perfLabel.textContent = formatPerfSummary(host.locale());
  if (anonLabel) anonLabel.textContent = formatAnonStats(host.locale());
  if (privacySummary) privacySummary.textContent = summarizeTileLog(host.locale());
  privacyClear?.addEventListener('click', () => {
    clearTileLog();
    if (privacySummary) privacySummary.textContent = summarizeTileLog(host.locale());
  });

  tutorialOpen?.addEventListener('click', () => tutorialDialog?.showModal());
  tutorialDialog?.querySelector('[data-close]')?.addEventListener('click', () => tutorialDialog.close());

  document.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
      return;
    }
    if (event.code === 'Space') {
      event.preventDefault();
      host.preview();
    } else if (event.code === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      host.create();
    }
  });

  const observer = new MutationObserver(() => {
    const exporting = document.body.classList.contains('is-exporting');
    stickyProgress?.classList.toggle('hidden', !exporting);
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`).then((registration) => {
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            updateBanner?.classList.remove('hidden');
          }
        });
      });
    });
    updateReload?.addEventListener('click', () => {
      void navigator.serviceWorker.getRegistration().then((registration) => {
        registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      });
    });
  }

  window.addEventListener('beforeunload', () => {
    persistSettingsLocally(collectSettingsFromDom());
  });
}

export function refreshExtrasLabels(locale: string): void {
  const perfLabel = document.getElementById('perf-label');
  const anonLabel = document.getElementById('anon-stats-label');
  const privacySummary = document.getElementById('privacy-summary');
  const recentList = document.getElementById('recent-list');
  const themeToggle = document.getElementById('theme-mode-toggle');
  if (perfLabel) perfLabel.textContent = formatPerfSummary(locale);
  if (anonLabel) anonLabel.textContent = formatAnonStats(locale);
  if (privacySummary) privacySummary.textContent = summarizeTileLog(locale);
  if (themeToggle) themeToggle.textContent = themeToggleLabel(locale);
  if (recentList) {
    recentList.replaceChildren(...loadRecent().map((entry) => {
      const item = document.createElement('li');
      item.textContent = `${entry.name} · ${entry.period}`;
      return item;
    }));
  }
}
