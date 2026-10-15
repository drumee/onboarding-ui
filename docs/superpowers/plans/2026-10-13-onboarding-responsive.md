# Onboarding Downsize + Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draw the onboarding wizard at 85% of its Figma size on desktop and make it work on tablet and phone (no horizontal scroll, primary action always reachable, ≥44px touch targets on phone).

**Architecture:** Every literal size in `app/skin/index.scss` and `app/skin/form.scss` becomes a `--ob-*` token defined in `app/skin/vars.scss`; desktop values are the old ones × 0.85, and width media queries (tablet ≤1023px, phone ≤599px) re-tune the same tokens. The option grids stop being pre-chunked into rows in JS and become one CSS grid whose column count is a token, so it can change per breakpoint. Tests render the REAL skeleton modules to HTML and measure them in headless Chromium at several viewports.

**Tech Stack:** Drumee ui-core skeletons (LetcBox, `Skeletons.*`), SCSS compiled by `sass`, Node test scripts (plain `node:assert`), puppeteer driving `/usr/bin/chromium`, Babel (`@babel/preset-env`) to load the ESM-flavoured skeleton files under Node.

**Spec:** `docs/superpowers/specs/2026-10-13-onboarding-responsive-design.md`

## Global Constraints

- Desktop scale factor is 0.85 of the Figma 155:47112 sizes; exact token values are in the spec's table and repeated in Task 3.
- Breakpoints: desktop `≥ 1024px`, tablet `600px – 1023px` (`@media (max-width: 1023px)`), phone `≤ 599px` (`@media (max-width: 599px)`).
- The existing `max-height: 900px` / `720px` tiers stay, re-based to the spec's values. Source order in `vars.scss`: base → tablet tier → 900 tier → 720 tier → phone tier.
- Phone: text inputs are 16px (iOS zooms on focus below 16px); buttons, chips, pills and goal rows are ≥ 44px tall.
- Sticky footer applies under `@media (max-width: 599px), (max-height: 500px)`.
- No change to `app/main.js`, services, copy, colours, step order, or locale keys.
- The grid rule's selector must be `(0,3,0)`: `.onboarding-app__form-section > .onboarding-app__option-grid[data-flow]`. Box.Y renders `.drumee-widget[data-flow=y] { display: flex }` at `(0,2,0)`.
- The grid box carries `data-cols` and `data-grid`, never `data-field`: `_selectOption` in `main.js` stamps `data-state` on every `[data-field=…]` element.
- `dataset` keys are lower-case single words; ui-core writes them with `setAttribute` verbatim.
- Out of scope: `app/widget/menu-input`, `app/widget/ruler-slider`, `app/skeleton/done.js`, the desk shell.

## Review Focus

1. **Long or translated option labels** ("Freelancer / Independent Consultant & Strategic Advisor") in the 2-column tablet grid and 1-column phone grid must wrap inside the chip, not overflow the screen. Pinned by Task 4's long-label test.
2. **Landscape phone (812×375)** — tablet-wide but the shortest screen: Continue must be on screen on every step. Pinned by Task 4's landscape sweep.
3. **Save-error banner with a long unbroken message on phone** must wrap, not push the layout sideways. Pinned by Task 4's banner test.
4. **"Other" reveal input on phone** must be 16px and fit the width. Pinned by Task 4's other-reveal test.
5. **Done screen with a long first name and three badges on phone** must wrap without horizontal scroll. Pinned by Task 4's done-screen test.

---

## File Structure

| File | Responsibility |
|---|---|
| `tests/babel-register.js` (create) | One place that teaches Node to `require()` the Babel-flavoured app files. |
| `tests/load-modules.js` (modify) | Uses `babel-register` instead of its own inline hook. |
| `tests/fixtures/locale-en.json` (create) | English labels for every locale key the skeleton reads, so rendered chips have realistic widths. |
| `tests/render.js` (create) | Renders the real `app/skeleton` for a given step/state to static HTML via a `Skeletons` stub. |
| `tests/harness.js` (modify) | Builds the test page (compiled CSS, cached), opens it in Chromium, and provides the measurement helpers. |
| `tests/render.test.js` (create) | Smoke test for the renderer. |
| `tests/grid.test.js` (create) | Option grids are real CSS grids with the right column count. |
| `tests/desktop-size.test.js` (create) | Desktop 85% sizes. |
| `tests/responsive.test.js` (create) | Tablet / phone / landscape behaviour and the Review Focus cases. |
| `app/skeleton/toolkit/form.js` (modify) | `buildOptionGrid` emits one grid instead of rows. |
| `app/skin/vars.scss` (modify) | All size tokens and every media tier. |
| `app/skin/index.scss` (modify) | Shell, header, buttons use tokens; `dvh`; sticky footer. |
| `app/skin/form.scss` (modify) | Form parts use tokens; grid rules and per-breakpoint columns; phone wrapping. |
| `package.json` (modify) | `npm test` runs the suite. |

---

### Task 1: Real-skeleton render harness

**Files:**
- Create: `tests/babel-register.js`
- Modify: `tests/load-modules.js:5-20`
- Create: `tests/fixtures/locale-en.json`
- Create: `tests/render.js`
- Modify: `tests/harness.js` (whole file)
- Create: `tests/render.test.js`
- Modify: `package.json` (`scripts`)

**Interfaces:**
- Produces:
  - `renderStep(step: number, opts?: { data?: object, saveError?: string|null, labels?: object }) => string` from `tests/render.js`. Returns the HTML of `.onboarding-app__ui` wrapping the real skeleton. `data` merges over `{ firstname: 'Alex' }`. `labels` overrides entries in the locale fixture.
  - From `tests/harness.js`:
    - `page(bodyHtml: string) => string`: a full HTML document with the compiled CSS.
    - `withBrowser(fn: (browser) => Promise<T>) => Promise<T>`
    - `show(browser, html: string, viewport: {width, height}) => Promise<Page>`
    - `box(p, sel) => Promise<{x,y,w,h,bottom,right}|null>`
    - `boxes(p, sel) => Promise<Array<{w,h,bottom,right}>>`
    - `fontSize(p, sel) => Promise<number|null>`
    - `gridCols(p, grid: string) => Promise<number>`: 0 when the box is missing or not a grid.
    - `overflowX(p) => Promise<string[]>`: an empty array means no horizontal overflow.
    - `measure(html, selectors, viewport)` is kept with its current signature.

- [ ] **Step 1: Write the failing test**

Create `tests/render.test.js`:

```js
// Smoke test for tests/render.js: the real skeleton renders to HTML that the
// layout tests can measure.
const assert = require('node:assert');
const { renderStep } = require('./render');

const industry = renderStep(1);
assert.strictEqual((industry.match(/onboarding-app__option-chip/g) || []).length, 12,
  'industry renders its 12 chips');
assert.ok(industry.includes('data-flow="y"'), 'boxes carry data-flow like ui-core renders them');
assert.ok(industry.includes('Tech / Software'), 'labels come from the locale fixture');

for (let s = 0; s <= 7; s++) {
  assert.ok(renderStep(s).includes('onboarding-app__primary-btn'), `step ${s} renders a primary button`);
}

assert.ok(renderStep(2, { labels: { ONBOARDING_ROLE_OTHER: 'Zzz' } }).includes('Zzz'),
  'labels can be overridden per render');
assert.ok(renderStep(1, { saveError: 'Boom' }).includes('Boom'), 'the save-error banner renders');

console.log('render.test.js: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/render.test.js`
Expected: FAIL with `Cannot find module './render'`.

