# Onboarding Final Step — "Invite your team members" (add as contact) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign onboarding step 6 to match Figma `5-74682`, where each staged email is added as a contact via the existing `contact/invite` service instead of `send_onboarding_invites`.

**Architecture:** Pure UI change in `onboarding-ui`. Step 6 already stages emails (`this._data.invites`, `add-invite`/`remove-invite`). We add client-side email validation (extracted to a testable helper), swap the step-6 commit to fan out one `contact/invite` per staged email via `Promise.all`, remove the now-meaningless role control, and align copy with the Figma. Step 7 (done screen) and the `enter-workspace` completion sequence are untouched. No backend changes — `contact/invite` is reused exactly as the address-book widget uses it.

**Tech Stack:** Drumee in-house UI framework (Backbone/Marionette-style; globals `SERVICE`, `Visitor`, `LOCALE`, `Skeletons`, `_a`); webpack + UnoCSS build via `drumee-ui-devel`; plain `node` assert for unit tests (no test framework in repo).

## Global Constraints

- **One concern per change; follow existing onboarding-ui patterns** (skeleton/toolkit builders, `this._data`, `onUiEvent` service switch, `postService(serviceRef, payload, SVC_OPT)` 3-arg form).
- **Email regex (must match address-book + loby):** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
- **Contact service call shape (match address-book):** `postService(SERVICE.contact.invite, { email, hub_id: Visitor.id }, SVC_OPT)`.
- **Copy from Figma (verbatim):** title "Invite your team members"; subtitle/tip "Your workspace is ready. Bring your team in."; note "Add team member as contact."; primary button "Send invites"; secondary "Skip this step".
- **Always-advance contract:** step commit advances to step 7 even if a call fails (existing wizard behavior — a transient failure must not strand the user).
- **No new dependencies, no test framework added.** Unit tests run via `node <file>`.
- **`SERVICE.contact.invite` and owner/hub context are runtime assumptions** — Task 1 verifies them before any wiring.

---

### Task 1: Verify `contact/invite` is reachable from the onboarding-ui runtime

This is a spike — no production code. It de-risks the whole plan (the two open items in the spec) before edits. If it fails, stop and escalate; do not proceed to Task 3+.

**Files:**
- None (investigation + a throwaway console check).

**Interfaces:**
- Consumes: nothing.
- Produces: confirmation that `SERVICE.contact.invite` resolves and `Visitor.id` is the owner hub id at onboarding step 6. Documented in the task's commit message / PR notes.

- [ ] **Step 1: Build and run the onboarding-ui dev app**

Run: `cd /home/drumee/onboarding-ui && npm run dev`
Expected: dev server starts; the onboarding widget loads in the browser.

- [ ] **Step 2: In the browser devtools console, confirm the service ref and hub context**

Run in console (with the onboarding widget mounted, advanced to the invite step):
```js
console.log('contact.invite =', SERVICE && SERVICE.contact && SERVICE.contact.invite);
console.log('Visitor.id =', Visitor.id, 'profile =', Visitor.profile && Visitor.profile());
```
Expected: `SERVICE.contact.invite` is a non-empty string (e.g. `"contact/invite"`); `Visitor.id` is defined and is the current hub/owner id.

- [ ] **Step 3: Decision gate**

If both resolve → proceed to Task 2.
If `SERVICE.contact.invite` is `undefined` → STOP. The onboarding app's service map does not expose the contact ACL; escalate (the fix is server/ACL exposure, outside this UI plan). Do not write the wiring in Task 4 against a missing service.

- [ ] **Step 4: Commit the finding**

```bash
cd /home/drumee/onboarding-ui
git commit --allow-empty -m "chore(onboarding): verify SERVICE.contact.invite + owner hub context reachable at step 6"
```

---

### Task 2: Add a testable email-validation helper

Extract the validation rules into a pure module so they can be unit-tested without the UI framework, and reused by the `add-invite` handler in Task 3.

**Files:**
- Create: `app/lib/email.js`
- Test: `test/email.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `isValidEmail(value: string): boolean` — true iff `value` (after no trimming; caller trims) matches the global email regex.
  - `normalizeEmail(value: string): string` — trimmed, lower-cased.
  - module exports via CommonJS `module.exports = { isValidEmail, normalizeEmail, EMAIL_RE }` (repo mixes `module.exports` and ES `export`; this lib uses CommonJS so the plain `node` test can require it; `app/main.js` already uses `require(...)`).

- [ ] **Step 1: Write the failing test**

Create `test/email.test.js`:
```js
const assert = require('assert');
const { isValidEmail, normalizeEmail } = require('../app/lib/email');

