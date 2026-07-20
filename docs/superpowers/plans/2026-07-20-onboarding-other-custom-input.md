# Onboarding "Other → type your own" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the user picks "Other" on the Industry, Role, or Tools onboarding screens, reveal a single-line text input for a custom value and persist it.

**Architecture:** Three repos. `loby` gets two new nullable columns (`industry_other`, `role_other`) plus procedure/service changes to store them; Tools reuses the existing JSON array (custom string as an array element). `onboarding-ui` reveals the input in place via a dedicated part (no full-form rebuild), gates Continue on non-empty custom text for the required steps, and encodes the payloads. `ui-team` gets a new locale key (the UI also carries an inline English fallback so it works regardless).

**Tech Stack:** MariaDB stored procedures (loby), Node service layer (loby), Drumee `Skeletons`/`LetcBox` client framework (onboarding-ui), plain Node `assert` tests, SCSS.

## Global Constraints

- **Wire keys must match DB enum checks.** `industry`/`role` values still must be one of their fixed enum keys (incl. `other`); custom text goes only in the new `*_other` columns. (`app/skeleton/toolkit/form.js:1-2`)
- **DB changes need patching to live instances** — merge does not apply them. Patch via `bin/patch-from-file <file> <db_class>` and sweep all instances. Onboarding tables are **not** provisioned locally; validate SQL in a scratch DB (general_ci collation locally).
- **One routine per SQL file** (loby/schemas convention). Always `DROP ... IF EXISTS` before `CREATE`; input params prefixed `_`.
- **No full-form rebuild for in-step UI changes** — re-feed only the affected part, mirroring `_refreshInviteList` (`app/main.js:55-61`).
- **Locale via inline fallback idiom:** `LOCALE.KEY || 'literal'`. The global `LOCALE` is sourced centrally from `ui-team/locale/*.json`, not the local `app/locale/*.json`.
- **BEM family is pinned** (`figName`); use `ui.fig.family` for class prefixes.
- **Branch per repo:** when a repo has uncommitted/feature changes, create a new branch from its base (`test` for onboarding-ui) before committing. Do not commit the unrelated pre-existing `app/skin/index.scss` change.
- **Custom tools encoding:** raw string element in the JSON array (`["notion","Airtable"]`); the bare `other` marker is dropped when custom text is present.
- **Out of scope:** propagating custom industry/role text into the YP profile (`update_profile` still sends `industry='other'`/`role='other'`); Team size.

---

## Task 1: loby — add `industry_other` / `role_other` columns

**Files:**
- Create: `/home/drumee/loby/schemas/patches/alter_onboarding_responses_other.sql`
- Modify: `/home/drumee/loby/schemas/tables/onboarding_responses.sql:19-24`

**Interfaces:**
- Produces: columns `onboarding_responses.industry_other VARCHAR(255) NULL`, `onboarding_responses.role_other VARCHAR(255) NULL`.

- [ ] **Step 1: Create the migration patch**

Create `/home/drumee/loby/schemas/patches/alter_onboarding_responses_other.sql`:

```sql
-- File: loby/schemas/patches/alter_onboarding_responses_other.sql
-- Adds free-text custom values captured when the user picks "Other" on the
-- industry / role onboarding steps. Idempotent-ish: guard with IF NOT EXISTS
-- where the server's MariaDB supports it; otherwise run once per instance.

ALTER TABLE onboarding_responses
  ADD COLUMN industry_other VARCHAR(255) NULL AFTER industry,
  ADD COLUMN role_other     VARCHAR(255) NULL AFTER role;
```

- [ ] **Step 2: Update the canonical table definition**

In `/home/drumee/loby/schemas/tables/onboarding_responses.sql`, add the two columns immediately after their base columns. Change lines 19-24 from:

```sql
    industry VARCHAR(32) NULL
        COMMENT 'tech_software | creative_marketing | consulting_agency | legal_compliance | finance_accounting | healthcare | education | real_estate | ecommerce_retail | media_content | operations | other',

    -- Step 3: role
    role VARCHAR(32) NULL
        COMMENT 'founder_ceo | manager_team_lead | executive_associate | freelancer_consultant | other',
```

to:

```sql
    industry VARCHAR(32) NULL
        COMMENT 'tech_software | creative_marketing | consulting_agency | legal_compliance | finance_accounting | healthcare | education | real_estate | ecommerce_retail | media_content | operations | other',
    industry_other VARCHAR(255) NULL
        COMMENT 'Free-text value when industry = other',

    -- Step 3: role
    role VARCHAR(32) NULL
        COMMENT 'founder_ceo | manager_team_lead | executive_associate | freelancer_consultant | other',
    role_other VARCHAR(255) NULL
        COMMENT 'Free-text value when role = other',
```

- [ ] **Step 3: Validate in a scratch DB**

```bash
mysql -e "CREATE DATABASE IF NOT EXISTS scratch_ob CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci"
mysql scratch_ob < /home/drumee/loby/schemas/tables/onboarding_responses.sql
mysql scratch_ob -e "DESCRIBE onboarding_responses" | grep -E "industry|role"
```
Expected: rows for `industry`, `industry_other`, `role`, `role_other`.

- [ ] **Step 4: Commit (loby, on a feature branch)**

```bash
cd /home/drumee/loby
git rev-parse --abbrev-ref HEAD   # note base branch
git checkout -b feat/onboarding-other-custom-input
git add schemas/patches/alter_onboarding_responses_other.sql schemas/tables/onboarding_responses.sql
git commit -m "feat(onboarding): add industry_other/role_other columns

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: loby — procedures accept & surface the custom values

**Files:**
- Modify: `/home/drumee/loby/schemas/procedures/save_onboarding_industry.sql`
- Modify: `/home/drumee/loby/schemas/procedures/save_onboarding_role.sql`
- Modify: `/home/drumee/loby/schemas/procedures/get_onboarding_response.sql:22-38`

**Interfaces:**
- Consumes: columns from Task 1.
- Produces:
  - `save_onboarding_industry(_session_id VARCHAR(128), _industry VARCHAR(32), _industry_other VARCHAR(255))`
  - `save_onboarding_role(_session_id VARCHAR(128), _role VARCHAR(32), _role_other VARCHAR(255))`
  - `get_onboarding_response` SELECT now includes `industry_other`, `role_other`.

- [ ] **Step 1: Rewrite `save_onboarding_industry.sql`**

```sql
-- File: loby/schemas/procedures/save_onboarding_industry.sql

DROP PROCEDURE IF EXISTS `save_onboarding_industry`;

DELIMITER $$