- [ ] **Step 3: Extract the Babel hook**

Create `tests/babel-register.js`:

```js
// Lets Node require() the app's skeleton files, which mix `export` with
// `require`. Shared by load-modules.js and render.js. Idempotent.
const babel = require('@babel/core');
const fs = require('fs');
const Module = require('module');

const orig = Module._extensions['.js'];
if (!orig.__obBabel) {
  const hook = function (mod, filename) {
    if (filename.includes('node_modules')) return orig(mod, filename);
    const out = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
      filename,
      presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' } }]],
      babelrc: false, configFile: false,
    });
    mod._compile(out.code, filename);
  };
  hook.__obBabel = true;
  Module._extensions['.js'] = hook;
}
```

In `tests/load-modules.js`, replace lines 5–20 (from `const babel = require('@babel/core');` through the closing `};` of the `Module._extensions['.js'] = function …` block) with:

```js
const path = require('path');
require('./babel-register');

const root = path.resolve(__dirname, '..');
```

Run: `node tests/load-modules.js | tail -1`
Expected: `ALL MODULES EXECUTE CLEANLY`

- [ ] **Step 4: Add the locale fixture**

Create `tests/fixtures/locale-en.json` (values copied from `ui-team/locale/en.json`):

```json
{
  "BACK": "Back",
  "CONTINUE": "Continue",
  "ONBOARDING_CHALLENGES_QUESTION": "What challenges are you facing with your current setup?",
  "ONBOARDING_HELP_TAILOR": "Help us tailor your workspace",
  "ONBOARDING_IND_CONSULTING": "Consulting / Agency",
  "ONBOARDING_IND_CREATIVE": "Creative / Marketing",
  "ONBOARDING_IND_ECOMMERCE": "E-commerce / Retail",
  "ONBOARDING_IND_EDUCATION": "Education",
  "ONBOARDING_IND_FINANCE": "Finance / Accounting",
  "ONBOARDING_IND_HEALTHCARE": "Healthcare",
  "ONBOARDING_IND_LEGAL": "Legal / Compliance",
  "ONBOARDING_IND_MEDIA": "Media / Content",
  "ONBOARDING_IND_OPERATIONS": "Operations",
  "ONBOARDING_IND_OTHER": "Other",
  "ONBOARDING_IND_REAL_ESTATE": "Real Estate",
  "ONBOARDING_IND_TECH": "Tech / Software",
  "ONBOARDING_OPEN_WORKSPACE": "Open workspace",
  "ONBOARDING_ROLE_EXECUTIVE": "Executive / Associate",
  "ONBOARDING_ROLE_FOUNDER": "Founder / CEO",
  "ONBOARDING_ROLE_FREELANCER": "Freelancer / Consultant",
  "ONBOARDING_ROLE_MANAGER": "Manager / Team lead",
  "ONBOARDING_ROLE_OTHER": "Other",
  "ONBOARDING_TEAM_10_50": "10 - 50",
  "ONBOARDING_TEAM_2_10": "2 - 10",
  "ONBOARDING_TEAM_50_PLUS": "50+",
  "ONBOARDING_TEAM_JUST_ME": "Just me",
  "ONBOARDING_TELL_ME_LATER": "Tell me later",
  "ONBOARDING_TOOLS_QUESTION": "What tools are you using?",
  "ONBOARDING_TOOL_CLICKUP": "ClickUp",
  "ONBOARDING_TOOL_DROPBOX": "Dropbox",
  "ONBOARDING_TOOL_GOOGLE_DRIVE": "Google Drive",
  "ONBOARDING_TOOL_JIRA": "Jira",
  "ONBOARDING_TOOL_NOTION": "Notion",
  "ONBOARDING_TOOL_OTHER": "Other",
  "ONBOARDING_TOOL_SLACK": "Slack",
  "ONBOARDING_TOOL_TRELLO": "Trello"
}
```

Keys not listed (challenge and goal labels, the step titles) go through `loc()`. That falls back to the English design text because the stub echoes unknown keys exactly like the real `LOCALE`.

- [ ] **Step 5: Write the renderer**

Create `tests/render.js`:

```js
// Renders the REAL app/skeleton modules to static HTML, so layout tests
// measure the markup the wizard actually produces rather than a hand-written
// copy of it. Skeletons is stubbed to emit what ui-core puts in the DOM for
// the parts the wizard uses: a .drumee-widget div with the descriptor's
// className, data-flow for Box.X / Box.Y (and Element, which ui-core renders as
// a row flexbox), data-* from `dataset`, Note's inner .note-content, and
// Entry's <input>.
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE = require('./fixtures/locale-en.json');

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function attrs(o, flow) {
  const cls = ['drumee-widget', o.className].filter(Boolean).join(' ');
  let a = ` class="${esc(cls)}"`;
  if (flow) a += ` data-flow="${flow}"`;
  for (const [k, v] of Object.entries(o.dataset || {})) a += ` data-${k}="${esc(v)}"`;
  return a;
}

function toHtml(node) {
  if (node == null || node === '') return '';
  if (Array.isArray(node)) return node.map(toHtml).join('');
  return node.__html;
}

const content = (o) => (o.content == null ? '' : o.content);
const box = (flow) => (o) => ({ __html: `<div${attrs(o, flow)}>${toHtml(o.kids || [])}</div>` });
const element = (o) => ({ __html: `<div${attrs(o, 'x')}>${content(o)}</div>` });
const note = (o) => ({ __html: `<div${attrs(o)}><div class="note-content">${content(o)}</div></div>` });
const entry = (o) => ({
  __html: `<div${attrs(o)}><input name="${esc(o.name || '')}" value="${esc(o.value || '')}" placeholder="${esc(o.placeholder || '')}"></div>`,
});

function installGlobals(labels) {
  const map = { ...FIXTURE, ...(labels || {}) };
  global.Skeletons = { Box: { X: box('x'), Y: box('y') }, Element: element, Note: note, Entry: entry };
  // The real bundle echoes an unknown key back; loc() relies on that.
  global.LOCALE = new Proxy({}, { get: (t, k) => (k in map ? map[k] : String(k)) });
  global._a = new Proxy({}, { get: (t, k) => String(k) });
  global.Visitor = { get: () => '', language: () => 'en' };
}

function renderStep(step, { data = {}, saveError = null, labels = null } = {}) {
  installGlobals(labels);
  require('./babel-register');
  const skeleton = require(path.join(ROOT, 'app/skeleton'));
  const ui = {
    fig: { family: 'onboarding-app' },
    _step: step,
    _data: { firstname: 'Alex', ...data },
    _saveError: saveError,
    _id: 'test',
  };
  return `<div class="drumee-widget onboarding-app__ui" data-flow="y">${toHtml(skeleton(ui))}</div>`;
}

module.exports = { renderStep };
```

