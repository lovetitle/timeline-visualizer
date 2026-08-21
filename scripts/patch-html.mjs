import fs from 'node:fs';

const path = new URL('../index.html', import.meta.url);
let html = fs.readFileSync(path, 'utf8');

function once(oldText, newText, label) {
  if (!html.includes(oldText)) {
    console.warn('missing', label);
    return;
  }
  html = html.replace(oldText, newText);
  console.log('ok', label);
}

once(
  '<a href="./privacy.html" data-i18n="privacyLink">隱私報告</a>\n            </p>',
  `<a href="./privacy.html" data-i18n="privacyLink">隱私報告</a>
              <a href="./domain.html" data-i18n="domainLink">自訂網域</a>
            </p>`,
  'hero domain link',
);

once(
  '<canvas id="hero-demo-canvas" width="360" height="360" aria-label="範例旅程動畫"></canvas>',
  `<div class="hero-media">
          <canvas id="hero-demo-canvas" width="360" height="360" aria-label="範例旅程動畫"></canvas>
          <video id="sample-result-video" class="hidden" controls playsinline></video>
          <button id="play-sample-video" class="ghost" type="button" data-i18n="playSampleVideo">播放範例影片</button>
        </div>`,
  'sample video ui',
);

once(
  '<button id="cancel-button" class="secondary cancel-button hidden" type="button" data-i18n="cancel">取消產出影片</button>',
  `<button id="pause-button" class="secondary cancel-button hidden" type="button" data-i18n="pauseEncode">暫停產出</button>
          <button id="cancel-button" class="secondary cancel-button hidden" type="button" data-i18n="cancel">取消產出影片</button>`,
  'pause button',
);

once(
  `<a href="./privacy.html" data-i18n="privacyLink">隱私報告</a>
          ·
          <a id="report-issue"`,
  `<a href="./privacy.html" data-i18n="privacyLink">隱私報告</a>
          ·
          <a href="./domain.html" data-i18n="domainLink">自訂網域</a>
          ·
          <a id="report-issue"`,
  'footer domain',
);

if (!html.includes('id="brand-panel"')) {
  once(
    '<footer>',
    `<details id="brand-panel" class="panel brand-panel">
        <summary data-i18n="brandSettings">品牌設定（本機）</summary>
        <label><span data-i18n="brandSiteName">站名</span><input id="brand-site-name" type="text" maxlength="60" /></label>
        <label><span data-i18n="brandTagline">自訂主標（選填，覆蓋預設標題）</span><input id="brand-tagline" type="text" maxlength="80" /></label>
        <button id="brand-save" class="secondary" type="button" data-i18n="brandSave">套用品牌</button>
      </details>
      <footer>`,
    'brand panel',
  );
}

// Replace entire empty banner + export guide through end of section before settings-card
const start = html.indexOf('<div id="empty-timeline-banner"');
const end = html.indexOf('<section id="settings-card"');
if (start === -1 || end === -1) {
  console.error('cannot find guide block');
  process.exit(1);
}

