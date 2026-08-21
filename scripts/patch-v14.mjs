import fs from 'node:fs';

const path = new URL('../index.html', import.meta.url);
let html = fs.readFileSync(path, 'utf8');

function insertOnce(marker, addition, label) {
  if (html.includes(addition.slice(0, 40))) {
    console.log('skip', label);
    return;
  }
  if (!html.includes(marker)) {
    console.warn('missing marker', label);
    return;
  }
  html = html.replace(marker, `${addition}\n${marker}`);
  console.log('ok', label);
}

function replaceOnce(from, to, label) {
  if (!html.includes(from)) {
    console.warn('missing', label);
    return;
  }
  html = html.replace(from, to);
  console.log('ok', label);
}

// Hero links: stats + legal
replaceOnce(
  '<a href="./domain.html" data-i18n="domainLink">自訂網域</a>\n            </p>',
  `<a href="./domain.html" data-i18n="domainLink">自訂網域</a>
              <a href="./stats.html" data-i18n="statsLink">旅程統計</a>
              <a href="./terms.html" data-i18n="termsLink">使用條款</a>
            </p>`,
  'hero extra links',
);

// Presets after smart actions
replaceOnce(
  '<div class="smart-actions" role="group" aria-label="智慧選取">',
  `<div class="preset-actions" role="group" aria-label="快速預設">
            <button id="preset-reels" class="ghost" type="button" data-i18n="presetReels">短影音預設</button>
            <button id="preset-island" class="ghost" type="button" data-i18n="presetIsland">環島預設</button>
            <button id="preset-business" class="ghost" type="button" data-i18n="presetBusiness">出差預設</button>
          </div>
          <div class="smart-actions" role="group" aria-label="智慧選取">`,
  'presets',
);

// Burn captions + auto fallback near activity pace
replaceOnce(
  '<label class="checkbox-row" for="activity-pace-toggle">',
  `<label class="checkbox-row" for="burn-captions-toggle">
            <input id="burn-captions-toggle" type="checkbox" checked />
            <span data-i18n="burnCaptions">燒錄字幕進影片</span>
          </label>
          <label class="checkbox-row" for="auto-fallback-toggle">
            <input id="auto-fallback-toggle" type="checkbox" checked />
            <span data-i18n="autoFallback">失敗時自動降解析度</span>
          </label>
          <label class="checkbox-row" for="activity-pace-toggle">`,
  'burn+fallback',
);

// Compare opacity slider
replaceOnce(
  '<label class="checkbox-row" for="compare-toggle">\n              <input id="compare-toggle" type="checkbox" />\n              <span data-i18n="compareToggle">與該年對照</span>\n            </label>\n          </div>',
  `<label class="checkbox-row" for="compare-toggle">
              <input id="compare-toggle" type="checkbox" />
              <span data-i18n="compareToggle">與該年對照</span>
            </label>
          </div>
          <label>
            <span data-i18n="compareOpacity">對照透明度</span>
            <input id="compare-opacity" type="range" min="5" max="90" value="35" />
          </label>`,
  'compare opacity',
);

// Preview scrubber + chapters + sticky bar pieces
replaceOnce(
  '<canvas id="journey-canvas" width="480" height="480"></canvas>',
  `<label class="scrubber-row">
            <span data-i18n="scrubberLabel">預覽進度</span>
            <input id="preview-scrubber" type="range" min="0" max="1000" value="0" />
          </label>
          <ul id="chapter-toc" class="chapter-toc" aria-label="章節目錄"></ul>
          <canvas id="journey-canvas" width="480" height="480"></canvas>`,
  'scrubber toc',
);

replaceOnce(
  '<button id="download-heatmap-button" class="secondary" type="button" data-i18n="heatmapPoster">下載熱力圖海報</button>',
  `<button id="download-heatmap-button" class="secondary" type="button" data-i18n="heatmapPoster">下載熱力圖海報</button>
            <button id="download-story-button" class="secondary" type="button" data-i18n="storyPoster">下載故事海報</button>
            <button id="export-tiles-button" class="secondary" type="button" data-i18n="exportTiles">匯出離線圖磚</button>
            <label class="ghost file-ghost">
              <span data-i18n="importTiles">匯入離線圖磚</span>
              <input id="import-tiles-input" type="file" accept="application/json,.json" />
            </label>`,
  'story+tiles',
);

// Sticky mobile action bar
if (!html.includes('id="mobile-action-bar"')) {
  replaceOnce(
    '<div id="sticky-progress"',
    `<div id="mobile-action-bar" class="mobile-action-bar" role="toolbar" aria-label="快速操作">
      <button id="mobile-preview-button" class="secondary" type="button" data-i18n="preview">預覽</button>
      <button id="mobile-create-button" type="button" data-i18n="create">產出 MP4</button>
    </div>
    <div id="sticky-progress"`,
    'mobile bar',
  );
}

// Footer links + anon stats
replaceOnce(
  '<a href="./domain.html" data-i18n="domainLink">自訂網域</a>\n          ·\n          <a id="report-issue"',
  `<a href="./domain.html" data-i18n="domainLink">自訂網域</a>
          ·
          <a href="./stats.html" data-i18n="statsLink">旅程統計</a>
          ·
          <a href="./terms.html" data-i18n="termsLink">使用條款</a>
          ·
          <a href="./legal-privacy.html" data-i18n="legalPrivacyLink">隱私政策</a>
          ·
          <a id="report-issue"`,
  'footer legal',
);

replaceOnce(
  '<p id="perf-label" class="muted"></p>',
  `<p id="perf-label" class="muted"></p>
        <p id="anon-stats-label" class="muted"></p>`,
  'anon label',
);

// Tutorial recording-style stage
replaceOnce(
  '<div class="tutorial-stage" aria-live="polite">',
  `<div class="tutorial-phone" aria-hidden="true">
          <div class="tutorial-phone-notch"></div>
          <div class="tutorial-phone-screen">
            <div class="tutorial-rec-dot"></div>
            <span class="tutorial-rec-label">REC</span>
            <div class="tutorial-phone-path"></div>
          </div>
        </div>
        <div class="tutorial-stage" aria-live="polite">`,
  'tutorial phone',
);

fs.writeFileSync(path, html);
console.log('patch complete');