- [ ] **Step 6: Extend the harness**

Replace `tests/harness.js` with:

```js
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
  'input-row', 'option-row', 'tool-chips-wrap', 'summary-badges',
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
```

- [ ] **Step 7: Add the test script**

In `package.json`, add a `test` entry to `scripts` after `"deploy": "drumee-ui-deploy"`:

```json
    "deploy": "drumee-ui-deploy",
    "test": "node tests/load-modules.js && node tests/resume.test.js && node tests/render.test.js"
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test 2>&1 | tail -3`
Expected: the last lines include `resume.test.js: all assertions passed` and `render.test.js: all assertions passed`.

- [ ] **Step 9: Commit**

```bash
git add tests/babel-register.js tests/load-modules.js tests/fixtures/locale-en.json tests/render.js tests/harness.js tests/render.test.js package.json
git commit -m "test(onboarding): render the real skeleton for layout tests"
```

---

### Task 2: Option grids become one CSS grid

**Files:**
- Modify: `app/skeleton/toolkit/form.js` (`buildOptionGrid`, currently lines 166–209)
- Modify: `app/skin/form.scss` (the `__option-grid`, `__option-row`, `__option-chip` and `.cols-3` rules, currently lines 14–23 and 56–95)
- Create: `tests/grid.test.js`
- Modify: `package.json` (`test` script)

**Interfaces:**
- Consumes: `renderStep`, `page`, `withBrowser`, `show`, `boxes`, `gridCols` (Task 1).
- Produces:
  - The markup contract `<div class="… onboarding-app__option-grid" data-flow="y" data-cols="2|3" data-grid="industry|role|team_size">` with chips as its direct children.
  - The CSS custom property `--ob-cols`, which sets the column count. Task 4 overrides it per breakpoint.

- [ ] **Step 1: Write the failing test**

Create `tests/grid.test.js`:

```js
// The option grids are one CSS grid each (not pre-chunked rows), so the
// column count is CSS's to change per breakpoint.
const assert = require('node:assert');
const { page, withBrowser, show, boxes, gridCols } = require('./harness');
const { renderStep } = require('./render');

const DESKTOP = { width: 1440, height: 900 };
const CASES = [['industry', 1, 3], ['role', 2, 2], ['team_size', 3, 2]];

(async () => {
  await withBrowser(async (browser) => {
    for (const [grid, step, n] of CASES) {
      const p = await show(browser, page(renderStep(step)), DESKTOP);
      assert.strictEqual(await gridCols(p, grid), n, `${grid}: ${n} columns on desktop`);
      const cells = await boxes(p, `.onboarding-app__option-grid[data-grid="${grid}"] > .onboarding-app__option-chip`);
      assert.ok(cells.length > 0, `${grid}: chips are direct children of the grid`);
      assert.ok(cells.every((c) => Math.abs(c.w - cells[0].w) < 0.5),
        `${grid}: every chip is one column wide, a lone trailing chip included`);
      assert.strictEqual(await p.$('.onboarding-app__option-row'), null, `${grid}: no row wrappers`);
      assert.strictEqual(await p.$('.onboarding-app__option-grid[data-field]'), null,
        `${grid}: the grid box must not carry data-field (_selectOption would stamp it)`);
      await p.close();
    }
  });
  console.log('grid.test.js: all assertions passed');
})().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/grid.test.js`
Expected: FAIL with `industry: 3 columns on desktop` (actual `0`, because there is no `data-grid` box yet).

- [ ] **Step 3: Emit one grid from `buildOptionGrid`**

In `app/skeleton/toolkit/form.js`, replace the whole `buildOptionGrid` function with:

```js
function buildOptionGrid(ui, opts, field, perRow = 2) {
  const pfx = ui.fig.family;
  let selected = ui._data[field] || '';
  let kids = opts.map(([key, localeKey], i) => {
    let label = LOCALE[localeKey] || key;
    let isOn = selected === key;
    return Skeletons.Note({
      className: `${pfx}__option-chip`,
      name: label,
      sys_pn: `${field}-${i}`,
      partHandler: [ui],
      // Toggling single-select: click to choose, click the chosen one again to
      // clear it. Shared by industry, role and team size (and the goals step,
      // which builds its rows separately).
      service: 'toggle-option',
      uiHandler: [ui],
      state: isOn ? 1 : 0,
      dataset: { state: isOn ? 1 : 0, value: key, field },
      content: label,
    });
  });
  return Skeletons.Box.Y({
    className: `${pfx}__form-section`,
    kids: [
      // One grid, not rows chunked here: the column count belongs to CSS
      // (data-cols is the desktop count; tablet and phone override it in
      // skin/form.scss). `grid`, not `field`: _selectOption stamps data-state
      // on every [data-field] element, and this box is not an option.
      Skeletons.Box.Y({
        className: `${pfx}__option-grid`,
        dataset: { cols: perRow, grid: field },
        kids,
      }),
      Skeletons.Box.Y({
        className: `${pfx}__other-region`,
        sys_pn: `${field}-other`,
        kids: other_region(ui, field),
      }),
    ]
  });
}
```

- [ ] **Step 4: Replace the row/flex CSS with grid CSS**

In `app/skin/form.scss`, replace these two rules:

```scss
.onboarding-app__option-grid {
  width: 100%;
  gap: 16px;
}

.onboarding-app__option-row {
  width: 100%;
  gap: 16px;
}
```

with:

```scss
.onboarding-app__option-grid {
  width: 100%;
}

// A real grid, so the column count can change per breakpoint (see the width
// tiers further down). (0,3,0) on purpose: Box.Y renders as
// `.drumee-widget[data-flow=y] { display: flex }` at (0,2,0), which beats a
// single-class display: grid.
.onboarding-app__form-section > .onboarding-app__option-grid[data-flow] {
  display: grid;
  grid-template-columns: repeat(var(--ob-cols, 2), minmax(0, 1fr));
  gap: 16px;
}

.onboarding-app__option-grid[data-cols="2"] { --ob-cols: 2; }
.onboarding-app__option-grid[data-cols="3"] { --ob-cols: 3; }
```

In `.onboarding-app__option-chip`, delete the comment above `flex: 0 0 calc((100% - 16px) / 2);` (the three lines starting `// Fixed one-column width`) and that `flex:` line. The grid cell sets the width now.

Replace the whole `.cols-3` block:

```scss
/* 3-up option grid (industry): narrower slots, so let long labels wrap
   instead of overflowing, and keep clear of the selected-state checkmark. */
.onboarding-app__option-grid.cols-3 .onboarding-app__option-chip {
  // 3 per row: two 16px gaps → fixed third-column width.
  flex-basis: calc((100% - 32px) / 3);
  white-space: normal;
  text-align: center;
  padding: 8px 28px 8px 8px;
}
```

with:

```scss
/* 3-up option grid (industry): narrower slots, so let long labels wrap
   instead of overflowing, and keep clear of the selected-state checkmark. */
.onboarding-app__option-grid[data-cols="3"] .onboarding-app__option-chip {
  white-space: normal;
  text-align: center;
  padding: 8px 28px 8px 8px;
}
```