// isValidEmail
assert.strictEqual(isValidEmail('name@company.com'), true, 'plain valid');
assert.strictEqual(isValidEmail('a.b+tag@sub.example.io'), true, 'plus + subdomain');
assert.strictEqual(isValidEmail('no-at-sign.com'), false, 'missing @');
assert.strictEqual(isValidEmail('foo@bar'), false, 'missing TLD dot');
assert.strictEqual(isValidEmail('has space@x.com'), false, 'whitespace');
assert.strictEqual(isValidEmail(''), false, 'empty');

// normalizeEmail
assert.strictEqual(normalizeEmail('  Name@Company.COM '), 'name@company.com', 'trim + lower');

console.log('email.test.js: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/drumee/onboarding-ui && node test/email.test.js`
Expected: FAIL — `Cannot find module '../app/lib/email'`.

- [ ] **Step 3: Write minimal implementation**

Create `app/lib/email.js`:
```js
// Pure, framework-free email helpers for the onboarding wizard.
// Regex intentionally matches the address-book widget and loby's EMAIL_RE.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value);
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

module.exports = { isValidEmail, normalizeEmail, EMAIL_RE };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/drumee/onboarding-ui && node test/email.test.js`
Expected: PASS — prints `email.test.js: all assertions passed`, exit code 0.

- [ ] **Step 5: Commit**

```bash
cd /home/drumee/onboarding-ui
git add app/lib/email.js test/email.test.js
git commit -m "feat(onboarding): add testable email-validation helper for invite step"
```

---

### Task 3: Validate emails on `add-invite` (reject invalid / self / duplicate)

The current `add-invite` handler pushes any non-empty string without validation. Add validation using the Task 2 helper, dedupe against the existing list and the user's own email, and surface an inline error.

**Files:**
- Modify: `app/main.js:354-364` (the `case 'add-invite':` block) and add an `_inviteError` field + a small error-render call.

**Interfaces:**
- Consumes: `isValidEmail`, `normalizeEmail` from `app/lib/email.js`; `Visitor.profile()`; `this._data.invites`.
- Produces: `this._inviteError` (string|null) read by the form skeleton in Task 5; `this._data.invites` entries are shape `{ email }` (no `role` — contacts have no workspace role). Tasks 4 and 5 read `inv.email`.

- [ ] **Step 1: Add the import at the top of `app/main.js`**

Near the existing top-of-file requires, add:
```js
const { isValidEmail, normalizeEmail } = require('./lib/email');
```

- [ ] **Step 2: Replace the `add-invite` handler**

Replace `app/main.js:354-364` (`case 'add-invite': { ... } break;`) with:
```js
      case 'add-invite':
        {
          let formData = this.getData() || {};
          let email = normalizeEmail(formData.invite_email || '');
          this._inviteError = null;

          if (!email) {
            this._inviteError = LOCALE.EMAIL_REQUIRED || 'Please enter an email address.';
          } else if (!isValidEmail(email)) {
            this._inviteError = LOCALE.INVALID_EMAIL_FORMAT || 'Please enter a valid email address.';
          } else if (email === normalizeEmail((Visitor.profile && Visitor.profile().email) || '')) {
            this._inviteError = LOCALE.CANNOT_ADD_SELF_AS_CONTACT || 'You cannot add yourself.';
          } else {
            if (!this._data.invites) this._data.invites = [];
            let dup = this._data.invites.some(inv => normalizeEmail(inv.email || inv) === email);
            if (dup) {
              this._inviteError = LOCALE.ALREADY_IN_LIST || 'That email is already in the list.';
            } else {
              this._data.invites.push({ email });
            }
          }
          this.loadForm();
        }
        break;
```

- [ ] **Step 3: Build to verify it compiles**

Run: `cd /home/drumee/onboarding-ui && npm run dev`
Expected: webpack build succeeds with no errors referencing `main.js` or `lib/email`.

- [ ] **Step 4: Manual verification in the browser**

With the widget on step 6:
- Type `name@company.com`, click **+ Add** → chip appears, input clears, no error.
- Type `not-an-email`, click **+ Add** → no chip added; inline error shows (rendered in Task 5; until then verify `this._inviteError` is set via console: `_a` widget instance → `._inviteError`).
- Add the same valid email twice → second add shows the duplicate error.
- Add your own profile email → self error.

Expected: behavior as described.

- [ ] **Step 5: Commit**

```bash
cd /home/drumee/onboarding-ui
git add app/main.js
git commit -m "feat(onboarding): validate invite email (format, self, duplicate) on add"
```

---

### Task 4: Swap step-6 commit to fan out `contact/invite` per email

Replace the `send_onboarding_invites` call in `commitForm` case 6 with one `contact/invite` per staged email, aggregate results for a toast, then advance (always — preserving the wizard's always-advance contract).

**Files:**
- Modify: `app/main.js:191-208` (the `case 6:` block in `commitForm`).
- Reference (do not modify): address-book status handling `ui-team/src/drumee/builtins/widget/address-book/index.js:482` (`_inviteErrorMessage`).

**Interfaces:**
- Consumes: `SERVICE.contact.invite`, `Visitor.id`, `this._data.invites` (each `{ email }`), `SVC_OPT`, `advance` (local const already defined at `commitForm` top), `Butler.say` (used elsewhere in this file for toasts — see `onServerComplain`).
- Produces: side effects only (contact invitations + toast). No new public method.

- [ ] **Step 1: Replace the `case 6:` block in `commitForm`**

Replace `app/main.js:191-208` with:
```js
      case 6: // Invite team members — each becomes a contact via contact/invite
        {
          let emails = (this._data.invites || [])
            .map(inv => (typeof inv === 'string' ? inv : inv.email) || '')
            .map(e => e.trim())
            .filter(Boolean);

          if (!emails.length) {
            advance();
            break;
          }

          let calls = emails.map(email =>
            this.postService(
              SERVICE.contact.invite,
              { email, hub_id: Visitor.id },
              SVC_OPT
            ).then(res => ({ email, res }))
             .catch(() => ({ email, res: { status: 'SERVICE_ERROR' } }))
          );

          Promise.all(calls).then(results => {
            // Treat a response without a known error status as success.
            const FAIL = ['INVALID_DATA', 'SERVICE_ERROR'];
            let sent = results.filter(r => !FAIL.includes(r.res && r.res.status)).length;
            let msg = (LOCALE.ONBOARDING_INVITES_SENT || '{0} invite(s) sent')
              .replace('{0}', String(sent));
            try { Butler.say(msg); } catch (e) { /* toast is best-effort */ }
            advance();
          }).catch(advance);
        }
        break;
```

- [ ] **Step 2: Build to verify it compiles**

Run: `cd /home/drumee/onboarding-ui && npm run dev`
Expected: webpack build succeeds, no reference errors.

- [ ] **Step 3: Manual verification — network + advance**

With the widget on step 6 and one valid email staged, open devtools Network tab and click **Send invites**:
- Observe one POST to the contact service per staged email (e.g. `contact/invite`), each carrying `{ email, hub_id }`.
- A toast "N invite(s) sent" appears.
- The wizard advances to step 7 ("You're all set" / Open workspace).

Verify the always-advance contract: stage an email, throttle network to Offline, click **Send invites** → wizard still advances to step 7 (no stranding).

Expected: behavior as described; no calls to `send_onboarding_invites`.

- [ ] **Step 4: Commit**

```bash
cd /home/drumee/onboarding-ui
git add app/main.js
git commit -m "feat(onboarding): step 6 sends contact/invite per email instead of send_onboarding_invites"
```

---

### Task 5: Align step-6 UI with the Figma (copy, note, remove role control, inline error)

Update the invite form skeleton and step titles to match Figma `5-74682`: the note "Add team member as contact.", remove the role toggle button (contacts have no workspace role), and render the validation error from Task 3.

**Files:**
- Modify: `app/skeleton/toolkit/form.js:276-341` (`invite_form`).
- Modify: `app/skeleton/toolkit/header.js:1-19` (only the fallback copy if `LOCALE` keys are absent — see Step 3 note).

**Interfaces:**
- Consumes: `ui._data.invites` (now `{ email }`), `ui._inviteError` (from Task 3), `Skeletons.*`, `LOCALE`, `_a`.
- Produces: rendered step-6 form matching Figma. No new methods.

- [ ] **Step 1: Update the note copy and remove the role button in `invite_form`**

In `app/skeleton/toolkit/form.js`, change the `infoBanner` content and delete the role `Skeletons.Note` from `inputRow.kids`:
```js
  let infoBanner = Skeletons.Note({
    className: `${pfx}__invite-info`,
    content: LOCALE.ONBOARDING_INVITE_INFO || 'Add team member as contact.',
  });

  let inputRow = Skeletons.Box.X({
    className: `${pfx}__invite-input-row`,
    kids: [
      Skeletons.Entry({
        className: `${pfx}__invite-email`,
        name: 'invite_email',
        value: '',
        formItem: 'invite_email',
        innerClass: 'invite_email',
        mode: _a.interactive,
        service: _a.input,
        placeholder: LOCALE.INVITE_PLACEHOLDER || 'name@company.com',
        uiHandler: [ui],
        state: 0,
        radio: ui._id
      }),
      Skeletons.Note({
        className: `${pfx}__invite-add-btn`,
        content: LOCALE.ONBOARDING_ADD || '+ Add',
        service: 'add-invite',
        uiHandler: [ui],
      }),
    ]
  });
```

- [ ] **Step 2: Render the inline validation error and use `{ email }` chips**

Still in `invite_form`, after `inputRow` and before `invitedKids`, add an error element, and update the chip mapping to read `inv.email`:
```js
  let errorRow = ui._inviteError
    ? Skeletons.Element({
        className: `${pfx}__invite-error`,
        content: ui._inviteError,
        active: 0,
      })
    : null;

  let invitedKids = (ui._data.invites || []).map((inv, i) => {
    return Skeletons.Box.X({
      className: `${pfx}__invited-row`,
      kids: [
        Skeletons.Element({
          className: `${pfx}__invited-email`,
          content: inv.email || inv,
          active: 0,
        }),
        Skeletons.Element({
          className: `${pfx}__invited-remove`,
          content: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
          service: 'remove-invite',
          dataset: { index: i },
          active: 0,
        }),
      ]
    });
  });

  let kids = [infoBanner, inputRow];
  if (errorRow) kids.push(errorRow);
  if (invitedKids.length) {
    kids.push(Skeletons.Box.Y({ className: `${pfx}__invited-list`, kids: invitedKids }));
  }

  return Skeletons.Box.Y({ className: `${pfx}__form-section`, kids });
```

- [ ] **Step 3: Set the step-6 title/subtitle copy to match Figma**

In `app/skeleton/toolkit/header.js`, the title comes from `LOCALE[STEP_TITLE_KEYS[6]]` = `LOCALE.ONBOARDING_INVITE_TEAM`, and the tip from `LOCALE.ONBOARDING_WORKSPACE_READY`. The code already references these keys (no code change needed). Ensure the rendered strings read "Invite your team members" and "Your workspace is ready. Bring your team in." If the running app shows different text, the `LOCALE` values are served from the framework's translation set; update them there (the LOCALE source is outside this repo — see Task 6 note). If `LOCALE` keys are missing, the code paths already fall back; confirm the desired copy renders.

Verify only (no edit if copy already matches):
```bash
cd /home/drumee/onboarding-ui && grep -n "ONBOARDING_INVITE_TEAM\|ONBOARDING_WORKSPACE_READY" app/skeleton/toolkit/header.js
```
Expected: keys present at lines 8 and 18 (already wired).

- [ ] **Step 4: Build and verify the rendered form matches Figma**

Run: `cd /home/drumee/onboarding-ui && npm run dev`
Expected: step 6 shows logo + 7 filled progress bars, title "Invite your team members", subtitle "Your workspace is ready. Bring your team in.", the note "Add team member as contact.", an email input + "+ Add" (no role button), removable chips, and "Send invites" / "Skip this step". Invalid add shows the inline error.

- [ ] **Step 5: Commit**

```bash
cd /home/drumee/onboarding-ui
git add app/skeleton/toolkit/form.js
git commit -m "feat(onboarding): align step-6 invite form with Figma (note copy, remove role, inline error)"
```

---

### Task 6: Clean up the role handling and confirm copy strings

Remove the now-dead `toggle-role` event handling (if present) and ensure the invite entry shape is consistently `{ email }`. Confirm/define the LOCALE copy keys used by the step.

**Files:**
- Modify: `app/main.js` — remove any `case 'toggle-role':` handler and any `role` field still written for invites (the `add-invite` handler from Task 3 already drops `role`).
- Verify: LOCALE keys `ONBOARDING_INVITE_TEAM`, `ONBOARDING_WORKSPACE_READY`, `ONBOARDING_INVITE_INFO`, `ONBOARDING_SEND_INVITES`, `ONBOARDING_SKIP_THIS_STEP`, `ONBOARDING_ADD`, `INVITE_PLACEHOLDER`, `ONBOARDING_INVITES_SENT`, `EMAIL_REQUIRED`, `INVALID_EMAIL_FORMAT`, `CANNOT_ADD_SELF_AS_CONTACT`, `ALREADY_IN_LIST`.

**Interfaces:**
- Consumes: nothing new.
- Produces: no role concept anywhere in the invite path.

- [ ] **Step 1: Find any residual role handling**

Run: `cd /home/drumee/onboarding-ui && grep -rn "toggle-role\|invite-role\|\.role" app/`
Expected: lists any remaining references. The `invite-role-btn` Note was removed in Task 5; the `add-invite` `role` field was removed in Task 3.

- [ ] **Step 2: Remove residual role code**

If `grep` shows a `case 'toggle-role':` block in `app/main.js`, delete that entire `case ... break;` block. If it shows a `role` written into an invite object anywhere else, remove the `role` property. (If `grep` shows nothing, this step is a no-op — record that.)

- [ ] **Step 3: Confirm LOCALE fallbacks render acceptable copy**

Every `LOCALE.X || 'fallback'` in `form.js`/`footer.js`/`header.js` for step 6 has a fallback that matches the Figma copy (set in Tasks 4–5). New keys introduced (`ONBOARDING_INVITES_SENT`, `ALREADY_IN_LIST`, `EMAIL_REQUIRED`, `INVALID_EMAIL_FORMAT`, `CANNOT_ADD_SELF_AS_CONTACT`) all have inline fallbacks, so the feature renders correctly even before translations are added. If this project keeps a translation source file, add the keys there; otherwise the fallbacks are authoritative. Record which is the case.

Run: `cd /home/drumee/onboarding-ui && grep -rn "ONBOARDING_INVITES_SENT\|CANNOT_ADD_SELF_AS_CONTACT\|INVALID_EMAIL_FORMAT" app/`
Expected: each appears with a `|| '...'` fallback.

- [ ] **Step 4: Build to verify**

Run: `cd /home/drumee/onboarding-ui && npm run dev`
Expected: build succeeds; step 6 unchanged visually from Task 5.

- [ ] **Step 5: Commit**

```bash
cd /home/drumee/onboarding-ui
git add -A
git commit -m "chore(onboarding): remove dead role handling from invite step; confirm copy fallbacks"
```

---

### Task 7: Full-flow verification (manual) and the unit test re-run

A final end-to-end pass through the wizard plus the automated unit test, to confirm nothing regressed and step 7 still completes onboarding.

**Files:**
- None (verification only).

**Interfaces:**
- Consumes: the running app, `test/email.test.js`.
- Produces: a verified, mergeable branch.

- [ ] **Step 1: Re-run the unit test**

Run: `cd /home/drumee/onboarding-ui && node test/email.test.js`
Expected: PASS.

- [ ] **Step 2: Walk the whole wizard**

Run: `cd /home/drumee/onboarding-ui && npm run dev`
Steps 0→5 as before; at step 6: add 2 valid emails, remove 1, add an invalid one (error shows), click **Send invites** → observe `contact/invite` per remaining email in Network, toast, advance to step 7 → click **Open workspace** → `mark_complete` + `update_profile` fire and the widget exits (redirect to `/` or `softDestroy` when embedded).

Expected: full flow works; step 7 behavior unchanged from before this work.

- [ ] **Step 3: Verify the "Skip this step" path**

Re-enter step 6, click **Skip this step** with emails staged → advances to step 7 with **no** `contact/invite` calls.
Expected: skip sends nothing and advances.

- [ ] **Step 4: Final commit / branch ready**

```bash
cd /home/drumee/onboarding-ui
git status   # expect clean
git log --oneline -7
```
Expected: the 6 feature commits present, working tree clean. Branch ready for PR.

---

## Notes for the implementer

- **Do not touch** step 7 (`done_form` in `form.js`), the `enter-workspace` handler in `main.js`, or `loby`. Out of scope.
- `send_onboarding_invites` (loby) is intentionally left in place but unused by step 6. Do not delete it.
- `Butler.say` is the toast mechanism already used in this file (`onServerComplain`); reuse it rather than introducing a new toast.
- The address-book widget (`ui-team/src/drumee/builtins/widget/address-book/index.js`) is the reference for `contact/invite` call shape and status handling — read `_submitInvite` and `_inviteErrorMessage` if unsure.