CREATE PROCEDURE `save_onboarding_industry`(
    IN _session_id     VARCHAR(128) CHARACTER SET ascii,
    IN _industry       VARCHAR(32),
    IN _industry_other VARCHAR(255)
)
BEGIN
    IF _session_id IS NULL OR _session_id = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'session_id is required';
    END IF;

    IF _industry NOT IN (
        'tech_software','creative_marketing','consulting_agency','legal_compliance',
        'finance_accounting','healthcare','education','real_estate',
        'ecommerce_retail','media_content','operations','other'
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid industry value';
    END IF;

    UPDATE onboarding_responses
    SET industry       = _industry,
        industry_other = IF(_industry = 'other', NULLIF(TRIM(_industry_other), ''), NULL),
        mtime          = UNIX_TIMESTAMP()
    WHERE session_id = _session_id;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Onboarding session not found. Start at step 1.';
    END IF;
END$$

DELIMITER ;
```

- [ ] **Step 2: Rewrite `save_onboarding_role.sql`**

```sql
-- File: loby/schemas/procedures/save_onboarding_role.sql

DROP PROCEDURE IF EXISTS `save_onboarding_role`;

DELIMITER $$

CREATE PROCEDURE `save_onboarding_role`(
    IN _session_id VARCHAR(128) CHARACTER SET ascii,
    IN _role       VARCHAR(32),
    IN _role_other VARCHAR(255)
)
BEGIN
    IF _session_id IS NULL OR _session_id = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'session_id is required';
    END IF;

    IF _role NOT IN (
        'founder_ceo','manager_team_lead','executive_associate',
        'freelancer_consultant','other'
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid role value';
    END IF;

    UPDATE onboarding_responses
    SET role       = _role,
        role_other = IF(_role = 'other', NULLIF(TRIM(_role_other), ''), NULL),
        mtime      = UNIX_TIMESTAMP()
    WHERE session_id = _session_id;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Onboarding session not found. Start at step 1.';
    END IF;
END$$

DELIMITER ;
```

- [ ] **Step 3: Add columns to `get_onboarding_response.sql` SELECT**

In `/home/drumee/loby/schemas/procedures/get_onboarding_response.sql`, add `industry_other` and `role_other` to the SELECT list right after their base columns:

```sql
        industry,
        industry_other,
        role,
        role_other,
        team_size,
```

- [ ] **Step 4: Validate in the scratch DB**

```bash
for f in save_onboarding_industry save_onboarding_role get_onboarding_response; do
  mysql scratch_ob < /home/drumee/loby/schemas/procedures/$f.sql && echo "$f OK"
done
mysql scratch_ob -e "INSERT INTO onboarding_responses(session_id,firstname,ctime) VALUES('s1','A',UNIX_TIMESTAMP())"
mysql scratch_ob -e "CALL save_onboarding_industry('s1','other','Robotics & Drones')"
mysql scratch_ob -e "CALL save_onboarding_industry('s1','other','')"
mysql scratch_ob -e "SELECT industry, industry_other FROM onboarding_responses WHERE session_id='s1'"
mysql scratch_ob -e "CALL save_onboarding_industry('s1','healthcare','stale')"
mysql scratch_ob -e "SELECT industry, industry_other FROM onboarding_responses WHERE session_id='s1'"
```
Expected: after row 2, `industry_other` is NULL (empty trimmed → NULL); after the non-other call, `industry='healthcare'` and `industry_other=NULL` (cleared).

- [ ] **Step 5: Commit**

```bash
cd /home/drumee/loby
git add schemas/procedures/save_onboarding_industry.sql schemas/procedures/save_onboarding_role.sql schemas/procedures/get_onboarding_response.sql
git commit -m "feat(onboarding): persist industry_other/role_other in save/get procs

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: loby — service layer passes the new params

**Files:**
- Modify: `/home/drumee/loby/service/onboarding.js:76-97`

**Interfaces:**
- Consumes: procedures from Task 2.
- Produces: `save_industry` sends `industry_other`; `save_role` sends `role_other`. `save_tools` unchanged (already forwards the array).

- [ ] **Step 1: Update `save_industry`**

Replace lines 76-84 (`async save_industry() { ... }`) with:

```js
  async save_industry() {
    const sessionId = this.input.sid();
    const industry = this.input.need('industry');
    const industryOther = this.input.get('industry_other') || null;
    await this.db.await_proc(
      `${this.app_db}.save_onboarding_industry`,
      sessionId, industry, industryOther
    );
    this.output.data({ success: true, message: 'Industry saved.', data: {} });
  }
```

- [ ] **Step 2: Update `save_role`**

Replace lines 89-97 (`async save_role() { ... }`) with:

```js
  async save_role() {
    const sessionId = this.input.sid();
    const role = this.input.need('role');
    const roleOther = this.input.get('role_other') || null;
    await this.db.await_proc(
      `${this.app_db}.save_onboarding_role`,
      sessionId, role, roleOther
    );
    this.output.data({ success: true, message: 'Role saved.', data: {} });
  }
```

- [ ] **Step 3: Sanity-check syntax**

```bash
cd /home/drumee/loby && node -e "require('./service/onboarding.js'); console.log('loads OK')"
```
Expected: `loads OK` (or, if the module has framework-time side effects, no syntax error). If it throws on missing framework globals, instead run `node --check service/onboarding.js` and expect no output.

- [ ] **Step 4: Commit**

```bash
cd /home/drumee/loby
git add service/onboarding.js
git commit -m "feat(onboarding): forward industry_other/role_other to save procs

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: onboarding-ui — pure helpers with tests (TDD)

**Files:**
- Create: `/home/drumee/onboarding-ui/app/lib/other-option.js`
- Test: `/home/drumee/onboarding-ui/test/other-option.test.js`

**Interfaces:**
- Produces:
  - `isOtherComplete(value: string, otherText: string): boolean`
  - `buildToolsPayload(tools: string[], otherText: string): string[]`
  - `OTHER_KEY = 'other'`

- [ ] **Step 1: Write the failing test**

Create `/home/drumee/onboarding-ui/test/other-option.test.js`:

```js
const assert = require('assert');
const { isOtherComplete, buildToolsPayload } = require('../app/lib/other-option');

// isOtherComplete — gating for required single-select steps
assert.strictEqual(isOtherComplete('', ''), false, 'no selection');
assert.strictEqual(isOtherComplete('tech_software', ''), true, 'concrete value, no text needed');
assert.strictEqual(isOtherComplete('other', ''), false, 'other, empty text -> blocked');
assert.strictEqual(isOtherComplete('other', '   '), false, 'other, whitespace -> blocked');
assert.strictEqual(isOtherComplete('other', 'Robotics'), true, 'other, real text -> ok');

// buildToolsPayload — custom string replaces the bare "other" marker
assert.deepStrictEqual(buildToolsPayload(['notion', 'slack'], ''), ['notion', 'slack'], 'no other selected');
assert.deepStrictEqual(buildToolsPayload(['notion', 'other'], 'Airtable'), ['notion', 'Airtable'], 'other replaced by text');
assert.deepStrictEqual(buildToolsPayload(['other'], ''), [], 'other with empty text dropped');
assert.deepStrictEqual(buildToolsPayload(['other'], '  Airtable '), ['Airtable'], 'trimmed');
assert.deepStrictEqual(buildToolsPayload([], 'x'), [], 'other not selected -> text ignored');

console.log('other-option.test.js: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/drumee/onboarding-ui && node test/other-option.test.js
```
Expected: FAIL — `Cannot find module '../app/lib/other-option'`.

- [ ] **Step 3: Write minimal implementation**

Create `/home/drumee/onboarding-ui/app/lib/other-option.js`:

```js
// Shared logic for the "Other → type your own" custom option on the
// industry / role / tools onboarding steps.

const OTHER_KEY = 'other';

/**
 * Whether a single-select step whose value may be "other" is complete enough
 * to advance. A concrete (non-"other") value is complete on its own; "other"
 * additionally requires non-empty custom text.
 */
function isOtherComplete(value, otherText) {
  if (!value) return false;
  if (value !== OTHER_KEY) return true;
  return !!(otherText && otherText.trim());
}

/**
 * Build the tools array sent to save_onboarding_tools. When "other" is
 * selected with non-empty text, the trimmed string replaces the bare "other"
 * marker; an empty custom value drops "other" entirely.
 */
function buildToolsPayload(tools, otherText) {
  const list = Array.isArray(tools) ? tools : [];
  const custom = (otherText || '').trim();
  const out = list.filter((t) => t !== OTHER_KEY);
  if (list.includes(OTHER_KEY) && custom) out.push(custom);
  return out;
}

module.exports = { OTHER_KEY, isOtherComplete, buildToolsPayload };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /home/drumee/onboarding-ui && node test/other-option.test.js
```
Expected: `other-option.test.js: all assertions passed`.

- [ ] **Step 5: Commit**

```bash
cd /home/drumee/onboarding-ui
git add app/lib/other-option.js test/other-option.test.js
git commit -m "feat(onboarding): add other-option helpers (gating + tools payload)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: onboarding-ui — reveal the input in the skeleton

**Files:**
- Modify: `/home/drumee/onboarding-ui/app/skeleton/toolkit/form.js` (`buildOptionGrid` at 69-100; `tools_form` at 139-237; add helpers)

**Interfaces:**
- Consumes: nothing from earlier UI tasks (rendering only).
- Produces (exported from `form.js`, re-exported by `toolkit/index.js`):
  - `other_region(ui, field: string): Skeleton[]`
  - `tools_other_region(ui): Skeleton[]`

- [ ] **Step 1: Add the input + region helpers**

In `/home/drumee/onboarding-ui/app/skeleton/toolkit/form.js`, immediately above `buildOptionGrid` (line 69), add:

```js
// The free-text input revealed when an "Other" option is active. Reuses the
// __input-field styling; name is "<field>_other" so getData() surfaces it.
function other_input(ui, field) {
  const pfx = ui.fig.family;
  const otherField = `${field}_other`;
  return Skeletons.Entry({
    className: `${pfx}__input-field ${pfx}__other-input`,
    name: otherField,
    value: ui._data[otherField] || '',
    formItem: otherField,
    innerClass: otherField,
    mode: _a.interactive,
    service: _a.input,
    placeholder: LOCALE.ONBOARDING_OTHER_PLACEHOLDER || 'Please specify…',
    uiHandler: [ui],
    state: 0,
    radio: ui._id,
  });
}

// Contents of the "<field>-other" part for single-select steps (industry,
// role): the reveal input when "other" is selected, else empty. Returned as an
// array so main.js can re-feed just this region in place.
export function other_region(ui, field) {
  return (ui._data[field] || '') === 'other' ? [other_input(ui, field)] : [];
}

// Contents of the "tools-other" part for the multi-select tools step: revealed
// when the "other" chip is toggled on.
export function tools_other_region(ui) {
  return (ui._data.tools || []).includes('other') ? [other_input(ui, 'tools')] : [];
}
```

- [ ] **Step 2: Append the reveal part to `buildOptionGrid`**

Replace the `return` of `buildOptionGrid` (lines 96-99) with:

```js
  return Skeletons.Box.Y({
    className: `${pfx}__form-section`,
    kids: [
      Skeletons.Box.Y({ className: `${pfx}__option-grid`, kids }),
      Skeletons.Box.Y({
        className: `${pfx}__other-region`,
        sys_pn: `${field}-other`,
        kids: other_region(ui, field),
      }),
    ]
  });
```

- [ ] **Step 3: Append the reveal part to `tools_form`**

In `tools_form`, insert a new kid right after the `tool-chips-wrap` `Box.X` (the block ending at line 222, before the `tools-divider` Element at 223):

```js
      Skeletons.Box.Y({
        className: `${pfx}__other-region`,
        sys_pn: 'tools-other',
        kids: tools_other_region(ui),
      }),
```

- [ ] **Step 4: Verify the module parses**

```bash
cd /home/drumee/onboarding-ui && npx babel app/skeleton/toolkit/form.js > /dev/null && echo "form.js parses"
```
Expected: `form.js parses` (Babel is a devDependency; if `npx babel` is unavailable, run `node --check` after a manual `require` is not possible for ESM `export` — rely on the build in Task 8's harness instead).

- [ ] **Step 5: Commit**

```bash
cd /home/drumee/onboarding-ui
git add app/skeleton/toolkit/form.js
git commit -m "feat(onboarding): render Other free-text reveal in option/tools forms

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: onboarding-ui — wire state, gating, refresh, and commit

**Files:**
- Modify: `/home/drumee/onboarding-ui/app/main.js` (import at top; `checkForm` 112-148; `commitForm` 166-282; `onUiEvent` 345-488; `_captureStep` 319-327; add `_refreshOtherInput`)

**Interfaces:**
- Consumes: `isOtherComplete`, `buildToolsPayload` (Task 4); `other_region`, `tools_other_region` (Task 5).
- Produces: full runtime behavior.

- [ ] **Step 1: Import the helpers**

At the top of `app/main.js`, below the existing `require('./lib/email')` (line 4), add:

```js
const { isOtherComplete, buildToolsPayload } = require('./lib/other-option');
```

- [ ] **Step 2: Gate Continue on Industry/Role in `checkForm`**

Replace case 1 and case 2 in `checkForm` (lines 122-127) with:

```js
      case 1: // Industry
        if (isOtherComplete(this._data.industry, this._data.industry_other)) completed = 1;
        break;
      case 2: // Role
        if (isOtherComplete(this._data.role, this._data.role_other)) completed = 1;
        break;
```

- [ ] **Step 3: Add `_refreshOtherInput` and capture in `_captureStep`**

Add this method to the class (e.g. right after `_refreshInviteList`, line 61):

```js
  /**
   * Re-render only the "<field>-other" reveal region in place after a
   * selection/toggle change, and focus the input when it appears. Mirrors
   * _refreshInviteList — avoids a full-form rebuild / scroll reset.
   */
  _refreshOtherInput(field) {
    const { other_region, tools_other_region } = require('./skeleton/toolkit');
    this.ensurePart(`${field}-other`).then((p) => {
      p.clear();
      let kids = field === 'tools' ? tools_other_region(this) : other_region(this, field);
      p.feed(kids);
      if (kids.length && this.el) {
        let input = this.el.querySelector(`[name="${field}_other"]`);
        if (input) input.focus();
      }
    });
  }
```

Replace `_captureStep` (lines 319-327) with:

```js
  _captureStep() {
    let data = this.getData() || {};
    if (data.firstname != null && data.firstname.trim()) {
      this._data.firstname = data.firstname.trim();
    }
    if (data.challenge_text != null) {
      this._data.challenge_text = data.challenge_text;
    }
    if (data.industry_other != null) this._data.industry_other = data.industry_other;
    if (data.role_other != null) this._data.role_other = data.role_other;
    if (data.tools_other != null) this._data.tools_other = data.tools_other;
  }
```

- [ ] **Step 4: Persist custom values in `commitForm`**

Replace case 1 (industry, lines 181-187) with:

```js
      case 1: // Industry
        {
          if (args.industry_other != null) this._data.industry_other = args.industry_other;
          let payload = { industry: this._data.industry };
          if (this._data.industry === 'other') {
            payload.industry_other = (this._data.industry_other || '').trim();
          }
          this.postService(
            SERVICE.onboarding.save_industry, payload, SVC_OPT
          ).then(advance).catch(advance);
        }
        break;
```

Replace case 2 (role, lines 189-195) with:

```js
      case 2: // Role
        {
          if (args.role_other != null) this._data.role_other = args.role_other;
          let payload = { role: this._data.role };
          if (this._data.role === 'other') {
            payload.role_other = (this._data.role_other || '').trim();
          }
          this.postService(
            SERVICE.onboarding.save_role, payload, SVC_OPT
          ).then(advance).catch(advance);
        }
        break;
```

In case 4 (tools, lines 205-225), capture `tools_other` and build the payload via the helper. Change the opening of the block:

```js
      case 4: // Tools + challenges. Free-text comes from the form via getData().
        {
          if (args.challenge_text != null) {
            this._data.challenge_text = args.challenge_text;
          }
          if (args.tools_other != null) {
            this._data.tools_other = args.tools_other;
          }
          let tools = buildToolsPayload(this._data.tools || [], this._data.tools_other);
```

(Leave the rest of case 4 — `challenges`, `note`, the two `postService` calls — unchanged.)

- [ ] **Step 5: Refresh the reveal on select/toggle and capture on input**

In `onUiEvent`, replace the `select-option` case (lines 386-401) with:

```js
      case 'select-option':
        {
          let field = cmd.el ? cmd.el.dataset.field : (args.field || '');
          let value = cmd.el ? cmd.el.dataset.value : (args.value || '');
          if (field && value) {
            this._data[field] = value;
            this._selectOption(field, value);
            if (field === 'industry' || field === 'role') {
              this._refreshOtherInput(field);
            }
            this.checkForm();
          }
        }
        break;
```

Replace the `toggle-tool` case (lines 403-411) with:

```js
      case 'toggle-tool':
        {
          let value = cmd.el ? cmd.el.dataset.value : '';
          if (value) {
            this._toggleArrayField('tools', value);
            this._toggleChip(cmd, (this._data.tools || []).includes(value));
            if (value === 'other') this._refreshOtherInput('tools');
          }
        }
        break;
```

Replace the `_a.input` case (lines 465-467) with:

```js
      case _a.input:
        this._captureStep();
        this.checkForm();
        break;
```

- [ ] **Step 6: Verify main.js parses**

```bash
cd /home/drumee/onboarding-ui && node --check app/main.js && echo "main.js OK"
```
Expected: `main.js OK`.

- [ ] **Step 7: Commit**

```bash
cd /home/drumee/onboarding-ui
git add app/main.js
git commit -m "feat(onboarding): gate, capture, refresh and persist Other custom values

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: onboarding-ui — style the reveal

**Files:**
- Modify: `/home/drumee/onboarding-ui/app/skin/form.scss` (append after the `__input-field` block, line 91)

**Interfaces:**
- Consumes: classes `__other-region`, `__other-input` emitted by Task 5.

- [ ] **Step 1: Append the SCSS**

After line 91 (the close of `.onboarding-app__input-field`), add:

```scss
/* ============================================
   "Other" free-text reveal (industry / role / tools)
   ============================================ */
.onboarding-app__other-region {
  width: 100%;
}

.onboarding-app__other-input {
  margin-top: 12px;
}
```

- [ ] **Step 2: Verify SCSS compiles**

```bash
cd /home/drumee/onboarding-ui/app && sass -I . -I skin --no-source-map skin/index.scss /tmp/claude-1000/ob-form-check.css && echo "scss OK"
```
Expected: `scss OK` (per the ui SCSS visual-verify approach). If `index.scss` does not import `form.scss` directly, compile `skin/form.scss` standalone instead.

- [ ] **Step 3: Commit**

```bash
cd /home/drumee/onboarding-ui
git add app/skin/form.scss
git commit -m "feat(onboarding): style the Other free-text reveal

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: ui-team — add the placeholder locale key

**Files:**
- Modify: `/home/drumee/ui-team/locale/en.json`, `es.json`, `fr.json`, `km.json`, `ru.json`, `zh.json` (near the `ONBOARDING_*` block, ~line 1934)

**Interfaces:**
- Produces: `LOCALE.ONBOARDING_OTHER_PLACEHOLDER`. The UI already falls back to `'Please specify…'`, so this task is translation polish, not a functional dependency.

- [ ] **Step 1: Add the key to each locale file**

After the `ONBOARDING_NAME_PLACEHOLDER` line in each file, add `ONBOARDING_OTHER_PLACEHOLDER` with the translation:

- `en.json`: `"ONBOARDING_OTHER_PLACEHOLDER": "Please specify…",`
- `fr.json`: `"ONBOARDING_OTHER_PLACEHOLDER": "Veuillez préciser…",`
- `es.json`: `"ONBOARDING_OTHER_PLACEHOLDER": "Especifique…",`
- `zh.json`: `"ONBOARDING_OTHER_PLACEHOLDER": "请说明…",`
- `ru.json`: `"ONBOARDING_OTHER_PLACEHOLDER": "Уточните…",`
- `km.json`: `"ONBOARDING_OTHER_PLACEHOLDER": "សូមបញ្ជាក់…",`

(Use `ONBOARDING_NAME_PLACEHOLDER` as the anchor line in each file — its neighbors may differ.)

- [ ] **Step 2: Validate JSON**

```bash
cd /home/drumee/ui-team/locale && for f in en es fr km ru zh; do node -e "JSON.parse(require('fs').readFileSync('$f.json','utf8')); console.log('$f OK')"; done
```
Expected: `en OK` … `zh OK`.

- [ ] **Step 3: Commit (ui-team, feature branch)**

```bash
cd /home/drumee/ui-team
git checkout -b feat/onboarding-other-placeholder 2>/dev/null || git checkout feat/onboarding-other-placeholder
git add locale/en.json locale/es.json locale/fr.json locale/km.json locale/ru.json locale/zh.json
git commit -m "i18n(onboarding): add ONBOARDING_OTHER_PLACEHOLDER

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Patch live databases & end-to-end check

**Files:** none (deployment).

- [ ] **Step 1: Patch every loby instance**

Per the schemas patching workflow, apply the ALTER and the three procedures to all live loby DBs (not just local). From the loby schemas dir:

```bash
# Column migration (run once per instance):
bin/patch-from-file schemas/patches/alter_onboarding_responses_other.sql <db_name_or_class>
# Procedures (idempotent DROP+CREATE):
bin/patch-from-file schemas/procedures/save_onboarding_industry.sql <db_name_or_class>
bin/patch-from-file schemas/procedures/save_onboarding_role.sql     <db_name_or_class>
bin/patch-from-file schemas/procedures/get_onboarding_response.sql  <db_name_or_class>
```
If loby uses its own patch tooling, use that; the requirement is: **columns + all three procedures applied to every instance.** Note: this local box only serves local instances — production DBs (e.g. drumee.in) are not reachable here and must be patched wherever they run.

- [ ] **Step 2: Manual end-to-end smoke (built UI)**

Run the wizard (dev build), and for Industry, Role, and Tools:
1. Pick "Other" → the text input appears and receives focus.
2. Industry/Role: Continue stays disabled until text is typed; typing enables it.
3. Advance, then reload/resume → the custom text is restored (via `get_onboarding_response`).
4. Verify the stored row:

```bash
mysql <loby_db> -e "SELECT industry, industry_other, role, role_other, current_tools FROM onboarding_responses ORDER BY mtime DESC LIMIT 1"
```
Expected: `industry_other`/`role_other` hold the typed text; `current_tools` includes the custom string (no bare `other`).

- [ ] **Step 3: Final verification of the helper test**

```bash
cd /home/drumee/onboarding-ui && node test/other-option.test.js && node test/email.test.js
```
Expected: both print "all assertions passed" / "all assertions passed".

---

## Self-Review Notes

- **Spec coverage:** table cols (T1) ✓; procs incl. get_response (T2) ✓; service layer (T3) ✓; tools JSON encoding (T4 `buildToolsPayload`, T6 case 4) ✓; reveal input + parts (T5) ✓; gating/capture/refresh/commit (T6) ✓; skin (T7) ✓; locale key + inline fallback (T5 fallback, T8) ✓; DB patching (T9) ✓; profile left as-is / Team size untouched (Global Constraints, out of scope) ✓.
- **Type consistency:** `other_region(ui, field)` / `tools_other_region(ui)` used identically in T5 (defined) and T6 (`_refreshOtherInput`). `isOtherComplete` / `buildToolsPayload` signatures match between T4 and T6. Part `sys_pn` names `"<field>-other"` / `"tools-other"` consistent between T5 render and T6 `ensurePart`. Input `name`/`formItem` `"<field>_other"` consistent between T5 and T6 capture.