- [ ] **Step 5: Drop the dead row shim from the harness**

In `tests/harness.js`, remove `'option-row', ` from the `FLEX_ROW` array.

- [ ] **Step 6: Add to the test script**

In `package.json`, change the `test` script to:

```json
    "test": "node tests/load-modules.js && node tests/resume.test.js && node tests/render.test.js && node tests/grid.test.js"
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test 2>&1 | tail -2`
Expected: `grid.test.js: all assertions passed`

Check that nothing else referenced the removed class:
Run: `grep -rn "option-row\|cols-3" app/`
Expected: no output.

- [ ] **Step 8: Commit**

```bash
git add app/skeleton/toolkit/form.js app/skin/form.scss tests/grid.test.js tests/harness.js package.json
git commit -m "feat(onboarding): option grids are one CSS grid, columns set in CSS"
```

---

### Task 3: Size tokens + 85% desktop downsize

**Files:**
- Modify: `app/skin/vars.scss` (everything from the `// Shape and rhythm` banner to the end of the file)
- Modify: `app/skin/index.scss` (rules listed in Step 4)
- Modify: `app/skin/form.scss` (rules listed in Step 5)
- Create: `tests/desktop-size.test.js`
- Modify: `package.json` (`test` script)

**Interfaces:**
- Consumes: the harness helpers and `renderStep` (Task 1). The grid rule from Task 2 (its `gap: 16px` becomes `var(--ob-grid-gap)` here).
- Produces: the tokens Task 4 overrides:
  - `--ob-gutter`, `--ob-main-max`, `--ob-card-max`, `--ob-wide-max`, `--ob-card-top`, `--ob-card-pad`
  - `--ob-gap-lead`, `--ob-gap-block`, `--ob-gap-inline`
  - `--ob-fs-title`, `--ob-fs-heading`, `--ob-fs-btn`, `--ob-fs-body`, `--ob-fs-input`
  - `--ob-ctl-h`, `--ob-chip-h`, `--ob-tap-min`
  - `--ob-logo-w`, `--ob-logo-h`, `--ob-logo-box-w`, `--ob-logo-box-h`

- [ ] **Step 1: Write the failing test**

Create `tests/desktop-size.test.js`:

```js
// Desktop draws the wizard at 85% of the Figma size (spec 2026-10-13).
const assert = require('node:assert');
const { page, withBrowser, show, box, fontSize } = require('./harness');
const { renderStep } = require('./render');

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: got ${a}, want ${b}±${tol}`);

(async () => {
  await withBrowser(async (browser) => {
    for (const vp of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }]) {
      const tag = `${vp.width}x${vp.height}`;

      // Role: a standard-width step with a title, chips and Continue.
      let p = await show(browser, page(renderStep(2)), vp);
      assert.strictEqual(await fontSize(p, '.onboarding-app__title'), 27, `${tag} title 27px`);
      assert.strictEqual(await fontSize(p, '.onboarding-app__primary-btn'), 14, `${tag} button text 14px`);
      near((await box(p, '.onboarding-app__primary-btn')).h, 40, 0.5, `${tag} button height`);
      assert.strictEqual(await fontSize(p, '.onboarding-app__option-chip'), 12, `${tag} chip text 12px`);
      near((await box(p, '.onboarding-app__card')).w, 442, 0.5, `${tag} card width`);
      near((await box(p, '.onboarding-app__logo')).w, 162.3, 0.5, `${tag} logo box width`);
      near((await box(p, '.onboarding-app__progress-step')).h, 5, 0.1, `${tag} progress bar height`);
      await p.close();

      // Name: the text input.
      p = await show(browser, page(renderStep(0)), vp);
      assert.strictEqual(await fontSize(p, '.onboarding-app__input-field input'), 12, `${tag} input text 12px`);
      await p.close();

      // Goals: glyph box.
      p = await show(browser, page(renderStep(6)), vp);
      near((await box(p, '.onboarding-app__goal-icon')).w, 18, 0.1, `${tag} goal icon box`);
      await p.close();

      // Done.
      p = await show(browser, page(renderStep(7, {
        data: { industry: 'healthcare', team_size: '2_10', goal: 'manage_projects' },
      })), vp);
      assert.strictEqual(await fontSize(p, '.onboarding-app__done-title'), 27, `${tag} done title 27px`);
      near((await box(p, '.onboarding-app__done-icon')).w, 60, 0.1, `${tag} done badge`);
      await p.close();
    }
  });
  console.log('desktop-size.test.js: all assertions passed');
})().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/desktop-size.test.js`
Expected: FAIL with `AssertionError … 1440x900 title 27px` (actual `32`).

- [ ] **Step 3: Rewrite the tokens and tiers in `vars.scss`**

In `app/skin/vars.scss`, keep the colour tokens. Replace everything from the line `  // ---------------------------------------------------------------------` that opens `// Shape and rhythm (Figma 155:47112)` down to the end of the file with:

```scss
  // ---------------------------------------------------------------------
  // Sizes — Figma 155:47112 × 0.85
  // ---------------------------------------------------------------------
  // Desktop draws the whole wizard at 85% of the Figma size (spec
  // docs/superpowers/specs/2026-10-13-onboarding-responsive-design.md).
  // EVERY size lives here, so tablet and phone re-tune them in one place —
  // see the width tiers below. Grid column counts are in form.scss, next to
  // the grid rule they feed.
  --ob-radius-btn: 10px;
  --ob-radius-field: 7px;
  --ob-radius-pill: 999px;

  // Type
  --ob-fs-title: 27px;
  --ob-fs-heading: 17px;
  --ob-fs-btn: 14px;
  --ob-lh-btn: 20px;
  --ob-fs-body: 12px;
  --ob-fs-small: 12px;
  --ob-fs-input: 12px;

  // Controls
  --ob-ctl-h: 40px;
  --ob-btn-pad-y: 10px;
  --ob-btn-pad-x: 20px;
  --ob-back-min: 82px;
  --ob-chip-h: 38px;
  --ob-chip-pad-y: 7px;
  --ob-chip-pad-x: 10px;
  --ob-tool-pad-x: 17px;
  --ob-input-pad: 10px;
  --ob-grid-gap: 14px;
  // Floor for the rows that have no height of their own (tool pills,
  // challenge and goal rows). Only the phone tier raises it, to 44px.
  --ob-tap-min: 0px;

  // Icons and marks
  --ob-icon: 17px;
  --ob-check: 14px;
  --ob-check-sm: 10px;
  --ob-goal-icon: 18px;
  // Goal glyphs keep their intrinsic width/height (see __goal-icon), so they
  // are scaled rather than resized.
  --ob-icon-scale: 0.85;
  --ob-logo-w: 162px;
  --ob-logo-h: 32.2px;
  --ob-logo-box-w: 162.3px;
  --ob-logo-box-h: 34.2px;
  --ob-progress-h: 5px;

  // Containers. __main is the scroll column (gutter inside it), __card the
  // content column; is-wide (industry) uses --ob-wide-max for both.
  --ob-gutter: 20px;
  --ob-main-max: 527px;
  --ob-card-max: 442px;
  --ob-wide-max: 680px;

  // Card padding, and the two vertical steps the layout is built from: lead
  // (header block to question) and block (question / form / primary action).
  --ob-card-pad: 20px;
  --ob-gap-lead: 40px;
  --ob-gap-block: 28px;

  // The tools/challenges steps carry their heading inside the form body and
  // space their blocks tighter (Figma 155:47287). --ob-gap-list is the step
  // between option rows.
  --ob-gap-inline: 20px;
  --ob-gap-list: 10px;

  // Pill-shaped option rows on the challenges step, and its "Tell us more"
  // box, which the design deliberately leaves square-ish while the pills above
  // it go fully round.
  --ob-pill-radius: 44px;
  --ob-pill-pad-y: 7px;
  // Goal rows are taller than challenge rows because they carry an icon
  // (Figma 155:47422 vs 155:47317).
  --ob-goal-pad-y: 10px;
  --ob-freetext-radius: 4px;
  --ob-freetext-h: 55px;

  // Done screen (Figma 155:47483).
  --ob-done-badge-size: 60px;
  --ob-done-icon-size: 33px;
  --ob-done-col: 394px;
  --ob-gap-done: 34px;

  // Distance from the top of the viewport to the top of the card.
  --ob-card-top: 94px;
}

// ---------------------------------------------------------------------------
// Tiers — ORDER MATTERS
// ---------------------------------------------------------------------------
// base → tablet (width) → short (900) → shorter (720) → phone (width).
// A landscape phone (812x375) is tablet-wide AND short, and must get the
// height tiers' compression, so they come after tablet. A portrait phone is
// both narrow and under 900 tall, and must get the phone values, so phone
// comes last.

// Tablet: 600px – 1023px wide. Type stays at desktop size; the columns
// widen to use the screen. The tablet tier is filled in by Task 4.

// ---------------------------------------------------------------------------
// Short viewports
// ---------------------------------------------------------------------------
// The challenges step (155:47287) is the tallest in the flow, and on a
// laptop it used to run past the fold and scroll silently, because __main
// hides its scrollbar. The vertical rhythm steps down in two stages. Only
// gaps, paddings and the card's top offset change here; text sizes do not.
// Values are the pre-downsize tiers × 0.85, so each tier is still a step
// down from the new desktop default.
@media (max-height: 900px) {
  .onboarding-app__ui {
    --ob-card-top: 48px;
    --ob-card-pad: 17px;
    --ob-gap-lead: 27px;
    --ob-gap-block: 20px;
    --ob-gap-inline: 14px;
    --ob-gap-list: 7px;
    --ob-pill-pad-y: 6px;
    --ob-goal-pad-y: 9px;
    --ob-freetext-h: 48px;
  }
}

@media (max-height: 720px) {
  .onboarding-app__ui {
    --ob-card-top: 27px;
    --ob-card-pad: 14px;
    --ob-gap-lead: 20px;
    --ob-gap-block: 14px;
    --ob-gap-inline: 10px;
    --ob-gap-list: 5px;
    --ob-pill-pad-y: 5px;
    --ob-goal-pad-y: 7px;
    --ob-freetext-h: 41px;
  }
}

// Phone: up to 599px wide. Filled in by Task 4.
```

- [ ] **Step 4: Tokenise `index.scss`**

In `app/skin/index.scss`, make exactly these changes. Each line shows the selector, then old → new.

- `&__main`:
  - `max-width: 620px;` → `max-width: var(--ob-main-max);`
  - `padding: var(--ob-card-top) var(--spacer-7) var(--spacer-7);` → `padding: var(--ob-card-top) var(--ob-gutter) var(--ob-gutter);`
  - in its `&.is-wide`: `max-width: 800px;` → `max-width: var(--ob-wide-max);`
- `&__card`:
  - `max-width: 520px;` → `max-width: var(--ob-card-max);`
  - in its `&.is-wide`: `max-width: 800px;` → `max-width: var(--ob-wide-max);`
- `&__header-copy`: `gap: 8px;` → `gap: 7px;`
- `&__logo`:
  - `width: 190.917px;` → `width: var(--ob-logo-box-w);`
  - `height: 40.181px;` → `height: var(--ob-logo-box-h);`
  - in its `svg`: `width: 190.471px;` → `width: var(--ob-logo-w);` and `height: 37.866px;` → `height: var(--ob-logo-h);`
- `&__progress-bar`: `gap: 8px;` → `gap: 7px;`
- `&__progress-step`: `height: 6px;` → `height: var(--ob-progress-h);`
- `&__title`: `font-size: 32px;` → `font-size: var(--ob-fs-title);`
- `&__primary-btn`:
  - `min-height: 48px;` → `min-height: var(--ob-ctl-h);`
  - `padding: 12px 24px;` → `padding: var(--ob-btn-pad-y) var(--ob-btn-pad-x);`
  - `font-size: 16px;` → `font-size: var(--ob-fs-btn);`
  - `line-height: 24px;` → `line-height: var(--ob-lh-btn);`
  - `gap: 8px;` → `gap: 7px;`
  - in `&.is-loading::after`: `width: 16px;` → `width: 14px;` and `height: 16px;` → `height: 14px;`
- `&__secondary-btn`:
  - `min-height: 48px;` → `min-height: var(--ob-ctl-h);`
  - `padding: 12px 24px;` → `padding: var(--ob-btn-pad-y) var(--ob-btn-pad-x);`
  - `font-size: 16px;` → `font-size: var(--ob-fs-btn);`
  - `line-height: 24px;` → `line-height: var(--ob-lh-btn);`
- `&__btn-row`:
  - `gap: 12px;` → `gap: 10px;`
  - in `.onboarding-app__back-btn`: `min-width: 96px;` → `min-width: var(--ob-back-min);`
- `&__back-btn`:
  - `min-height: 48px;` → `min-height: var(--ob-ctl-h);`
  - `padding: 12px 20px;` → `padding: var(--ob-btn-pad-y) var(--ob-tool-pad-x);`
  - `font-size: 16px;` → `font-size: var(--ob-fs-btn);`

Also update the comments that state pixel values, so they match:
- "32px between the header block…" → "--ob-gap-block between the header block…"
- "the header's 48px gap" (twice) → "the header's --ob-gap-lead gap"
- "the button's gap:8px" → "the button's 7px gap"

- [ ] **Step 5: Tokenise `form.scss`**

In `app/skin/form.scss`, make exactly these changes:

- `.onboarding-app__form-section`: `padding-top: 8px;` → `padding-top: 7px;`
- The Task 2 grid rule: `gap: 16px;` → `gap: var(--ob-grid-gap);`
- `%onboarding-checked-mark`: `width: 12px;` / `height: 12px;` → `var(--ob-check-sm)` for both.
- `%onboarding-checked-badge`:
  - `right: 12px;` → `right: 10px;`
  - `width: 16px;` / `height: 16px;` → `var(--ob-check)` for both.
