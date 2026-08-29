# Remove Invite Step + Organization-Name Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the invite step from the onboarding wizard (7 question steps, not 8) and rebuild the final "You're all set, {name}" screen to match Figma 155:47483, adding a field that names the user's organization and a "Create your organization" action.

**Architecture:** Two repos. `onboarding-ui` loses the whole invite step (skeleton, controller branches, styles, the `lib/email.js` helper) and its done screen is restyled and given an organization-name form. `loby` gains one nullable column plus a procedure/service/ACL entry so the typed name is recorded on the onboarding row like every other answer. Actual organization provisioning reuses the existing `adminpanel.create_organisation` service, reached the way `contact.invite` already is — a `src: owner` service called with an explicit `hub_id`.

**Tech Stack:** Drumee `Skeletons`/`LetcBox` client framework (onboarding-ui), SCSS, MariaDB stored procedures + Node service layer (loby). No test runner in onboarding-ui — verification is module execution, SCSS compilation, plain `node:assert` scripts for pure logic, and a headless-chromium measurement harness.

**Spec:** Figma "Drumee 2.0" `3LDZYKjL7uHpXHdXKwAXxZ`
- Done screen (target): node `155:47483`
- Progress-bar evidence for a 7-step flow: `155:47112` (1 of 7 filled), `155:47287` (6 of 7), `155:47398` (7 of 7)

---

## Global Constraints

- **The design has SEVEN question steps.** All three earlier frames render 7 progress segments; the goals screen shows all 7 filled. `TOTAL_STEPS = 8` and `MAX_STEP = 8` are the invite step and must both become 7. This is the single most load-bearing fact in the plan — verify it before changing anything else.
- **Wire keys must match the DB enum checks** in `loby/schemas/procedures/save_onboarding_*.sql`. Nothing in this plan renames one. (`app/skeleton/toolkit/form.js:14-15`)
- **DB changes need patching to live instances** — merge is not deploy. Patch with `bin/patch-from-file <file> <db_class>` and sweep every instance. Onboarding tables are **not** provisioned on this box; validate SQL in a scratch DB (local collation is `general_ci`).
- **One routine per SQL file** (loby/schemas convention). Always `DROP ... IF EXISTS` before `CREATE`; input params prefixed `_`.
- **Locale idiom is `loc(KEY, 'literal')`**, never `LOCALE[KEY] || fallback` — an absent key makes `LOCALE` echo the key name back, which is truthy, so `||` never fires and the key name renders on screen. (`app/lib/locale-text.js`)
- **New copy takes a NEW locale key.** Deployed endpoints carry 1.0 wording under the existing keys and a populated row beats the fallback. Same reason `ONBOARDING_USERNAME_PLACEHOLDER` exists.
- **BEM family is pinned** via `figName`; always build classes from `ui.fig.family`.
- **Re-feed parts, never the whole form,** for in-step updates — a full rebuild discards what the user typed. Mirror `_refreshOtherInput` / `_refreshError`.
- **Design tokens already exist** in `app/skin/vars.scss` (`--ob-radius-btn: 12px`, `--ob-radius-field: 8px`, `--ob-gap-*`, the short-viewport media queries). Reuse them; do not hardcode px that a token already covers.
- **Branch before committing.** onboarding-ui base is `test`; loby base is its own default. onboarding-ui currently has uncommitted 2.0 design work — commit or branch it first, and do not fold it into these commits.
- **Out of scope:** deleting the `invites` column, the `save_invites` / `send_onboarding_invites` services, or `service/templates/onboarding-invite.html`. Those hold historical funnel data and are addressed in Task 12 as a decision, not a deletion.

---

## File Structure

**onboarding-ui — modified**
| File | Responsibility after this plan |
|---|---|
| `app/skeleton/index.js` | Step switch: 7 cases + done. Loses `case 7`. |
| `app/skeleton/toolkit/header.js` | `TOTAL_STEPS = 7`; titles table loses the invite row; tips machinery removed (Task 4). |
| `app/skeleton/toolkit/footer.js` | Loses `case 7`; back-button gate becomes `step < 7`. |
| `app/skeleton/toolkit/form.js` | Loses `invite_form` / `invite_list`; gains `org_form` (Task 8) and the restyled `done_form` (Task 7). |
| `app/main.js` | Loses ~15 invite methods and 4 switch branches; gains `_createOrganisation` (Task 9). |
| `app/lib/resume.js` | `MAX_STEP = 7`. |
| `app/skin/form.scss` | Loses invite rules; gains `__org-*` rules. |
| `app/skin/vars.scss` | Gains the done-screen tokens from 155:47483. |

**onboarding-ui — deleted**
| File | Why |
|---|---|
| `app/lib/email.js` | Only consumer is the invite step. |

**onboarding-ui — created**
| File | Responsibility |
|---|---|
| `tests/resume.test.js` | Plain `node:assert` coverage for the `MAX_STEP` clamp. |
| `tests/load-modules.js` | Executes every skeleton module — catches TDZ/import-order faults a parse check cannot. |

**loby — created / modified**
| File | Responsibility |
|---|---|
| `schemas/migrations/alter_onboarding_responses_organisation.sql` | Adds `organisation_name`. |
| `schemas/procedures/save_onboarding_organisation.sql` | Persists it. |
| `schemas/tables/onboarding_responses.sql` | Column documented in the canonical table. |
| `schemas/procedures/get_onboarding_response.sql` | Returns the new column. |
| `service/onboarding.js` | `save_organisation` handler. |
| `acl/onboarding.json` | `save_organisation` reachability entry. |

---

## Task 1: Verification harness (do this first)

There is no test runner in this repo. Every later task's "verify" step depends on these two scripts, so they come first.

**Files:**
- Create: `/home/drumee/onboarding-ui/tests/load-modules.js`
- Create: `/home/drumee/onboarding-ui/tests/harness.js`

