# Done-Screen Organization Name Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Your organization name" field and a "Create your organization" action to the final "You're all set, {name}" screen, matching Figma 155:47483.

**Architecture:** Client-only. The whole server side already exists and is deployed — column, procedure, service handler, ACL entry and locale rows all landed earlier and are live on stage. What is missing is the field on the screen, the gate that lights the button, and the call chain behind it. The done screen is **step 7** (`TOTAL_STEPS = 7`, `MAX_STEP = 7`) — the invite step has been removed, so the flow is name(0) industry(1) role(2) team(3) tools(4) challenges(5) goals(6) and done(7).

**Tech Stack:** Drumee `Skeletons`/`LetcBox` client framework, SCSS. No test runner — verification is `tests/load-modules.js` (module execution), `tests/resume.test.js` (`node:assert`), `npx sass` compilation, and `tests/harness.js` (headless-chromium measurement).

**Spec:** Figma "Drumee 2.0" `3LDZYKjL7uHpXHdXKwAXxZ`, node `155:47483`. The org field is nodes `169:6792` (group), `169:6793` (label), `169:6794` (field), `169:6795` (placeholder).

---

## Already Done — Do Not Rebuild

Read this before starting. A previous pass built the server side and the screen's styling, and only the invite-step removal was reverted. These are in place:

| Thing | Where | State |
|---|---|---|
| `onboarding_responses.organisation_name` | loby migration | **Live on stage** (`1_c1d86df0c1d86df7`) |
| `save_onboarding_organisation` procedure | loby | **Live on stage**, verified: trims, whitespace → NULL |
| `get_onboarding_response` returns the column | loby | **Live on stage** |
| `save_organisation` service handler + ACL | loby `feat/onboarding-organisation-name` | Deployed to `/srv/drumee/runtime/plugins/server/huan/loby` |
| `ONBOARDING_ORG_NAME_LABEL` / `_PLACEHOLDER` / `ONBOARDING_CREATE_ORG` / `ONBOARDING_ALL_SET_V2` | ui-team `feat/onboarding-organisation-locale` | Committed, all six languages |
| Done-screen restyle (badge, `__done-head`, summary badges) | onboarding-ui `f868a4c` | On the branch |
| `DONE_CHECK_SVG` (39px `#54B684`) | `app/skeleton/toolkit/icons.js` | On the branch |
| `_call` guard for unresolvable services | `app/main.js:131` | On the branch |
| Verification harnesses | `tests/` | On the branch |
| Invite step removed | onboarding-ui `fc5440e` | Done — the flow is 7 screens + done |
| Save-error banner styles | `app/skin/form.scss` | Own section now, safe from step deletions |

**One live blocker, not a code change:** the stage server process started at 05:25 and the plugin carrying `save_organisation` was deployed at 11:09, so the running process has never read that ACL. Until it is restarted, `SERVICE.onboarding.save_organisation` is `undefined` on the client and the guard will report "That action is not available on this server yet." That is Task 5.

---

## Global Constraints

- **The done screen is index 7.** `TOTAL_STEPS = 7`, `MAX_STEP = 7`, `isDone = step >= 7`. Goals owns index 6. `tests/resume.test.js` asserts this — if it fails, the step count moved and every index below is wrong.
- **Locale idiom is `loc(KEY, 'literal')`**, never `LOCALE[KEY] || fallback` — `LOCALE` echoes an unknown key back, and the echo is truthy, so `||` never fires and the key name renders on screen. This is not hypothetical: it is why deleting the invite keys briefly made the invite step print `ONBOARDING_SEND_INVITES` as a button label.
- **Design tokens already exist** in `app/skin/vars.scss` (`--ob-radius-btn`, `--ob-radius-field`, `--ob-gap-done`, `--ob-done-col`, the short-viewport breakpoints). Reuse; do not hardcode a value a token covers.
- **Figma strokes borders INSIDE the box.** A CSS `border` adds to the box and pushes everything below it down. Use `box-shadow: inset 0 0 0 1px` — the option pills already do.
- **Re-feed parts, never the whole form,** for in-step updates; a rebuild discards what the user typed.
- **BEM family is pinned** via `figName`; build classes from `ui.fig.family`.
- **Branch:** onboarding-ui base is `test`; work continues on `feat/remove-invite-org-name`. loby and ui-team already have their branches and need no further commits.
- **Out of scope:** changing `mark_complete`'s required steps; anything about the `invites` column or the other server-side invite leftovers (they hold funnel history — a retention decision, not a side effect of this work).