- `.onboarding-app__option-chip`:
  - `padding: 8px 12px;` → `padding: var(--ob-chip-pad-y) var(--ob-chip-pad-x);`
  - `font-size: 14px;` → `font-size: var(--ob-fs-body);`
  - `min-height: 44px;` → `min-height: var(--ob-chip-h);`
- `.onboarding-app__option-grid[data-cols="3"] .onboarding-app__option-chip`: `padding: 8px 28px 8px 8px;` → `padding: var(--ob-chip-pad-y) 24px var(--ob-chip-pad-y) 7px;`
- `.onboarding-app__input-group`: `gap: 12px;` → `gap: 10px;`
- `.onboarding-app__input-field`:
  - `padding: 12px;` → `padding: var(--ob-input-pad);`
  - in `input`: `font-size: 14px;` → `font-size: var(--ob-fs-input);`
- `.onboarding-app__other-input`: `margin-top: 12px;` → `margin-top: 10px;`
- `.onboarding-app__tools-title`: `gap: 12px;` → `gap: 10px;`
- `.onboarding-app__tools-star svg`: `width: 20px;` / `height: 20px;` → `var(--ob-icon)` for both.
- `.onboarding-app__tools-title-text`: `font-size: 20px;` → `font-size: var(--ob-fs-heading);`
- `.onboarding-app__section-label`: `font-size: 14px;` → `font-size: var(--ob-fs-body);`
- `.onboarding-app__tool-chips-wrap`: `gap: 12px;` → `gap: 10px;`
- `.onboarding-app__tool-chip`:
  - `padding: 8px 20px;` → `padding: var(--ob-chip-pad-y) var(--ob-tool-pad-x);`
  - `font-size: 14px;` → `font-size: var(--ob-fs-body);`
  - add `min-height: var(--ob-tap-min);` after `align-items: center;`
  - in `&[data-state="1"]::after`: `margin-left: 8px;` → `margin-left: 7px;`
- `.onboarding-app__challenge-option`:
  - add `display: flex;`, `align-items: center;` and `min-height: var(--ob-tap-min);` after `position: relative;`
  - `padding: var(--ob-pill-pad-y) 56px var(--ob-pill-pad-y) 16px;` → `padding: var(--ob-pill-pad-y) 48px var(--ob-pill-pad-y) 14px;`
  - `font-size: 14px;` → `font-size: var(--ob-fs-body);`
  - in `&[data-state="1"]::after`: `width: 20px;` / `height: 20px;` → `var(--ob-icon)` for both.
- `.onboarding-app__challenge-freetext .onboarding-app__input-field`: `padding: 8px 12px;` → `padding: 7px 10px;`
- `.onboarding-app__goal-option`:
  - add `min-height: var(--ob-tap-min);` after `align-items: center;`
  - `gap: 24px;` → `gap: 20px;`
  - `padding: var(--ob-goal-pad-y) 56px var(--ob-goal-pad-y) 16px;` → `padding: var(--ob-goal-pad-y) 48px var(--ob-goal-pad-y) 14px;`
  - in `&[data-state="1"]::after`: `width: 20px;` / `height: 20px;` → `var(--ob-icon)` for both.
- `.onboarding-app__goal-icon`:
  - `width: 21px;` / `height: 21px;` → `var(--ob-goal-icon)` for both.
  - in its `svg`, add `transform: scale(var(--ob-icon-scale));`
- `.onboarding-app__goal-label`: `font-size: 14px;` → `font-size: var(--ob-fs-body);`
- `.onboarding-app__save-error`:
  - `gap: 8px;` → `gap: 7px;`
  - `margin: 4px 0 12px;` → `margin: 3px 0 10px;`
  - `padding: 10px 12px;` → `padding: 9px 10px;`
  - `font-size: 13px;` → `font-size: var(--ob-fs-small);`
- `.onboarding-app__save-error-icon`: `height: 19px;` → `height: 17px;`
- `.onboarding-app__done-head`: `gap: 16px;` → `gap: 14px;`
- `.onboarding-app__done-title`: `font-size: 32px;` → `font-size: var(--ob-fs-title);`
- `.onboarding-app__summary-badges`: `gap: 12px;` → `gap: 10px;`
- `.onboarding-app__summary-badge`:
  - `padding: 8px 20px;` → `padding: var(--ob-chip-pad-y) var(--ob-tool-pad-x);`
  - `font-size: 14px;` → `font-size: var(--ob-fs-body);`

Update the pixel-quoting comments near these rules to match: "16px in, 12px out", "12px edge + 20px check + 24px gap", "21px square", "Body/Small Body … 14px", "row gap is 16px".

- [ ] **Step 6: Confirm no literal type/control sizes remain**

Run: `grep -nE "font-size: [0-9]|min-height: [0-9]+px|max-width: [0-9]" app/skin/index.scss app/skin/form.scss`
Expected: no output.

- [ ] **Step 7: Add to the test script**

In `package.json`, change the `test` script to:

```json
    "test": "node tests/load-modules.js && node tests/resume.test.js && node tests/render.test.js && node tests/grid.test.js && node tests/desktop-size.test.js"
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test 2>&1 | tail -3`
Expected: `grid.test.js: all assertions passed` and `desktop-size.test.js: all assertions passed`

- [ ] **Step 9: Commit**

```bash
git add app/skin/vars.scss app/skin/index.scss app/skin/form.scss tests/desktop-size.test.js package.json
git commit -m "feat(onboarding): size tokens, desktop drawn at 85% of Figma"
```

---

### Task 4: Tablet and phone breakpoints

**Files:**
- Modify: `app/skin/vars.scss` (fill in the two "Filled in by Task 4" comments)
- Modify: `app/skin/index.scss` (`&__ui` height; new sticky-footer block at the end, before `@keyframes`)
- Modify: `app/skin/form.scss` (per-breakpoint grid columns after the grid rules; wrapping; phone-only rules at the end)
- Create: `tests/responsive.test.js`
- Modify: `package.json` (`test` script)

**Interfaces:**
- Consumes:
  - Every token produced by Task 3.
  - `--ob-cols`, `data-cols` and `data-grid` from Task 2.
  - `renderStep` (including its `labels`, `data` and `saveError` options), `page`, `withBrowser`, `show`, `box`, `boxes`, `fontSize`, `gridCols` and `overflowX` from Task 1.
- Produces: the final layout. Nothing later depends on it.

- [ ] **Step 1: Write the failing test**

Create `tests/responsive.test.js`:

```js
// Tablet / phone / landscape behaviour (spec 2026-10-13), plus the Review
// Focus cases from the plan: long labels, landscape reachability, a long
// save error, the "Other" reveal, and a long done screen.
const assert = require('node:assert');
const { page, withBrowser, show, box, boxes, fontSize, gridCols, overflowX } = require('./harness');
const { renderStep } = require('./render');

const PHONE = { width: 375, height: 812 };
const LANDSCAPE = { width: 812, height: 375 };
const TABLET = { width: 768, height: 1024 };
const DESKTOP = { width: 1440, height: 900 };

const TAPPABLE = [
  '.onboarding-app__option-chip', '.onboarding-app__tool-chip',
  '.onboarding-app__challenge-option', '.onboarding-app__goal-option',
  '.onboarding-app__primary-btn', '.onboarding-app__secondary-btn',
  '.onboarding-app__back-btn',
].join(',');

async function check(browser, html, vp, tag, extra) {
  const p = await show(browser, html, vp);
  try {
    assert.deepStrictEqual(await overflowX(p), [], `${tag}: no horizontal overflow`);
    const btn = await box(p, '.onboarding-app__primary-btn');
    assert.ok(btn && btn.bottom <= vp.height + 0.5,
      `${tag}: primary button on screen (bottom ${btn && btn.bottom} > ${vp.height})`);
    if (extra) await extra(p);
  } finally {
    await p.close();
  }
}

(async () => {
  await withBrowser(async (browser) => {
    // Every step at every viewport: no sideways scroll, Continue reachable.
    for (const [name, vp] of Object.entries({ PHONE, LANDSCAPE, TABLET, DESKTOP })) {
      for (let s = 0; s <= 7; s++) {
        await check(browser, page(renderStep(s)), vp, `${name} step ${s}`, async (p) => {
          if (name !== 'PHONE') return;
          for (const b of await boxes(p, TAPPABLE)) {
            assert.ok(b.h >= 43.5, `PHONE step ${s}: tap target ${b.h.toFixed(1)}px tall, want >= 44`);
          }
        });
      }
    }

    // Grid columns per breakpoint: [grid, step, desktop, tablet, phone].
    for (const [grid, step, d, t, ph] of [
      ['industry', 1, 3, 2, 1], ['role', 2, 2, 2, 1], ['team_size', 3, 2, 2, 2],
    ]) {
      for (const [vp, n, tag] of [[DESKTOP, d, 'DESKTOP'], [TABLET, t, 'TABLET'], [PHONE, ph, 'PHONE']]) {
        const p = await show(browser, page(renderStep(step)), vp);
        assert.strictEqual(await gridCols(p, grid), n, `${tag} ${grid}: ${n} columns`);
        await p.close();
      }
    }

    // Tablet card width.
    {
      const p = await show(browser, page(renderStep(2)), TABLET);
      assert.ok((await box(p, '.onboarding-app__card')).w <= 560.5, 'TABLET card <= 560px');
      await p.close();
    }

    // Phone sizes: full-bleed with 16px gutters, 22px title, 16px inputs.
    {
      const p = await show(browser, page(renderStep(0)), PHONE);
      const card = await box(p, '.onboarding-app__card');
      assert.ok(Math.abs(card.x - 16) < 0.5 && Math.abs(card.w - 343) < 0.5,
        `PHONE card spans the width inside 16px gutters (x ${card.x}, w ${card.w})`);
      assert.strictEqual(await fontSize(p, '.onboarding-app__title'), 22, 'PHONE title 22px');
      assert.strictEqual(await fontSize(p, '.onboarding-app__input-field input'), 16,
        'PHONE input 16px (iOS zooms below 16)');
      await p.close();
    }

    // Review Focus 1: a long, translated-length label wraps instead of
    // overflowing, and the grid keeps every chip one column wide.
    const LONG = { ONBOARDING_ROLE_FREELANCER: 'Freelancer / Independent Consultant & Strategic Advisor' };
    for (const [vp, tag] of [[PHONE, 'PHONE'], [TABLET, 'TABLET'], [DESKTOP, 'DESKTOP']]) {
      await check(browser, page(renderStep(2, { labels: LONG })), vp, `${tag} long label`, async (p) => {
        const cells = await boxes(p, '.onboarding-app__option-grid[data-grid="role"] > .onboarding-app__option-chip');
        assert.ok(cells.every((c) => Math.abs(c.w - cells[0].w) < 0.5), `${tag} long label: equal columns`);
      });
    }

    // Review Focus 2 is the LANDSCAPE sweep above (812x375, every step).

    // Review Focus 3: a long save error with an unbroken token.
    await check(browser, page(renderStep(1, {
      saveError: 'Step 2 (industry) is incomplete. ' + 'x'.repeat(120),
    })), PHONE, 'PHONE long save error');

    // Review Focus 4: the "Other" reveal input on phone.
    await check(browser, page(renderStep(1, { data: { industry: 'other', industry_other: 'Aerospace' } })),
      PHONE, 'PHONE other reveal', async (p) => {
        assert.strictEqual(await fontSize(p, '.onboarding-app__other-input input'), 16, 'other input 16px');
      });

    // Review Focus 5: done screen with a long name and three badges.
    await check(browser, page(renderStep(7, {
      data: {
        firstname: 'Bartholomew-Alexandria', industry: 'finance_accounting',
        team_size: '50_plus', goal: 'build_workflows',
      },
    })), PHONE, 'PHONE long done screen');
  });
  console.log('responsive.test.js: all assertions passed');
})().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/responsive.test.js`
Expected: FAIL on the first PHONE step. The likely message is `PHONE step 0: tap target 40.0px tall, want >= 44`, or an overflow line from `overflowX`.

- [ ] **Step 3: Fill in the width tiers in `vars.scss`**

Replace the comment `// Tablet: 600px – 1023px wide. … The tablet tier is filled in by Task 4.` with:

```scss
// Tablet: 600px – 1023px wide (this query also matches phones; the phone
// tier at the bottom overrides it). Type stays at desktop size; the columns
// widen to use the screen, and the wide industry step no longer needs extra
// room because it drops to 2 columns (form.scss).
@media (max-width: 1023px) {
  .onboarding-app__ui {
    --ob-main-max: 600px;
    --ob-card-max: 560px;
    --ob-wide-max: 600px;
    --ob-card-top: 64px;
  }
}
```

Replace the comment `// Phone: up to 599px wide. Filled in by Task 4.` with:

```scss
// Phone: up to 599px wide. Full-bleed (no card frame, 16px gutters), larger
// body type than desktop for reading at arm's length, 16px inputs (iOS Safari
// zooms the page on focus below 16px), and 44px touch targets. The sticky
// footer is in index.scss; the 1-column grids are in form.scss.
@media (max-width: 599px) {
  .onboarding-app__ui {
    --ob-gutter: 16px;
    --ob-main-max: none;
    --ob-card-max: none;
    --ob-wide-max: none;
    --ob-card-top: 24px;
    --ob-card-pad: 0px;
    --ob-gap-lead: 24px;
    --ob-gap-block: 20px;
    --ob-gap-inline: 16px;
    --ob-fs-title: 22px;
    --ob-fs-heading: 17px;
    --ob-fs-btn: 15px;
    --ob-fs-body: 14px;
    --ob-fs-input: 16px;
    --ob-ctl-h: 44px;
    --ob-chip-h: 44px;
    --ob-tap-min: 44px;
    --ob-logo-w: 136px;
    --ob-logo-h: 27px;
    --ob-logo-box-w: 136.3px;
    --ob-logo-box-h: 28.7px;
  }
}
```

- [ ] **Step 4: Viewport height and sticky footer in `index.scss`**

In `&__ui`, replace `height: 100vh;` with:

```scss
    // dvh: on mobile, 100vh includes the area behind the browser's toolbar,
    // which would hide the sticky footer. 100vh stays as the fallback.
    height: 100vh;
    height: 100dvh;
```

