import fs from 'node:fs';

const path = new URL('../index.html', import.meta.url);
let html = fs.readFileSync(path, 'utf8');

function insertBefore(marker, addition, label) {
  if (html.includes(addition.slice(0, 36))) {
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

replaceOnce(
  '<option value="voyager">Voyager</option>\n              </select>',
  `<option value="voyager">Voyager</option>
                <option value="satellite">衛星</option>
                <option value="terrain">地形</option>
                <option value="night">夜景</option>
              </select>`,
  'map styles',
);

insertBefore(
  '<div class="preset-actions"',
  `<ol id="onboarding-steps" class="onboarding-steps" aria-label="新手步驟">
            <li id="step-export">1 匯出</li>
            <li id="step-upload">2 上傳</li>
            <li id="step-preview">3 預覽</li>
            <li id="step-create">4 產出</li>
          </ol>
          <button id="onboarding-next" class="ghost" type="button">下一步引導</button>`,
  'onboarding',
);

insertBefore(
  '<div class="v15-tools">',
  `<div class="v16-tools">
          <div class="actions">
            <button id="highlight-30-button" class="secondary" type="button">精華 30 秒</button>
            <button id="health-check-button" class="ghost" type="button">健康檢查</button>
            <button id="refresh-calendar-button" class="ghost" type="button">日曆熱點</button>
          </div>
          <ul id="health-check-panel" class="faq-list"></ul>
          <div id="calendar-day-chips" class="stats-heatmap"></div>
          <label>
            <span>裁切雜訊強度（km/日）</span>
            <input id="trim-intensity" type="range" min="1" max="15" value="3" />
          </label>
          <label>
            <span>片頭定格（秒）</span>
            <input id="intro-hold" type="number" min="0" max="8" step="0.5" value="1.5" />
          </label>
          <label>
            <span>日光色調</span>
            <select id="color-grade-select">
              <option value="off" selected>關閉</option>
              <option value="auto">自動</option>
              <option value="warm">暖色</option>
              <option value="cool">冷色</option>
              <option value="night">夜景</option>
            </select>
          </label>
          <label class="checkbox-row"><input id="reverse-route-toggle" type="checkbox" /><span>倒轉路線預覽／產出</span></label>
          <label class="checkbox-row"><input id="narration-chime-toggle" type="checkbox" /><span>燒錄章節提示音（旁白節奏）</span></label>
          <label class="checkbox-row"><input id="stay-points-toggle" type="checkbox" checked /><span>顯示停留點</span></label>
          <label class="checkbox-row"><input id="split-compare-toggle" type="checkbox" /><span>雙路線分屏對照</span></label>
          <label class="checkbox-row"><input id="dual-export-toggle" type="checkbox" /><span>同時產出有聲＋無聲</span></label>
          <div class="actions">
            <button id="a11y-contrast-button" class="ghost" type="button">高對比</button>
            <button id="a11y-font-button" class="ghost" type="button">字級</button>
            <button id="a11y-motion-button" class="ghost" type="button">減少動態</button>
          </div>
          <label>
            <span>人生章節標籤</span>
            <input id="life-tag-input" type="text" placeholder="例如：求學／旅行" />
          </label>
          <button id="add-life-tag-button" class="ghost" type="button">加入標籤</button>
          <ul id="life-tags-list" class="faq-list"></ul>
          <p id="wrapped-panel" class="status muted"></p>
          <button id="wrapped-refresh-button" class="ghost" type="button">年度回顧摘要</button>
        </div>`,
  'v16 tools',
);

insertBefore(
  '<button id="local-share-button"',
  `<button id="download-report-button" class="secondary" type="button">下載旅程報告</button>
            <button id="pack-export-button" class="secondary" type="button">打包腳本＋SRT</button>
            <button id="storyboard-zip-button" class="secondary" type="button">故事板 ZIP</button>
            <button id="draw-share-qr-button" class="secondary" type="button">分享卡 QR</button>
            <canvas id="share-qr-canvas" class="hidden" width="160" height="160"></canvas>
            <button id="retry-720-button" class="ghost" type="button">失敗改 720p</button>
            <button id="retry-480-button" class="ghost" type="button">失敗改 480p</button>`,
  'export extras',
);

replaceOnce(
  '<a href="./quality.html" data-i18n="qualityLink">品質儀表板</a>\n              <a href="./terms.html"',
  `<a href="./quality.html" data-i18n="qualityLink">品質儀表板</a>
              <a href="./wrapped.html">年度回顧</a>
              <a href="./terms.html"`,
  'hero wrapped',
);

fs.writeFileSync(path, html);
console.log('done');