**Interfaces:**
- Produces: `node tests/load-modules.js` — exits non-zero if any skeleton module fails to execute.
- Produces: `tests/harness.js` exporting `page(bodyHtml)` and `measure(html, selectors)`. Tasks 7 and 8 call these instead of rebuilding a harness by hand.

- [ ] **Step 1: Write the loader**

Create `/home/drumee/onboarding-ui/tests/load-modules.js`:

```js
// Executes every skeleton module. `@babel/core transformFileSync` only PARSES —
// it accepts a const read before its initializer, which is how a temporal-dead-
// zone bug (require placed below the table that uses it) reached the browser
// once already. Running the module body is the only thing that catches it.
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');
const Module = require('module');

const root = path.resolve(__dirname, '..');
const orig = Module._extensions['.js'];
Module._extensions['.js'] = function (mod, filename) {
  if (filename.includes('node_modules')) return orig(mod, filename);
  const out = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename,
    presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' } }]],
    babelrc: false, configFile: false,
  });
  mod._compile(out.code, filename);
};

// Framework globals. Throwing proxies, so a module-load-time read fails loudly
// instead of silently returning undefined.
for (const g of ['Skeletons', 'LOCALE', '_a', '_K', '_', 'Visitor', 'bootstrap',
                 'SERVICE', 'LetcBox', 'Organization']) {
  if (!(g in global)) {
    global[g] = new Proxy({}, {
      get(t, k) { throw new Error(`module-load-time read of ${g}.${String(k)}`); },
    });
  }
}

const mods = [
  'app/skeleton/toolkit/icons.js',
  'app/skeleton/toolkit/logo.js',
  'app/skeleton/toolkit/form.js',
  'app/skeleton/toolkit/header.js',
  'app/skeleton/toolkit/footer.js',
  'app/skeleton/toolkit/button.js',
  'app/skeleton/toolkit/index.js',
  'app/skeleton/index.js',
];
for (const m of mods) {
  require(path.join(root, m));
  console.log('loaded ok:', m);
}
console.log('ALL MODULES EXECUTE CLEANLY');
```

- [ ] **Step 2: Run it against the current tree**

```bash
cd /home/drumee/onboarding-ui && node tests/load-modules.js
```

Expected: eight `loaded ok:` lines then `ALL MODULES EXECUTE CLEANLY`. If it fails now, the tree is already broken — stop and fix that before proceeding.

- [ ] **Step 3: Confirm the SCSS baseline compiles**

```bash
cd /home/drumee/onboarding-ui && npx sass --no-source-map --load-path=app/skin app/skin/index.scss /dev/null && echo "SCSS ok"
```

Expected: `SCSS ok`.

- [ ] **Step 4: Write the render harness**

Create `/home/drumee/onboarding-ui/tests/harness.js`:

```js
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
```

- [ ] **Step 5: Smoke-test the harness**

```bash
cd /home/drumee/onboarding-ui && node -e "
const {page,measure}=require('./tests/harness');
measure(page('<div class=\"onboarding-app__ui\"><div class=\"onboarding-app__main\"></div></div>'),
  {ui:'.onboarding-app__ui'}).then(r=>console.log(JSON.stringify(r)));"
```

Expected: JSON with a `ui` box 1440 wide and `_overflow: 0`.

- [ ] **Step 6: Commit**

```bash
git add tests/load-modules.js tests/harness.js
git commit -m "test(onboarding): add module-execution and render harnesses"
```

---

## Task 2: `resume.js` — MAX_STEP 8 → 7

The done screen moves from index 8 to index 7. `resumeStep` clamps the stored index to `MAX_STEP`, so leaving it at 8 would let a returning user land one past the last screen.

**Files:**
- Modify: `/home/drumee/onboarding-ui/app/lib/resume.js:20`
- Create: `/home/drumee/onboarding-ui/tests/resume.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `MAX_STEP === 7`. Consumed by `main.js:_advance` and `resumeStep`.

- [ ] **Step 1: Write the failing test**

Create `/home/drumee/onboarding-ui/tests/resume.test.js`:

```js
const assert = require('node:assert');
const { resumeStep, MAX_STEP, firstIncompleteStep } = require('../app/lib/resume');

// A complete set of mandatory answers, so the clamp is the only thing under test.
const answered = {
  firstname: 'Alex', industry: 'healthcare', role: 'founder_ceo', team_size: '2_10',
};

assert.strictEqual(MAX_STEP, 7, 'MAX_STEP must be the done-screen index (7 steps: 0-6)');
assert.strictEqual(resumeStep('7', answered), 7, 'the done screen is reachable');
assert.strictEqual(resumeStep('8', answered), 7, 'a stale index from the 8-step build clamps to done');
assert.strictEqual(resumeStep('99', answered), 7, 'garbage clamps to done');
assert.strictEqual(resumeStep('-1', answered), 0, 'negative clamps to the first step');

// The clamp must still never jump a mandatory gap.
assert.strictEqual(resumeStep('7', { firstname: 'Alex' }), 1, 'stops at the first unanswered mandatory step');
assert.strictEqual(firstIncompleteStep({ firstname: 'Alex' }), 1);