Immediately before `@keyframes ob-btn-spin`, add:

```scss
// Phones, and anything short enough that the buttons could fall below the
// fold (a landscape phone is tablet-wide but only ~375px tall): pin the
// action row to the bottom of the scroll container (__main), so the options
// scroll up from behind it instead of pushing it out of reach. __main's bottom
// padding goes to 0 so the sticky edge is the screen edge.
@media (max-width: 599px), (max-height: 500px) {
  .onboarding-app__main {
    padding-bottom: 0;
  }

  .onboarding-app__footer {
    position: sticky;
    bottom: 0;
    z-index: 2;
    padding: 12px 0 calc(12px + env(safe-area-inset-bottom));
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(8px);
  }
}
```

- [ ] **Step 5: Columns, wrapping and phone rules in `form.scss`**

Directly after `.onboarding-app__option-grid[data-cols="3"] { --ob-cols: 3; }`, add:

```scss
// Tablet: the 3-up industry grid drops to 2. Same specificity as the rule
// above, so source order decides: these must stay below it.
@media (max-width: 1023px) {
  .onboarding-app__option-grid[data-cols="3"] { --ob-cols: 2; }
}

// Phone: one column, except team size, whose labels are a few characters.
@media (max-width: 599px) {
  .onboarding-app__option-grid[data-cols] { --ob-cols: 1; }
  .onboarding-app__option-grid[data-grid="team_size"] { --ob-cols: 2; }
}
```

In `.onboarding-app__option-chip`, replace `white-space: nowrap;` with:

```scss
  // Wrap, at every width: a long translated label grows the row instead of
  // running out of a grid cell. The right padding clears the check badge.
  white-space: normal;
  overflow-wrap: anywhere;
```

and change its `padding: var(--ob-chip-pad-y) var(--ob-chip-pad-x);` to `padding: var(--ob-chip-pad-y) 30px var(--ob-chip-pad-y) var(--ob-chip-pad-x);`.

In `.onboarding-app__summary-badge`, replace `white-space: nowrap;` with:

```scss
  white-space: normal;
  overflow-wrap: anywhere;
```

At the end of `form.scss`, add:

```scss
/* ============================================
   Phone-only adjustments (≤ 599px)
   ============================================ */
@media (max-width: 599px) {
  // One column: the industry chips read left-aligned like every other list,
  // not centred in a cell the width of the screen.
  .onboarding-app__option-grid[data-cols="3"] .onboarding-app__option-chip {
    text-align: left;
    padding: var(--ob-chip-pad-y) 30px var(--ob-chip-pad-y) var(--ob-chip-pad-x);
  }

  // A truncated goal label hides the answer on a narrow screen; let it wrap.
  .onboarding-app__goal-label {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }
}
```

- [ ] **Step 6: Add to the test script**

In `package.json`, change the `test` script to:

```json
    "test": "node tests/load-modules.js && node tests/resume.test.js && node tests/render.test.js && node tests/grid.test.js && node tests/desktop-size.test.js && node tests/responsive.test.js"
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test 2>&1 | tail -4`
Expected: `grid.test.js`, `desktop-size.test.js` and `responsive.test.js` each print `all assertions passed`.

If a PHONE tap-target assertion fails on `.onboarding-app__back-btn` or `.onboarding-app__secondary-btn`, check that their `min-height` is `var(--ob-ctl-h)` (Task 3, Step 4). Do not weaken the 44px assertion.

- [ ] **Step 8: Commit**

```bash
git add app/skin/vars.scss app/skin/index.scss app/skin/form.scss tests/responsive.test.js package.json
git commit -m "feat(onboarding): tablet and phone layouts, sticky actions on small screens"
```

---

### Task 5: Visual pass and production checks

**Files:**
- Create: `tests/snapshots.js` (screenshot helper for human review; not part of `npm test`)

**Interfaces:**
- Consumes: `renderStep`, `page`, `withBrowser` and `show` (Task 1).
- Produces: PNG screenshots in a scratch directory for a person to look at. Nothing in code depends on them.

- [ ] **Step 1: Write the screenshot helper**

Create `tests/snapshots.js`:

```js
// Not a test: writes one PNG per step per viewport so a person can eyeball
// the layout. Usage: node tests/snapshots.js <out-dir>
const fs = require('node:fs');
const path = require('node:path');
const { page, withBrowser, show } = require('./harness');
const { renderStep } = require('./render');

const OUT = process.argv[2];
if (!OUT) { console.error('usage: node tests/snapshots.js <out-dir>'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = {
  phone: { width: 375, height: 812 },
  landscape: { width: 812, height: 375 },
  tablet: { width: 768, height: 1024 },
  laptop: { width: 1280, height: 800 },
  desktop: { width: 1440, height: 900 },
};

(async () => {
  await withBrowser(async (browser) => {
    for (const [name, vp] of Object.entries(VIEWPORTS)) {
      for (let s = 0; s <= 7; s++) {
        const p = await show(browser, page(renderStep(s, {
          data: { industry: 'healthcare', team_size: '2_10', goal: 'manage_projects' },
        })), vp);
        await p.screenshot({ path: path.join(OUT, `${name}-step${s}.png`) });
        await p.close();
      }
    }
  });
  console.log('wrote', fs.readdirSync(OUT).length, 'screenshots to', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Generate and review the screenshots**

Run: `node tests/snapshots.js /tmp/ob-snapshots`
Expected: `wrote 40 screenshots to /tmp/ob-snapshots`

Open these and confirm by eye:
- `phone-step1.png`: one-column industry list.
- `phone-step5.png`: challenges, with the buttons pinned at the bottom.
- `landscape-step5.png`: buttons visible.
- `tablet-step1.png`: two columns.
- `desktop-step2.png`: visibly smaller than before.
- `phone-step7.png`: done screen.

The renderer stubs fonts with `system-ui`, so compare proportions and layout, not typefaces.

- [ ] **Step 3: Re-check the production viewport meta**

Run: `curl -sk --max-time 8 https://drumee.in/ | grep -io '<meta[^>]*viewport[^>]*>'`
Expected: `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">`

If it is missing, stop and report it. The phone tier can't fire without it, and the fix belongs in the page that serves the desk, not in this repo.

- [ ] **Step 4: Full suite**

Run: `npm test 2>&1 | tail -6`
Expected: every test file prints its `all assertions passed` line, and `load-modules.js` prints `ALL MODULES EXECUTE CLEANLY`.

- [ ] **Step 5: Commit**

```bash
git add tests/snapshots.js
git commit -m "test(onboarding): screenshot helper for the responsive layouts"
```

- [ ] **Step 6: Hand off for a live check**

Tell the person to deploy the plugin to stage (outside this plan) and open the wizard with `localStorage.setItem('force-onboarding', 1)` on a non-onboarded test account. Check it on:
- a real phone, portrait and landscape
- a tablet, or a desktop browser in device mode
- a desktop at 100% zoom

Things to watch:
- Tapping an input on iOS must not zoom the page.
- The sticky buttons must clear the home indicator.
