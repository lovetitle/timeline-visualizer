import fs from 'node:fs';

const path = new URL('../index.html', import.meta.url);
let html = fs.readFileSync(path, 'utf8');
if (html.includes('id="range-scrub-start"')) {
  console.log('already present');
  process.exit(0);
}
const needle = `<label class="checkbox-row">
              <input id="exact-date-toggle" type="checkbox" />
              <span data-i18n="exactDates">指定精確日期</span>
            </label>`;
const addition = `<label class="date-scrubbers">
            <span data-i18n="dateScrubber">日期區間滑桿</span>
            <input id="range-scrub-start" type="range" min="0" max="1000" value="0" aria-label="開始" />
            <input id="range-scrub-end" type="range" min="0" max="1000" value="1000" aria-label="結束" />
          </label>
          ${needle}`;
if (!html.includes(needle)) {
  console.error('marker missing');
  process.exit(1);
}
html = html.replace(needle, addition);
fs.writeFileSync(path, html);
console.log('ok');
