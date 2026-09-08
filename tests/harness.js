// Renders a fragment of the onboarding skeleton against the REAL compiled
// stylesheet and reports measured geometry, so a design claim can be checked
// numerically instead of by eye. The framework is not booted: Box.X/Box.Y are
// shimmed as flex containers, which is all their layout contributes.
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
  'input-row', 'option-row', 'tool-chips-wrap', 'summary-badges',
];
const sel = (names) => names.map((n) => `.onboarding-app__${n}`).join(',');

function css() {
  return execFileSync('npx', ['sass', '--no-source-map',
    '--load-path=app/skin', 'app/skin/index.scss'], { cwd: ROOT }).toString();
}

function page(bodyHtml) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0;padding:0}
:root{--font-main:system-ui,sans-serif;--font-bold:system-ui,sans-serif;
--font-medium:system-ui,sans-serif;--spacer-3:8px;--spacer-5:16px;--spacer-7:24px}
${sel(FLEX_COL)}{display:flex;flex-direction:column}
${sel(FLEX_ROW)}{display:flex;flex-direction:row}
${css()}
</style></head><body>${bodyHtml}</body></html>`;
}

// selectors: { name: 'css selector' }. Returns box geometry + a few computed
// properties per entry, plus whether __main overflows (i.e. the step scrolls).
async function measure(html, selectors, viewport = { width: 1440, height: 1024 }) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ob-')), 'p.html');
  fs.writeFileSync(file, html);
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const p = await browser.newPage();
    await p.setViewport({ ...viewport, deviceScaleFactor: 1 });
    await p.goto('file://' + file, { waitUntil: 'load' });
    return await p.evaluate((sels) => {
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
  } finally {
    await browser.close();
  }
}

module.exports = { page, measure };