---

## File Structure

| File | Change |
|---|---|
| `app/skin/vars.scss` | One token: the field's hairline border colour. |
| `app/skin/form.scss` | `__org-section` / `__org-label` / `__org-input` rules. |
| `app/skeleton/toolkit/form.js` | `done_form` gains the label + Entry. |
| `app/skeleton/toolkit/footer.js` | Done-screen button: label, service, starts disabled. |
| `app/main.js` | `_captureStep` picks up the field; `checkForm` case 7 gates the button; `_enterWorkspace` becomes `_createOrganisation`. |
| `app/lib/resume.js` | `hydrate` restores the field on reload. |

---

## Task 1: The field

**Files:**
- Modify: `app/skin/vars.scss` (after `--ob-gap-done`)
- Modify: `app/skin/form.scss` (append)
- Modify: `app/skeleton/toolkit/form.js` (`done_form`)

**Interfaces:**
- Produces: an `Entry` named `organisation_name`, surfaced by `getData()`; classes `__org-section`, `__org-label`, `__org-input`.

- [ ] **Step 1: Add the border token**

In `app/skin/vars.scss`, directly after `--ob-gap-done: 40px;`:

```scss
  // Overlay/light mode at 5% — the org field is outlined, not filled like the
  // question screens' inputs.
  --ob-org-input-border: rgba(0, 0, 0, 0.05);
```

- [ ] **Step 2: Add the styles**

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

.onboarding-app__org-input {
  width: 100%;
  background: transparent;
  border-radius: var(--ob-radius-btn);
  padding: 12.5px;
  // A flex row, as the design has it (169:6794). Without this the input is an
  // inline-block sitting on the parent's text baseline, and the descender space
  // under it adds a stray pixel to the field's height.
  display: flex;
  align-items: center;
  // Inset stroke, like the option pills: Figma draws this border INSIDE the
  // 464x42 box, so a real border would make the field 2px taller than the
  // design and nothing would line up below it.
  box-shadow: inset 0 0 0 1px var(--ob-org-input-border);

  input {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    padding: 0;
    color: var(--ob-input-text);
    font-family: var(--font-main);
    font-size: 14px;
    // 17px, not 1.2. An <input> will not take a line box shorter than its
    // font's own minimum, so the computed 16.8 rounded UP to 18 and the field
    // came out 43 instead of the design's 42. Figma's text node is 17.
    line-height: 17px;
    height: 17px;

    &::placeholder {
      color: var(--ob-input-placeholder);
    }
  }
}
```

- [ ] **Step 3: Emit it**

In `done_form`, add as the last child of `__done-section`, after the `__summary-badges` box:

```js
      // The one answer this screen collects. Both keys already exist in
      // ui-team/locale/*.json; loc() shows the design copy on any endpoint
      // that has not picked them up yet.
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

- [ ] **Step 4: Verify it compiles and loads**

```bash
cd /home/drumee/onboarding-ui \
  && node tests/load-modules.js \
  && npx sass --no-source-map --load-path=app/skin app/skin/index.scss /dev/null && echo "SCSS ok"
```

Expected: eight `loaded ok:` lines, `ALL MODULES EXECUTE CLEANLY`, `SCSS ok`.

- [ ] **Step 5: Measure against the design**

```bash
cd /home/drumee/onboarding-ui && node -e "
const {page,measure}=require('./tests/harness');
const html=page(\"<div class='onboarding-app__ui'><div class='onboarding-app__main'><div class='onboarding-app__done-section'><div class='onboarding-app__org-section'><div class='onboarding-app__org-label'>Your organization name</div><div class='onboarding-app__org-input'><input placeholder='Type the name...'></div></div></div></div></div>\");
measure(html,{org:'.onboarding-app__org-section',label:'.onboarding-app__org-label',input:'.onboarding-app__org-input'})
 .then(r=>console.log('label h',r.label.h,'| input h',r.input.h,'| input w',r.input.w,
   '| gap',+(r.input.y-(r.label.y+r.label.h)).toFixed(1),'| radius',r.input.radius));"
```

