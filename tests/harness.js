// Renders onboarding markup against the REAL compiled stylesheet and reports
// measured geometry, so a design claim can be checked numerically instead of
// by eye. The framework is not booted: .drumee-widget[data-flow] gets the flex
// rules ui-core gives it (same (0,2,0) specificity, so a rule that has to beat
// it is tested against the real opponent), and the class shims below keep
// hand-written fragments without data-flow laying out too.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');

const FLEX_COL = [
  'ui', 'main', 'card', 'header', 'header-lead', 'header-copy', 'form-section',
  'question-block', 'challenge-list', 'goal-list', 'option-grid', 'other-region',
  'footer', 'done-section', 'done-head', 'org-section', 'input-group',
  'error-region',
];
const FLEX_ROW = [
  'header-top', 'progress-bar', 'tools-title', 'challenge-freetext', 'btn-row',
  'input-row', 'tool-chips-wrap', 'summary-badges',
];
const sel = (names) => names.map((n) => `.onboarding-app__${n}`).join(',');

// Compiled once per process: every test renders dozens of pages.
let _css = null;
function css() {
  if (_css == null) {
    _css = execFileSync('npx', ['sass', '--no-source-map',
      '--load-path=app/skin', 'app/skin/index.scss'], { cwd: ROOT }).toString();
  }
  return _css;
}

function page(bodyHtml) {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><style>
*{box-sizing:border-box}html,body{margin:0;padding:0}
:root{--font-main:system-ui,sans-serif;--font-bold:system-ui,sans-serif;
--font-medium:system-ui,sans-serif;--spacer-3:8px;--spacer-5:16px;--spacer-7:24px}
${sel(FLEX_COL)}{display:flex;flex-direction:column}
${sel(FLEX_ROW)}{display:flex;flex-direction:row}
.drumee-widget[data-flow=x]{display:flex;flex-direction:row}
.drumee-widget[data-flow=y]{display:flex;flex-direction:column}
.drumee-widget[data-flow=wrap]{display:flex;flex-direction:row}
${css()}
</style></head><body>${bodyHtml}</body></html>`;
}

async function withBrowser(fn) {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

async function show(browser, html, viewport) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ob-')), 'p.html');
  fs.writeFileSync(file, html);
  const p = await browser.newPage();
  await p.setViewport({ ...viewport, deviceScaleFactor: 1 });
  await p.goto('file://' + file, { waitUntil: 'load' });
  return p;
}

const box = (p, s) => p.evaluate((s) => {
  const e = document.querySelector(s);
  if (!e) return null;
  const b = e.getBoundingClientRect();
  return { x: b.x, y: b.y, w: b.width, h: b.height, bottom: b.bottom, right: b.right };
}, s);

const boxes = (p, s) => p.evaluate((s) => [...document.querySelectorAll(s)].map((e) => {
  const b = e.getBoundingClientRect();
  return { w: b.width, h: b.height, bottom: b.bottom, right: b.right };
}), s);

const fontSize = (p, s) => p.evaluate((s) => {
  const e = document.querySelector(s);
  return e ? parseFloat(getComputedStyle(e).fontSize) : null;
}, s);

const gridCols = (p, grid) => p.evaluate((g) => {
  const e = document.querySelector(`.onboarding-app__option-grid[data-grid="${g}"]`);
  if (!e) return 0;
  const t = getComputedStyle(e).gridTemplateColumns;
  return t === 'none' ? 0 : t.split(' ').length;
}, grid);

// Every way the page can be wider than the screen: a scroll container whose
// content is wider than it, or any element poking past the right edge.
const overflowX = (p) => p.evaluate(() => {
  const out = [];
  for (const s of ['html', '.onboarding-app__ui', '.onboarding-app__main']) {
    const e = document.querySelector(s);
    if (e && e.scrollWidth > e.clientWidth) out.push(`${s}: ${e.scrollWidth} > ${e.clientWidth}`);
  }
  for (const e of document.querySelectorAll('.onboarding-app__main *')) {
    const r = e.getBoundingClientRect();
    if (r.width && r.right > window.innerWidth + 0.5) {
      out.push(`${e.className || e.tagName}: right ${r.right.toFixed(1)} > ${window.innerWidth}`);
    }
  }
  return out;
});

// selectors: { name: 'css selector' }. Returns box geometry + a few computed
// properties per entry, plus whether __main overflows (i.e. the step scrolls).
async function measure(html, selectors, viewport = { width: 1440, height: 1024 }) {
  return withBrowser(async (browser) => {
    const p = await show(browser, html, viewport);
    return p.evaluate((sels) => {
      const out = {};
      for (const [k, s] of Object.entries(sels)) {
        const e = document.querySelector(s);
        if (!e) { out[k] = null; continue; }
        const b = e.getBoundingClientRect();
        const c = getComputedStyle(e);
        out[k] = {
          x: +b.x.toFixed(1), y: +b.y.toFixed(1),
          w: +b.width.toFixed(1), h: +b.height.toFixed(1),
          color: c.color, background: c.backgroundColor,
          radius: c.borderRadius, fontSize: c.fontSize, fontWeight: c.fontWeight,
        };
      }
      const m = document.querySelector('.onboarding-app__main');
      out._overflow = m ? m.scrollHeight - m.clientHeight : 0;
      return out;
    }, selectors);
  });
}

module.exports = { page, measure, withBrowser, show, box, boxes, fontSize, gridCols, overflowX };