console.log('resume.test.js: all assertions passed');
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd /home/drumee/onboarding-ui && node tests/resume.test.js
```

Expected: FAIL — `MAX_STEP must be the done-screen index (7 steps: 0-6)`, actual 8.

- [ ] **Step 3: Make the change**

In `app/lib/resume.js`, replace the `MAX_STEP` block:

```js
// Index of the final "done" screen. 7 since the invite step was removed —
// the flow is name(0) industry(1) role(2) team(3) tools(4) challenges(5)
// goals(6), and the design's progress bar shows exactly seven segments
// (Figma 155:47398 renders all 7 filled on the last question screen).
//
// A step index stored by an earlier build is clamped here rather than
// trusted: an 8 from the invite-era build reads as the done screen, which is
// correct — that user had finished every question.
const MAX_STEP = 7;
```

- [ ] **Step 4: Run the test again**

```bash
cd /home/drumee/onboarding-ui && node tests/resume.test.js
```

Expected: `resume.test.js: all assertions passed`.

- [ ] **Step 5: Commit**

```bash
git add app/lib/resume.js tests/resume.test.js
git commit -m "fix(onboarding): the done screen is step 7, not 8"
```

---

## Task 3: Header — 7 segments, drop the invite title

**Files:**
- Modify: `/home/drumee/onboarding-ui/app/skeleton/toolkit/header.js:14-37`

**Interfaces:**
- Consumes: `MAX_STEP` semantics from Task 2.
- Produces: `TOTAL_STEPS === 7`; `STEP_TITLES` has 7 entries; `isDone` is `step >= 7`.

- [ ] **Step 1: Drop the invite row from the titles table**

Delete this line from `STEP_TITLES`:

```js
  ['ONBOARDING_INVITE_TEAM',             'Invite your team members'],
```

- [ ] **Step 2: Retarget TOTAL_STEPS**

Replace the `TOTAL_STEPS` block:

```js
// One segment per question screen. Seven — matching the design's progress bar
// (Figma 155:47112 fills 1 of 7, 155:47287 fills 6, 155:47398 fills all 7).
// Was 8 while the flow carried an invite step.
const TOTAL_STEPS = 7;
```

- [ ] **Step 3: Verify the modules still execute**

```bash
cd /home/drumee/onboarding-ui && node tests/load-modules.js
```

Expected: `ALL MODULES EXECUTE CLEANLY`.

- [ ] **Step 4: Commit**

```bash
git add app/skeleton/toolkit/header.js
git commit -m "feat(onboarding): seven progress segments, no invite title"
```

---

## Task 4: Header — remove the now-dead tips machinery

Reviewable independently of Task 3: after the invite row goes, `STEP_TIPS_KEYS` is entirely empty strings, so `tips` is always `''` and `__header-copy` always renders a single child. The design carries no tip line on any screen.

**Files:**
- Modify: `/home/drumee/onboarding-ui/app/skeleton/toolkit/header.js:19-33, 61-66, 101-127`
- Modify: `/home/drumee/onboarding-ui/app/skin/index.scss` (`&__tips` block)

**Interfaces:**
- Produces: `header(ui)` emits `__header-lead` + `__header-copy`(title only). `__header-copy` is retained — it is what keeps the card's 48px lead gap from applying to the title.

- [ ] **Step 1: Delete the `STEP_TIPS_KEYS` array** (the whole `const STEP_TIPS_KEYS = [ ... ];` block).

- [ ] **Step 2: Drop the tips lookup**

Replace:

```js
  const tipsKey = STEP_TIPS_KEYS[step];
  let title = titleEntry ? loc(titleEntry[0], titleEntry[1]) : '';
  title = title.replace('{0}', userName);
  let tips = (tipsKey && LOCALE[tipsKey]) || '';
```

with:

```js
  let title = titleEntry ? loc(titleEntry[0], titleEntry[1]) : '';
  title = title.replace('{0}', userName);
```

- [ ] **Step 3: Drop the tips node**

Replace the `copyKids` construction with:

```js
    if (!hasInlineTitle) {
      // Its own box so the header's 48px gap separates the question from the
      // logo/progress lead. A single child today; the wrapper stays because
      // that gap is what it exists to control.
      headerKids.push(
        Skeletons.Box.Y({
          className: `${fig}__header-copy`,
          kids: [
            Skeletons.Note({ className: `${fig}__title`, content: title }),
          ],
        })
      );
    }
```

- [ ] **Step 4: Remove the dead style**

Delete the `&__tips { ... }` block from `app/skin/index.scss`.

- [ ] **Step 5: Verify**

```bash
cd /home/drumee/onboarding-ui \
  && node tests/load-modules.js \
  && npx sass --no-source-map --load-path=app/skin app/skin/index.scss /dev/null && echo "SCSS ok" \
  && ! grep -rn "STEP_TIPS_KEYS\|__tips" app/ && echo "no dead tips refs"
```

Expected: modules load, `SCSS ok`, `no dead tips refs`.

- [ ] **Step 6: Commit**

```bash
git add app/skeleton/toolkit/header.js app/skin/index.scss
git commit -m "refactor(onboarding): drop the tips line, unused on every 2.0 screen"
```

---

## Task 5: Skeleton switch + footer — drop the invite branches

**Files:**
- Modify: `/home/drumee/onboarding-ui/app/skeleton/index.js:1-45`
- Modify: `/home/drumee/onboarding-ui/app/skeleton/toolkit/footer.js:114-135, 157`

**Interfaces:**
- Consumes: `TOTAL_STEPS = 7` (Task 3).
- Produces: step 7 falls through to `done_form`; the back-button row covers steps 1-6.

- [ ] **Step 1: Remove the invite case from the step switch**

In `app/skeleton/index.js`, delete `invite_form,` from the destructured require, and delete:

```js
    case 7:
      content = invite_form(ui);
      break;