Expected, against Figma `169:6792` (group 464x73, label h 19, field 464x42 at y 31):

| measured | expect |
|---|---|
| `label h` | 19.2 (Figma rounds 16 × 1.2 down to 19) |
| `input h` | **42** — if this reads 43 or 45, the inset stroke or the `line-height: 17px` did not take |
| `input w` | 464 |
| `gap` | 12 |
| `radius` | 12px |

- [ ] **Step 6: Commit**

```bash
git add app/skin/vars.scss app/skin/form.scss app/skeleton/toolkit/form.js
git commit -m "feat(onboarding): add the organization-name field to the done screen"
```

---

## Task 2: Gate the button

**Files:**
- Modify: `app/skeleton/toolkit/footer.js:140-150` (the `default:` case)
- Modify: `app/main.js` (`_captureStep`, `checkForm` — the `default: // Done` arm)
- Modify: `app/lib/resume.js` (`hydrate`)

**Interfaces:**
- Consumes: the `organisation_name` Entry from Task 1.
- Produces: the `create-organisation` service, raised by a button that starts disabled.

- [ ] **Step 1: Change the button**

In `footer.js`, in the `default:` case, replace the content/service/state:

```js
      // Done screen. Starts disabled like every other step; checkForm() lights
      // it once an organization name has been typed.
      kids.push(
        Skeletons.Note({
          className: `${fig}__primary-btn`,
          sys_pn: _a.next,
          partHandler: [ui],
          content: loc('ONBOARDING_CREATE_ORG', 'Create your organization'),
          service: 'create-organisation',
          state: 0,
          reference: _a.state,
          dataset: { state: 0 },
        })
      );
```

Add `const { loc } = require('../../lib/locale-text');` at the top of `footer.js` if it is not already there.

- [ ] **Step 2: Capture the field on every keystroke**

`_captureStep()` copies only the fields it knows about. Add beside the `tools_other` line:

```js
    // Stored untrimmed: checkForm trims for the gate and _createOrganisation
    // trims for the wire, so the caret is not disturbed mid-word.
    if (data.organisation_name != null) {
      this._data.organisation_name = data.organisation_name;
    }
```

- [ ] **Step 3: Gate on a non-empty name**

In `checkForm`, replace `default: // Done` with an explicit case 7, keeping a default:

```js
      // Done screen: the organization name is the one answer it collects.
      case 7: {
        let orgName = data.organisation_name != null
          ? data.organisation_name
          : this._data.organisation_name;
        if ((orgName || '').trim()) completed = 1;
        break;
      }
      default:
        completed = 1;
        break;
```

- [ ] **Step 4: Restore it on reload**

In `app/lib/resume.js`, in `hydrate()`, beside the other `take` calls:

```js
  take('organisation_name', row.organisation_name);
```

`get_onboarding_response` already returns this column on stage, so a reload will repopulate the field.

- [ ] **Step 5: Verify**

```bash
cd /home/drumee/onboarding-ui \
  && node tests/load-modules.js && node tests/resume.test.js \
  && npx sass --no-source-map --load-path=app/skin app/skin/index.scss /dev/null && echo "SCSS ok"
```

