import fs from 'node:fs';

const path = new URL('../index.html', import.meta.url);
let html = fs.readFileSync(path, 'utf8');

function insertBefore(marker, addition, label) {
  if (html.includes(addition.slice(0, 48))) {
    console.log('skip', label);
    return;
  }
  if (!html.includes(marker)) {
    console.warn('missing', label);
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

insertBefore(
  '<ul id="chapter-toc"',
  `<div class="v15-tools">
          <div class="section-heading"><h3 data-i18n="smartClips">智慧剪輯建議</h3>
            <button id="refresh-clips-button" class="ghost" type="button" data-i18n="refreshClips">重新分析</button>
          </div>
          <ul id="smart-clips-list" class="clip-list" aria-label="智慧剪輯"></ul>
          <h3 data-i18n="storyboard">故事板佇列</h3>
          <ul id="storyboard-list" class="clip-list" aria-label="故事板"></ul>
          <label>
            <span data-i18n="narrativeScript">敘事腳本</span>
            <textarea id="narrative-text" rows="5" readonly></textarea>
          </label>
          <div class="actions">
            <button id="copy-narrative-button" class="secondary" type="button" data-i18n="copyNarrative">複製腳本</button>
            <button id="speak-narrative-button" class="secondary" type="button" data-i18n="speakNarrative">朗讀</button>
            <button id="stop-narrative-button" class="ghost" type="button" data-i18n="stopNarrative">停止朗讀</button>
          </div>
        </div>`,
  'v15 tools',
);

insertBefore(
  '<div class="privacy-notice">',
  `<ul id="export-checklist" class="export-checklist" aria-label="產出檢查清單"></ul>
          <label class="checkbox-row" for="show-attribution-toggle">
            <input id="show-attribution-toggle" type="checkbox" checked />
            <span data-i18n="showAttribution">片尾顯示地圖版權</span>
          </label>
          <button id="prefetch-tiles-button" class="ghost" type="button" data-i18n="prefetchTiles">預先快取目前圖磚</button>`,
  'checklist attribution',
);

replaceOnce(
  '<button id="another-round-button" class="secondary" type="button" data-i18n="anotherRound">再開一輪（保留設定）</button>',
  `<button id="another-round-button" class="secondary" type="button" data-i18n="anotherRound">再開一輪（保留設定）</button>
            <button id="local-share-button" class="secondary" type="button" data-i18n="localShare">本機分享連結</button>`,
  'local share',
);

replaceOnce(
  '<a href="./stats.html" data-i18n="statsLink">旅程統計</a>\n              <a href="./terms.html"',
  `<a href="./stats.html" data-i18n="statsLink">旅程統計</a>
              <a href="./quality.html" data-i18n="qualityLink">品質儀表板</a>
              <a href="./terms.html"`,
  'hero quality',
);

replaceOnce(
  '<a href="./stats.html" data-i18n="statsLink">旅程統計</a>\n          ·\n          <a href="./terms.html"',
  `<a href="./stats.html" data-i18n="statsLink">旅程統計</a>
          ·
          <a href="./quality.html" data-i18n="qualityLink">品質儀表板</a>
          ·
          <a href="./terms.html"`,
  'footer quality',
);

replaceOnce(
  '<p id="anon-stats-label" class="muted"></p>',
  `<p id="anon-stats-label" class="muted"></p>
        <p id="quality-summary-label" class="muted"></p>
        <p id="a11y-live" class="sr-only" aria-live="polite"></p>`,
  'a11y live',
);

fs.writeFileSync(path, html);
console.log('done');