```

- [ ] **Step 2: Remove the invite footer case**

In `app/skeleton/toolkit/footer.js`, delete the whole `case 7:` block (the "Send invites" primary + "Skip this step" secondary, and its leading comment).

- [ ] **Step 3: Retarget the back-button gate**

Replace:

```js
  if (step > 0 && step < 8 && kids.length) {
```

with:

```js
  // Every question screen except the first gets a Back button beside its
  // primary action. 7 is the done screen, which has no way back.
  if (step > 0 && step < 7 && kids.length) {
```

- [ ] **Step 4: Verify**

```bash
cd /home/drumee/onboarding-ui && node tests/load-modules.js \
  && ! grep -n "invite_form" app/skeleton/index.js && echo "switch clean"
```

Expected: modules load, `switch clean`.

- [ ] **Step 5: Commit**

```bash
git add app/skeleton/index.js app/skeleton/toolkit/footer.js
git commit -m "feat(onboarding): remove the invite step from the skeleton and footer"
```

---

## Task 6: Controller + form + styles — delete the invite implementation

The largest deletion. `main.js` alone carries ~102 invite references.

**Files:**
- Modify: `/home/drumee/onboarding-ui/app/main.js` (lines listed below)
- Modify: `/home/drumee/onboarding-ui/app/skeleton/toolkit/form.js` (`invite_form`, `invite_list`)
- Modify: `/home/drumee/onboarding-ui/app/skin/form.scss` (invite rules)
- Delete: `/home/drumee/onboarding-ui/app/lib/email.js`

**Interfaces:**
- Produces: `main.js` with no invite state and no `case 7` in `checkForm` / `commitForm` / `_skipStepOnce` / `onUiEvent`.

- [ ] **Step 1: Delete the skeleton builders**

In `app/skeleton/toolkit/form.js`, delete `export function invite_form(ui)` and `export function invite_list(ui)` in full, and remove the `require` of `../../lib/email` if present.

- [ ] **Step 2: Delete the controller state**

In `app/main.js` `initialize()`, delete the `_invitesSent`, `_sentInvites` and `_inviteError` initialisations (lines ~40-49) with their comments.

- [ ] **Step 3: Delete the invite methods**

Delete these methods in full, with their doc comments:
`_refreshInviteList` (160), `_scrollInviteListToEnd` (178), `_clearInviteInput` (253), `_afterInvitesSent` (651), `_saveInvites` (676), `_sayInvitesSent` (705), `_dropNoticeClose` (742), `_commitInvites` (763).

Keep `_setSubmitLoading` (268) — Task 9 reuses it for the organization button.

- [ ] **Step 4: Delete the switch branches**

Remove `case 7:` from `checkForm` (~360), from `commitForm` (~467) including the `_afterInvitesSent()` call, and from `_skipStepOnce` (~548). In `onUiEvent`, delete the `add-invite` and `remove-invite` handlers (~1044-1082) and the `this._step === 7 && this._invitesSent` close-guard (~1104), which becomes unreachable.

- [ ] **Step 5: Delete the email helper**

```bash
cd /home/drumee/onboarding-ui && git rm app/lib/email.js
```

- [ ] **Step 6: Delete the invite styles**

In `app/skin/form.scss` remove the whole "Invite form" section: `__invite-info`, `__invite-error`, `__invite-error + __invited-list`, `__invite-input-row`, `__invite-email`, `__invite-add-btn`, `__invited-list`, `__invited-row`, `__invited-email`, `__invited-remove`.

- [ ] **Step 7: Verify nothing references the removed code**

```bash
cd /home/drumee/onboarding-ui \
  && node tests/load-modules.js \
  && node tests/resume.test.js \
  && npx sass --no-source-map --load-path=app/skin app/skin/index.scss /dev/null && echo "SCSS ok" \
  && ! grep -rni "invite" app/ && echo "no invite references remain"
```

Expected: modules load, assertions pass, `SCSS ok`, `no invite references remain`. If the last grep still matches, the hit is the leftover — fix it rather than loosening the grep.

- [ ] **Step 8: Commit**

```bash
git add -A app/
git commit -m "feat(onboarding): remove the invite step implementation"
```

---

## Task 7: Restyle the done screen to Figma 155:47483

Structure from the design: logo row (centred), 48px gap, then a 464px column with a 40px gap between four blocks — check badge + title (16px gap, centred), badges (centred, wrap, 12px gap), the organization form (Task 8), the button.

**Files:**
- Modify: `/home/drumee/onboarding-ui/app/skin/vars.scss` (new tokens)
- Modify: `/home/drumee/onboarding-ui/app/skin/form.scss` (`__done-*`, `__summary-*`)
- Modify: `/home/drumee/onboarding-ui/app/skeleton/toolkit/form.js` (`done_form`)

**Interfaces:**
- Produces: `done_form(ui)` emitting `__done-section` → `__done-head` (badge + title), `__summary-badges`, `__org-section` (Task 8 fills this).

- [ ] **Step 1: Add the design tokens**

In `app/skin/vars.scss`, inside `.onboarding-app__ui`, after the shape tokens:

```scss
  // Done screen (Figma 155:47483). The success badge is Signal/Success at 15%,
  // and the column is 464px wide there rather than the 472px the question
  // screens use.
  --ob-done-badge-size: 70px;
  --ob-done-icon-size: 39px;
  --ob-done-col: 464px;
  --ob-gap-done: 40px;
```

- [ ] **Step 2: Rewrite the done-screen styles**

Replace the `__done-section` / `__done-icon` / `__done-title` / `__summary-badges` / `__summary-badge` rules in `app/skin/form.scss` with:

```scss
.onboarding-app__done-section {
  width: 100%;
  max-width: var(--ob-done-col);
  margin: 0 auto;
  gap: var(--ob-gap-done);
  padding-top: 0;
}

/* Check badge + headline, centred as one block (Figma 155:47493). */
.onboarding-app__done-head {
  width: 100%;
  align-items: center;
  gap: 16px;
}

.onboarding-app__done-icon {
  width: var(--ob-done-badge-size);
  height: var(--ob-done-badge-size);
  border-radius: 100px;
  background: var(--ob-done-icon-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    display: block;
    width: var(--ob-done-icon-size);
    height: var(--ob-done-icon-size);
  }
}

.onboarding-app__done-title {
  width: 100%;
  font-family: var(--font-bold);
  font-size: 32px;
  font-weight: 600;
  line-height: 1.1;
  color: var(--ob-title);
  text-align: center;
}

/* Answer summary. Wraps, centred, 12px apart (Figma 155:47499). */
.onboarding-app__summary-badges {
  width: 100%;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.onboarding-app__summary-badge {
  padding: 8px 20px;
  border-radius: var(--ob-radius-field);
  background: var(--ob-badge-bg);
  color: var(--ob-option-text-active);
  font-family: var(--font-main);
  font-size: 14px;
  line-height: 1.4;
  white-space: nowrap;
}
```

- [ ] **Step 3: Add the success glyph to `icons.js` (before it is referenced)**

The 39px check is Signal/Success `#54B684`, not the `#5950FF` CheckCircle already in `icons.js`. Fetch the design's asset:

```bash
cd /home/drumee/onboarding-ui
curl -sSL -o /tmp/done-check.svg "https://www.figma.com/api/mcp/asset/36cb48dd-2816-4f21-94e4-71e0d7b0c682.svg"
```

Append it to `app/skeleton/toolkit/icons.js` as `CHECK_CIRCLE_SVG`, path data verbatim from that file, and add it to `module.exports`. Keep the requires at the TOP of any consuming file — `form.js` reads its icon constants at module scope, so a require placed below them is a temporal-dead-zone crash that kills every step, not just this one.

**The Figma asset URL expires ~7 days after this plan was written.** If `curl` returns nothing usable, re-fetch node `155:47495` with `get_design_context` rather than hand-drawing the glyph.

- [ ] **Step 4: Wrap the badge and title in `__done-head`**

In `done_form`, replace the flat `kids: [icon, title, tips, badges]` list with:

```js
  return Skeletons.Box.Y({
    className: `${pfx}__done-section`,
    kids: [
      Skeletons.Box.Y({
        className: `${pfx}__done-head`,
        kids: [
          Skeletons.Element({
            className: `${pfx}__done-icon`,
            content: CHECK_CIRCLE_SVG,
            active: 0,
          }),
          Skeletons.Note({
            className: `${pfx}__done-title`,
            content: loc('ONBOARDING_ALL_SET_V2', "You're all set, {0}").replace('{0}', userName),
          }),
        ],
      }),
      Skeletons.Box.X({
        className: `${pfx}__summary-badges`,
        kids: badgeKids,
      }),
    ]
  });
```

Delete the `__done-tips` node and its `.onboarding-app__done-tips` style — the design has no subtitle here.

- [ ] **Step 5: Verify**

```bash
cd /home/drumee/onboarding-ui \
  && node tests/load-modules.js \
  && npx sass --no-source-map --load-path=app/skin app/skin/index.scss /dev/null && echo "SCSS ok"
```

Expected: modules load, `SCSS ok`.

- [ ] **Step 6: Measure against the design**

```bash
cd /home/drumee/onboarding-ui && node -e "
const {page,measure}=require('./tests/harness');
const {CHECK_CIRCLE_SVG}=require('./app/skeleton/toolkit/icons');
const badges=['Tech / Software','10 - 50','Manage projects &amp; teams']
  .map(b=>'<div class=\"onboarding-app__summary-badge\">'+b+'</div>').join('');
const html=page(\`<div class='onboarding-app__ui'><div class='onboarding-app__main'>
<div class='onboarding-app__card'><div class='onboarding-app__done-section'>
 <div class='onboarding-app__done-head'>
  <div class='onboarding-app__done-icon'>\${CHECK_CIRCLE_SVG}</div>
  <div class='onboarding-app__done-title'>You&rsquo;re all set, Alex</div></div>
 <div class='onboarding-app__summary-badges'>\${badges}</div>
</div></div></div></div>\`);
measure(html,{sec:'.onboarding-app__done-section',head:'.onboarding-app__done-head',
 icon:'.onboarding-app__done-icon',glyph:'.onboarding-app__done-icon svg',
 title:'.onboarding-app__done-title',badges:'.onboarding-app__summary-badges',
 badge:'.onboarding-app__summary-badge'})
 .then(r=>console.log(JSON.stringify(r,null,1)));"
```

Assert against the design:

| element | expected |
|---|---|
| `icon` | 70 × 70, radius `100px`, background `rgba(84, 182, 132, 0.15)` |
| `glyph` | 39 × 39 |
| `title.y - (icon.y + 70)` | 16 |
| `title` | fontSize `32px`, color `rgb(67, 60, 197)` |
| `badges.y - (title.y + title.h)` | 40 |
| `sec.w` | 464 |
| `badge` | height 36 (8 + 19.6 + 8), radius `8px`, color `rgb(11, 10, 33)` |
| `_overflow` | 0 |

- [ ] **Step 7: Commit**

```bash
git add app/skin/vars.scss app/skin/form.scss app/skeleton/toolkit/form.js app/skeleton/toolkit/icons.js
git commit -m "feat(onboarding): restyle the done screen to Drumee 2.0"
```

---

## Task 8: The organization-name form (UI only)

**Files:**
- Modify: `/home/drumee/onboarding-ui/app/skeleton/toolkit/form.js` (`done_form`)
- Modify: `/home/drumee/onboarding-ui/app/skin/form.scss`
- Modify: `/home/drumee/onboarding-ui/app/skeleton/toolkit/footer.js` (done-screen button copy)

**Interfaces:**
- Consumes: `__done-section` from Task 7.
- Produces: an `Entry` named `organisation_name`, surfaced by `getData()`; button label "Create your organization".

- [ ] **Step 1: Add the form styles**

Append to `app/skin/form.scss`:

```scss
/* ============================================
   Organization name (done screen, Figma 169:6792)
   ============================================ */
.onboarding-app__org-section {
  width: 100%;
  gap: 12px;
}

.onboarding-app__org-label {
  width: 100%;
  font-family: var(--font-bold);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--ob-option-text-active);
}

/* Outlined, unlike the filled fields on the question screens: a hairline
   border on white rather than the lavender wash (Figma 169:6794). */
.onboarding-app__org-input {
  width: 100%;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--ob-radius-btn);
  padding: 12.5px;

  input {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    padding: 0;
    color: var(--ob-input-text);
    font-family: var(--font-main);
    font-size: 14px;
    line-height: 1.2;

    &::placeholder {
      color: var(--ob-input-placeholder);
    }
  }
}
```

- [ ] **Step 2: Emit the form**

Add as the third child of `__done-section` in `done_form`:

```js
      Skeletons.Box.Y({
        className: `${pfx}__org-section`,
        kids: [
          Skeletons.Note({
            className: `${pfx}__org-label`,
            content: loc('ONBOARDING_ORG_NAME_LABEL', 'Your organization name'),
            active: 0,
          }),
          Skeletons.Entry({
            className: `${pfx}__org-input`,
            name: 'organisation_name',
            value: ui._data.organisation_name || '',
            formItem: 'organisation_name',
            innerClass: 'organisation_name',
            mode: _a.interactive,
            service: _a.input,
            placeholder: loc('ONBOARDING_ORG_NAME_PLACEHOLDER', 'Type the name...'),
            uiHandler: [ui],
            state: 0,
            radio: ui._id,
          }),
        ],
      }),
```

Both keys are new, so `loc()` renders the design copy until locale rows land.

- [ ] **Step 3: Change the done-screen button**

In `footer.js`, in the `default:` case, replace the label and service:

```js
          content: loc('ONBOARDING_CREATE_ORG', 'Create your organization'),
          service: 'create-organisation',
          state: 0,
          dataset: { state: 0 },
```

Note `state: 0` — it starts disabled, matching every other step, and `checkForm()` lights it (Step 4). Add `const { loc } = require('../../lib/locale-text');` to `footer.js` if absent.

- [ ] **Step 4: Gate the button on a non-empty name**

In `main.js` `checkForm()`, add before `default:`:

```js
      // Done screen: the organization name is the one answer it collects.
      case 7: {
        let name = (this._data.organisation_name || '').trim();
        this.setItemState(_a.next, name ? 1 : 0);
        break;
      }
```

The `_a.input` handler already calls `_captureStep()` on every keystroke, but that method only copies the fields it knows about. Add the new one to it:

```js
    if (data.organisation_name != null) {
      this._data.organisation_name = data.organisation_name;
    }
```

Place it beside the existing `industry_other` / `role_other` / `tools_other` lines in `_captureStep()`. Note it is stored untrimmed — `checkForm` trims for the gate and `_createOrganisation` trims for the wire, so the user's cursor is not disturbed mid-word.

- [ ] **Step 5: Verify**

```bash
cd /home/drumee/onboarding-ui \
  && node tests/load-modules.js \
  && npx sass --no-source-map --load-path=app/skin app/skin/index.scss /dev/null && echo "SCSS ok"
```

Then re-run the Task 7 harness and assert: label 16px/600, input radius 12, padding 12.5, border `rgba(0,0,0,0.05)`, placeholder `rgb(101,101,108)`, label→input gap 12, button label "Create your organization".

- [ ] **Step 6: Commit**

```bash
git add app/skeleton/toolkit/form.js app/skeleton/toolkit/footer.js app/main.js app/skin/form.scss
git commit -m "feat(onboarding): add the organization-name form to the done screen"
```

---

## Task 9: loby — persist the organization name

Every other step records its answer on `onboarding_responses`. This one should too, independently of whether provisioning (Task 10) succeeds.

**Files:**
- Create: `/home/drumee/loby/schemas/migrations/alter_onboarding_responses_organisation.sql`
- Create: `/home/drumee/loby/schemas/procedures/save_onboarding_organisation.sql`
- Modify: `/home/drumee/loby/schemas/tables/onboarding_responses.sql`
- Modify: `/home/drumee/loby/schemas/procedures/get_onboarding_response.sql`
- Modify: `/home/drumee/loby/service/onboarding.js`
- Modify: `/home/drumee/loby/acl/onboarding.json`

**Interfaces:**
- Produces: `SERVICE.onboarding.save_organisation({ organisation_name })`; column `onboarding_responses.organisation_name VARCHAR(255) NULL`; `get_response` returns it so `hydrate()` can restore it.

- [ ] **Step 1: Write the migration**

Create `alter_onboarding_responses_organisation.sql`:

```sql
-- File: loby/schemas/migrations/alter_onboarding_responses_organisation.sql
--
-- The final screen now asks the user to name their organization. Recording it
-- on the onboarding row keeps the funnel complete -- every other step's answer
-- lands here -- and gives provisioning something to retry from if the
-- adminpanel call fails after the answer was given.
--
-- No AFTER clause, deliberately: naming a neighbouring column ties this
-- additive patch to whichever earlier migrations an instance happens to have
-- run. See alter_onboarding_responses_invites.sql for the failure that taught
-- us this.

ALTER TABLE `onboarding_responses`
  ADD COLUMN IF NOT EXISTS `organisation_name` VARCHAR(255) NULL
    COMMENT 'Organization name typed on the final onboarding screen';
```

- [ ] **Step 2: Write the procedure**

Create `/home/drumee/loby/schemas/procedures/save_onboarding_organisation.sql`:

```sql
-- File: loby/schemas/procedures/save_onboarding_organisation.sql
--
-- Records the organization name typed on the final onboarding screen.
--
-- _create = 1, matching every other save_onboarding_* procedure: the row is
-- resolved-or-created rather than required to exist. A bare UPDATE here would
-- raise "Onboarding session not found" whenever the session had rotated since
-- step 1, which is what permanently wedged the wizard before v3.

DROP PROCEDURE IF EXISTS `save_onboarding_organisation`;

DELIMITER $$

CREATE PROCEDURE `save_onboarding_organisation`(
    IN _session_id        VARCHAR(128) CHARACTER SET ascii,
    IN _uid               VARCHAR(16)  CHARACTER SET ascii,
    IN _organisation_name VARCHAR(255)
)
BEGIN
    DECLARE _rid INT UNSIGNED;

    -- Free text, so there is no enum to check. An all-whitespace value is
    -- stored as NULL so "typed nothing" and "never reached the screen" read
    -- the same way in the funnel.
    CALL onboarding_resolve_row(_session_id, _uid, 1, _rid);

    UPDATE onboarding_responses
    SET organisation_name = NULLIF(TRIM(_organisation_name), ''),
        mtime             = UNIX_TIMESTAMP()
    WHERE id = _rid;
END$$

DELIMITER ;
```

- [ ] **Step 2b: Exercise the procedure in the scratch DB**

After Step 3 has created the scratch schema, load `onboarding_resolve_row.sql` and this procedure into it, then:

```sql
CALL save_onboarding_organisation('sess-1', 'uid-1', '  Acme Corp  ');
SELECT organisation_name FROM onboarding_responses WHERE session_id = 'sess-1';
-- Expected: 'Acme Corp'  (trimmed)
CALL save_onboarding_organisation('sess-1', 'uid-1', '   ');
SELECT organisation_name FROM onboarding_responses WHERE session_id = 'sess-1';
-- Expected: NULL  (whitespace-only clears it)
```

- [ ] **Step 3: Validate the SQL in a scratch DB**

The onboarding tables are not provisioned on this box.

```bash
mysql -e "CREATE DATABASE IF NOT EXISTS scratch_onboarding COLLATE utf8mb4_general_ci;"
mysql scratch_onboarding < /home/drumee/loby/schemas/tables/onboarding_responses.sql
mysql scratch_onboarding < /home/drumee/loby/schemas/migrations/alter_onboarding_responses_organisation.sql
mysql -N -e "SHOW COLUMNS FROM scratch_onboarding.onboarding_responses LIKE 'organisation_name';"
```

Expected: one row naming `organisation_name`, `varchar(255)`, `YES` nullable.

- [ ] **Step 4: Document the column in the canonical table**

Add the column to `schemas/tables/onboarding_responses.sql` next to the other step columns, with a `-- Step 8: organization name` comment.

- [ ] **Step 5: Return it from `get_onboarding_response`**

Add `organisation_name` to that procedure's `SELECT` list, and add `take('organisation_name', row.organisation_name);` to `hydrate()` in `app/lib/resume.js` so a reload restores what was typed.

- [ ] **Step 6: Add the service handler and ACL entry**

In `service/onboarding.js`, add `save_organisation` following the shape of `save_industry` (`_identity()` first, then the proc call). In `acl/onboarding.json`, add the entry with `"scope": "hub"`, `"permission": {"src": "anonymous", "fast_check": "public-api"}` and the same `doc` string every other onboarding service carries — that wording explains why `src: owner` cannot be used here, and it must not be paraphrased.

- [ ] **Step 7: Verify the service module loads**

```bash
cd /home/drumee/loby && node -e "require('./service/onboarding.js'); console.log('loads OK')" \
  && node -e "JSON.parse(require('fs').readFileSync('acl/onboarding.json','utf8')); console.log('acl OK')"
```

Expected: `loads OK` (or, if framework globals are missing, fall back to `node --check service/onboarding.js` with no output) and `acl OK`.

- [ ] **Step 8: Commit (loby)**

```bash
cd /home/drumee/loby && git add -A && git commit -m "feat(onboarding): record the organization name on the response row"
```

---

## Task 10: Wire the button — persist, provision, enter

**Files:**
- Modify: `/home/drumee/onboarding-ui/app/main.js` (`_enterWorkspace` → `_createOrganisation`)

**Interfaces:**
- Consumes: `SERVICE.onboarding.save_organisation` (Task 9); `SERVICE.adminpanel.create_organisation`.
- Produces: the `create-organisation` service raised by the footer button.

**Why `adminpanel.create_organisation` is reachable here.** It is `scope: hub`, `permission: {src: owner}` (`admin-dash-server/acl/adminpanel.json:1176`). Onboarding requests carry no `hub_id`, so the ACL would resolve them against the endpoint's own hub — which the user does not own. `contact.invite` already solves this in this very file by passing `hub_id: Visitor.id` (`app/main.js:774`); the same trick applies. Two facts make a name-only form sufficient: `organisation_create` generates `ident` itself via `uniqueId()` when none is supplied (`yellow_page/procedures/organization/organisation_create.sql:46`), and organization names are deliberately **not** unique (`yellow_page/patches/2026-08-10-organisation-name-not-unique.sql`), so no availability check is needed.

- [ ] **Step 1: Replace `_enterWorkspace`**

```js
  /**
   * Final screen. Three server calls, in order, each gating the next:
   *   1. mark_complete   — refuses if a mandatory answer never landed
   *   2. save_organisation — records the typed name on the onboarding row
   *   3. adminpanel.create_organisation — provisions the org
   *
   * Only (1) can send the user backwards; the done screen has no Back button,
   * so a mark_complete refusal has to route them to the offending step or they
   * are trapped on a screen whose one button can only fail again.
   */
  async _createOrganisation() {
    this._clearError();
    this.setItemState(_a.next, 0);
    this._setSubmitLoading(true);

    let res = await this._call(SERVICE.onboarding.mark_complete, {});
    if (!res.ok) {
      const gap = firstIncompleteStep(this._data);
      this._setSubmitLoading(false);
      this._saveError = res.error;
      if (gap >= 0) this._step = gap;
      this.loadForm();
      return;
    }

    res = await this._call(SERVICE.onboarding.update_profile, {});
    if (!res.ok) return this._failOrgStep(res.error);

    const name = (this._data.organisation_name || '').trim();
    res = await this._call(SERVICE.onboarding.save_organisation, {
      organisation_name: name,
    });
    if (!res.ok) return this._failOrgStep(res.error);

    // hub_id is what makes this src:owner service resolvable from onboarding —
    // see contact.invite above. ident is omitted on purpose: organisation_create
    // mints one, and names are not required to be unique.
    res = await this._call(SERVICE.adminpanel.create_organisation, {
      name,
      hub_id: Visitor.id,
      nid: Visitor.get(_a.home_id),
    });
    if (!res.ok) return this._failOrgStep(res.error);

    localStorage.onboarding_step = "0";
    if (this.mget(_a.type) == 'app') {
      this.softDestroy();
      return;
    }
    window.location.href = '/';
  }

  /**
   * Report a done-screen failure in place. The user keeps their typed name and
   * can retry; nothing sends them backwards, because the answers are all fine.
   */
  _failOrgStep(message) {
    this._setSubmitLoading(false);
    this._saveError = message || this._fallbackError();
    this._refreshError();
    this.setItemState(_a.next, 1);
  }
```

- [ ] **Step 2: Point the service name at it**

In `onUiEvent`, rename the `'enter-workspace'` case to `'create-organisation'` and call `_createOrganisation()`.

- [ ] **Step 3: Verify**

```bash
cd /home/drumee/onboarding-ui \
  && node tests/load-modules.js \
  && ! grep -n "_enterWorkspace\|enter-workspace" app/ -r && echo "old handler gone"
```

Expected: modules load, `old handler gone`.

- [ ] **Step 4: Commit**

```bash
git add app/main.js
git commit -m "feat(onboarding): create the organization from the done screen"
```

---

## Task 11: Locale rows

**Files:**
- Modify: `/home/drumee/ui-team/locale/{en,es,fr,km,ru,zh}.json`

- [ ] **Step 1: Add the new keys**

`ONBOARDING_ORG_NAME_LABEL` ("Your organization name"), `ONBOARDING_ORG_NAME_PLACEHOLDER` ("Type the name..."), `ONBOARDING_CREATE_ORG` ("Create your organization"), `ONBOARDING_ALL_SET_V2` ("You're all set, {0}").

`ONBOARDING_ALL_SET_V2` is deliberately a new key: deployed endpoints carry the 1.0 wording under `ONBOARDING_ALL_SET`, and a populated row beats the inline fallback.

- [ ] **Step 2: Verify each file parses**

```bash
cd /home/drumee/ui-team/locale && for f in en es fr km ru zh; do \
  node -e "JSON.parse(require('fs').readFileSync('$f.json','utf8')); console.log('$f OK')"; done
```

Expected: six `OK` lines.

- [ ] **Step 3: Delete the invite keys**

Remove `ONBOARDING_INVITE_TEAM`, `ONBOARDING_SEND_INVITES`, `ONBOARDING_SKIP_THIS_STEP`, `ONBOARDING_INVITE_INFO`, `ONBOARDING_INVITES_SENT`, `ONBOARDING_WORKSPACE_READY`, `INVITE_PLACEHOLDER`, `ONBOARDING_ADD`. Leave `ALREADY_IN_LIST`, `CANNOT_ADD_SELF_AS_CONTACT`, `EMAIL_REQUIRED`, `INVALID_EMAIL_FORMAT` — grep first; the address book and share flows use them.

- [ ] **Step 4: Commit (ui-team)**

```bash
cd /home/drumee/ui-team && git add locale/ && git commit -m "feat(locale): organization-name keys; drop onboarding invite copy"
```

---

## Task 12: Deploy and decide the server-side leftovers

- [ ] **Step 1: Patch the DB**

```bash
cd /home/drumee/loby && bin/patch-from-file schemas/migrations/alter_onboarding_responses_organisation.sql <db_class>
cd /home/drumee/loby && bin/patch-from-file schemas/procedures/save_onboarding_organisation.sql <db_class>
cd /home/drumee/loby && bin/patch-from-file schemas/procedures/get_onboarding_response.sql <db_class>
```

Sweep every instance — merge is not deploy, and hand-applied procs drift from the repo. Diff the live proc before patching.

- [ ] **Step 2: Confirm `adminpanel` is mounted on the onboarding endpoint**

This is the plan's largest unverified assumption. In a browser on the onboarding endpoint:

```js
console.log(!!(window.SERVICE && SERVICE.adminpanel && SERVICE.adminpanel.create_organisation));
```

Expected: `true`. If `false`, Task 10's provisioning call cannot work from here and the options are: expose an equivalent under the `onboarding` ACL that calls `organisation_create` directly, or ship Tasks 1-9 (which persist the name) and provision from the desk on first load.

- [ ] **Step 3: Walk the flow**

Reset with `SERVICE.onboarding.reset`, then walk all seven steps. Confirm: 7 progress segments; the last question screen fills all 7; no invite screen; the done screen matches 155:47483; the button is disabled until a name is typed; after submitting, `onboarding_responses.organisation_name` holds it and `yp.organisation` has a new row owned by the user.

- [ ] **Step 4: Decide the leftovers (do not delete blind)**

Still present and now uncalled: `onboarding_responses.invites`, `save_onboarding_invites.sql`, the `save_invites` / `send_onboarding_invites` ACL entries and handlers, `service/templates/onboarding-invite.html`, `get_onboarding_invite_link`. They hold historical funnel data and the column is read by exports. Removing them is a data-retention decision for the owner, not a side effect of a UI change. Raise it; do not action it here.

---

## Open Decisions

1. **Is the organization name required?** This plan gates the button on non-empty, consistent with every other step. The design shows no skip affordance — but it also shows no way past the screen without creating an org, which means a user who does not want one is stuck. Confirm the intent.
2. **What happens when provisioning fails?** `organisation_create` signals `POOL_EMPTY` when no clean hub is available. Task 10 shows the error in place and re-enables the button. If the pool is empty that is an infinite retry — decide whether a "continue without an organization" escape is needed.
3. **Users who already have an organization.** ui-team's own form refuses when `Organization.get('domain_id') != 1` (`settings/organization/form/index.js:67`). The done screen should probably skip the form entirely for those users rather than let the call fail. Not covered by the design.