const guideBlock = `<div id="empty-timeline-banner" class="empty-timeline-banner hidden" role="status">
            <strong id="empty-title">時間軸是空的？先還原再匯出</strong>
            <ol id="empty-steps" class="restore-steps"></ol>
          </div>

          <div class="export-guide">
            <h3 data-i18n="exportGuideTitle">還沒有檔案？從手機匯出</h3>
            <p id="guide-intro-text" class="guide-intro"></p>
            <div class="platform-switch">
              <input type="radio" name="export-platform" id="guide-android" checked />
              <input type="radio" name="export-platform" id="guide-iphone" />
              <div class="tab-bar" role="tablist" aria-label="選擇手機系統">
                <label for="guide-android">Android</label>
                <label for="guide-iphone">iPhone</label>
              </div>
              <ol class="guide-android steps">
                <li>
                  <span class="step-title"><svg class="step-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="7" y="2.5" width="10" height="19" rx="2.2" /><circle cx="12" cy="18.2" r="0.9" fill="currentColor" stroke="none" /></svg><span id="android-open-title"></span></span>
                  <span id="android-open-body" class="step-body"></span>
                </li>
                <li>
                  <span class="step-title"><svg class="step-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.2" /><path d="M5 19.5c1.6-3.2 4-4.8 7-4.8s5.4 1.6 7 4.8" /></svg><span id="android-settings-title"></span></span>
                  <span id="android-settings-path" class="step-path"></span>
                  <span id="android-settings-body" class="step-body"></span>
                </li>
                <li>
                  <span class="step-title"><svg class="step-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6" /></svg><span id="android-export-title"></span></span>
                  <span id="android-export-path" class="step-path"></span>
                  <span id="android-export-body" class="step-body"></span>
                </li>
                <li>
                  <span class="step-title"><svg class="step-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4v10" /><path d="M8.5 10.5 12 14l3.5-3.5" /><path d="M5 18h14" /></svg><span id="android-transfer-title"></span></span>
                  <span id="android-transfer-body" class="step-body"></span>
                </li>
              </ol>
              <ol class="guide-iphone steps">
                <li>
                  <span class="step-title"><svg class="step-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="7" y="2.5" width="10" height="19" rx="2.2" /><circle cx="12" cy="18.2" r="0.9" fill="currentColor" stroke="none" /></svg><span id="iphone-open-title"></span></span>
                  <span id="iphone-open-body" class="step-body"></span>
                </li>
                <li>
                  <span class="step-title"><svg class="step-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.2" /><path d="M5 19.5c1.6-3.2 4-4.8 7-4.8s5.4 1.6 7 4.8" /></svg><span id="iphone-settings-title"></span></span>
                  <span id="iphone-settings-path" class="step-path"></span>
                  <span id="iphone-settings-body" class="step-body"></span>
                </li>
                <li>
                  <span class="step-title"><svg class="step-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6" /></svg><span id="iphone-export-title"></span></span>
                  <span id="iphone-export-path" class="step-path"></span>
                  <span id="iphone-export-body" class="step-body"></span>
                </li>
                <li>
                  <span class="step-title"><svg class="step-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4v10" /><path d="M8.5 10.5 12 14l3.5-3.5" /><path d="M5 18h14" /></svg><span id="iphone-transfer-title"></span></span>
                  <span id="iphone-transfer-body" class="step-body"></span>
                </li>
              </ol>
            </div>
            <details class="help-panel" open>
              <summary id="guide-help-summary"></summary>
              <ul id="guide-help-list" class="faq-list"></ul>
            </details>
            <div class="tutorial-frames" aria-label="export steps">
              <figure class="tutorial-frame">
                <svg viewBox="0 0 120 220" width="100" height="184" role="img"><rect x="4" y="4" width="112" height="212" rx="18" fill="#1c2a24" /><rect x="12" y="18" width="96" height="172" rx="6" fill="#e8f0ea" /><path d="M30 130 Q50 70 70 100 T100 85" fill="none" stroke="#c45c26" stroke-width="3" stroke-linecap="round" /><circle cx="70" cy="100" r="5" fill="#c45c26" /></svg>
                <figcaption id="frame-cap-1"></figcaption>
              </figure>
              <figure class="tutorial-frame">
                <svg viewBox="0 0 120 220" width="100" height="184" role="img"><rect x="4" y="4" width="112" height="212" rx="18" fill="#1c2a24" /><rect x="12" y="18" width="96" height="172" rx="6" fill="#fff8f2" /><rect x="22" y="70" width="76" height="14" rx="4" fill="#f3e2d4" /><rect x="22" y="114" width="76" height="14" rx="4" fill="#c45c26" opacity="0.85" /></svg>
                <figcaption id="frame-cap-2"></figcaption>
              </figure>
              <figure class="tutorial-frame">
                <svg viewBox="0 0 120 220" width="100" height="184" role="img"><rect x="4" y="4" width="112" height="212" rx="18" fill="#1c2a24" /><rect x="12" y="18" width="96" height="172" rx="6" fill="#fff8f2" /><rect x="28" y="48" width="64" height="72" rx="8" fill="#efe8de" stroke="#c45c26" stroke-width="1.5" /><path d="M60 70 v28 M48 88 l12 12 12-12" fill="none" stroke="#c45c26" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                <figcaption id="frame-cap-3"></figcaption>
              </figure>
            </div>
          </div>
        </section>

        `;

html = `${html.slice(0, start)}${guideBlock}${html.slice(end)}`;

// Wrap settings into mobile accordion sections if not present
if (!html.includes('settings-accordion')) {
  html = html.replace(
    '<section id="settings-card" class="panel hidden" aria-labelledby="settings-heading">\n          <h2 id="settings-heading" data-i18n="settingsHeading">建立旅程</h2>',
    `<section id="settings-card" class="panel hidden" aria-labelledby="settings-heading">
          <h2 id="settings-heading" data-i18n="settingsHeading">建立旅程</h2>
          <div class="settings-accordion">
          <details class="settings-section" open>
            <summary data-i18n="sectionPeriod">期間與模板</summary>
            <div class="settings-section-body">`,
  );

  // Close first section before video title / after suggest duration, open style section
  html = html.replace(
    '<button id="suggest-duration-button" class="ghost" type="button" data-i18n="suggestDuration">依距離建議片長</button>\n\n          <label>\n            <span data-i18n="videoTitle">影片標題</span>',
    `<button id="suggest-duration-button" class="ghost" type="button" data-i18n="suggestDuration">依距離建議片長</button>
            </div>
          </details>
          <details class="settings-section" open>
            <summary data-i18n="sectionStyle">外觀與節奏</summary>
            <div class="settings-section-body">
          <label>
            <span data-i18n="videoTitle">影片標題</span>`,
  );

  html = html.replace(
    '<div class="settings-io">',
    `</div>
          </details>
          <details class="settings-section">
            <summary data-i18n="sectionAdvanced">進階與批次</summary>
            <div class="settings-section-body">
          <div class="settings-io">`,
  );

  html = html.replace(
    '<div class="privacy-notice">',
    `</div>
          </details>
          <details class="settings-section" open>
            <summary data-i18n="sectionExport">產出與匯出</summary>
            <div class="settings-section-body">
          <div class="privacy-notice">`,
  );

  html = html.replace(
    '<button id="export-geojson-button" class="secondary" type="button" data-i18n="exportGeoJson">匯出 GeoJSON</button>\n          </div>\n        </section>',
    `<button id="export-geojson-button" class="secondary" type="button" data-i18n="exportGeoJson">匯出 GeoJSON</button>
          </div>
            </div>
          </details>
          </div>
        </section>`,
  );
}

fs.writeFileSync(path, html);
console.log('done');