Expected: modules load, `resume.test.js: all assertions passed` (it asserts `MAX_STEP === 7` — if that fails, someone changed the step count and this plan's index 7 is wrong), `SCSS ok`.

- [ ] **Step 6: Commit**

```bash
git add app/skeleton/toolkit/footer.js app/main.js app/lib/resume.js
git commit -m "feat(onboarding): gate the done screen on an organization name"
```

---

## Task 3: Wire the call chain

**Files:**
- Modify: `app/main.js` (`_enterWorkspace`, and its `enter-workspace` case in `onUiEvent`)

**Interfaces:**
- Consumes: `SERVICE.onboarding.save_organisation` (live on stage), `SERVICE.adminpanel.create_organisation`.
- Produces: `_createOrganisation()` and `_failOrgStep(message)`.

- [ ] **Step 1: Replace `_enterWorkspace`**

```js
  /**
   * Final screen. Four server calls, in order, each gating the next:
   *   1. mark_complete       — refuses if a mandatory answer never landed
   *   2. update_profile      — syncs the answers onto the YP profile
   *   3. save_organisation   — records the typed name on the onboarding row
   *   4. adminpanel.create_organisation — provisions the organization
   *
   * Only (1) can send the user backwards. The done screen has no Back button,
   * so a mark_complete refusal has to route them to the offending step or they
   * are trapped on a screen whose one button can only ever fail again. The
   * other three are failures of OUR side, not of their answers, so they report
   * in place and leave the user able to retry.
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

    // hub_id is what makes this src:owner service resolvable from onboarding.
    // Onboarding requests carry no hub_id, so the ACL would otherwise resolve
    // against the endpoint's own hub — which the user does not own, and every
    // call would be denied. contact/invite used the same trick before the
    // invite step was removed.
    //
    // ident is omitted deliberately: organisation_create mints one itself, and
    // organisation names are not required to be unique, so a name is enough.
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
   * Report a done-screen failure in place. The user keeps what they typed and
   * can retry; nothing sends them backwards, because their answers are fine.
   */
  _failOrgStep(message) {
    this._setSubmitLoading(false);
    this._saveError = message || this._fallbackError();
    this._refreshError();
    this.setItemState(_a.next, 1);
  }
```

- [ ] **Step 2: Rename the service case**

In `onUiEvent`, change `case 'enter-workspace':` to `case 'create-organisation':` and its body to `await this._createOrganisation();`.

- [ ] **Step 3: Verify no stale references**

```bash
cd /home/drumee/onboarding-ui \
  && node tests/load-modules.js \
  && grep -rn "_enterWorkspace" app/ | grep -v "skeleton/done.js" \
  || echo "no live references to the old handler"
```

Expected: modules load; the only remaining `enter-workspace` is in `app/skeleton/done.js`, which nothing requires (dead since `done_form` moved into the toolkit) and which also orphans `app/locale/index.js` and `app/locale/*.json`. Deleting that set is a separate call — raise it, do not fold it in.

- [ ] **Step 4: Commit**

```bash
git add app/main.js
git commit -m "feat(onboarding): create the organization from the done screen"
```

---

## Task 4: Whole-screen verification

- [ ] **Step 1: Render the finished screen**

```bash
cd /home/drumee/onboarding-ui && node -e "
const {page,measure}=require('./tests/harness');
const {DONE_CHECK_SVG}=require('./app/skeleton/toolkit/icons');
const badges=['Tech / Software','Just me'].map(b=>'<div class=\"onboarding-app__summary-badge\">'+b+'</div>').join('');
const html=page(\`<div class='onboarding-app__ui'><div class='onboarding-app__main'><div class='onboarding-app__card'>
<div class='onboarding-app__done-section'>
 <div class='onboarding-app__done-head'>
  <div class='onboarding-app__done-icon'>\${DONE_CHECK_SVG}</div>
  <div class='onboarding-app__done-title'>You&rsquo;re all set, Alex</div></div>
 <div class='onboarding-app__summary-badges'>\${badges}</div>
 <div class='onboarding-app__org-section'>
  <div class='onboarding-app__org-label'>Your organization name</div>
  <div class='onboarding-app__org-input'><input placeholder='Type the name...'></div></div>
</div>
<div class='onboarding-app__error-region'></div>
<div class='onboarding-app__footer'><div class='onboarding-app__primary-btn' data-state='1'>Create your organization</div></div>
</div></div></div>\`);
measure(html,{sec:'.onboarding-app__done-section',icon:'.onboarding-app__done-icon',
 title:'.onboarding-app__done-title',badges:'.onboarding-app__summary-badges',
 org:'.onboarding-app__org-section',btn:'.onboarding-app__primary-btn'})
 .then(r=>console.log(JSON.stringify(r,null,1)));"
```

Assert: `sec.w` 464; `icon` 70×70 with `rgba(84,182,132,0.15)`; `title` 32px `rgb(67,60,197)`; `badges.y - (title.y + title.h)` = 40; `org.y - (badges.y + badges.h)` = 40; `btn.radius` 12px; `_overflow` 0.

- [ ] **Step 2: Confirm the step count still matches this plan**

```bash
cd /home/drumee/onboarding-ui && node -e "
const src=require('fs').readFileSync('app/skeleton/toolkit/header.js','utf8');
console.log('TOTAL_STEPS', (src.match(/const TOTAL_STEPS = (\d+)/)||[])[1], '(expect 7)');
console.log('MAX_STEP', require('./app/lib/resume').MAX_STEP, '(expect 7)');
"
```

Expected: `7`, `7`.

- [ ] **Step 3: Sweep every step for overflow**

Render each of the seven steps plus the done screen through `tests/harness.js` at heights 1024, 900, 800, 768, 720, 640 and assert `_overflow === 0` for all. The done screen grows by 73px + a 40px gap with the new field; it measured 542px tall at 1024 with ~480px of headroom, so it should still clear 640.

---

## Task 5: Deploy

- [ ] **Step 1: Restart the stage server — this is the live blocker**

The plugin carrying `save_organisation` was deployed at 11:09; the process has been running since 05:25 and reads its ACL only at boot. Until it restarts, the client's bootstrap `SERVICE` map has no `save_organisation`, the call posts to `/svc/undefined`, and the server answers 401 `MODULE_NOT_FOUND`.

```bash
ssh huan@drumee.in 'sudo -u www-data pm2 restart <app-name>'
```

Stage is shared — confirm with the team before bouncing it.

- [ ] **Step 2: Confirm the service is now advertised**

In a browser on the onboarding endpoint:

```js
console.log(!!(SERVICE.onboarding && SERVICE.onboarding.save_organisation));
```

Expected: `true`. If still `false`, the restart did not pick up the plugin — check that `/etc/drumee/conf.d/plugins/huan.json` is the registry the endpoint uses (the request URL's `/-/huan/` segment names the namespace).

- [ ] **Step 3: Check the provisioning service is reachable**

```js
console.log(!!(SERVICE.adminpanel && SERVICE.adminpanel.create_organisation));
```

Expected: `true`. **If `false`, Task 3's fourth call cannot work from this endpoint.** Options then: expose an equivalent under the onboarding ACL that calls `organisation_create` directly, or ship Tasks 1-2 plus the `save_organisation` call only and provision from the desk on first load. Do not leave the button calling a service that is not there — the guard will report it honestly, but the user still cannot finish.

- [ ] **Step 4: Deploy the onboarding-ui bundle and walk the flow**

Reset with `SERVICE.onboarding.reset`, then walk all eight steps including invite. Confirm: 8 progress segments; the invite step behaves as before; the done screen matches 155:47483; the button is disabled until a name is typed; after submitting, `onboarding_responses.organisation_name` holds it and `yp.organisation` has a new row owned by the user.

---

## Open Decisions

1. **Is the organization name required?** This plan gates the button on non-empty, consistent with every other step. The design shows no skip — but it also shows no way past the screen without creating an org, so a user who does not want one is stuck. Confirm the intent.
2. **What happens when provisioning fails?** `organisation_create` signals `POOL_EMPTY` when no clean hub is available. Task 3 shows the error in place and re-enables the button, which on an empty pool is an infinite retry. Decide whether a "continue without an organization" escape is needed.
3. **Users who already have an organization.** ui-team's own form refuses when `Organization.get('domain_id') != 1`. The done screen should probably hide the field entirely for them rather than let the call fail. Not covered by the design.
4. **Nobody is invited during onboarding any more.** The invite step is gone, so the organization is created with exactly one member. Whether users are expected to invite their team from the desk afterwards, and whether anything should prompt them to, is an open product question this screen does not answer.
