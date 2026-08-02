# Onboarding "Other → type your own" — Design

**Date:** 2026-07-20
**Scope:** onboarding-ui (client) + loby (service + schema). DB changes must be
patched into all live instances — merge alone does not apply them.

## Goal

On the Industry, Role, and Tools onboarding screens, when the user selects the
**"Other"** option, reveal a single-line text input so they can type a custom
value. The custom value is persisted to the backend.

- Screens affected: Industry (internal step index 1), Role (index 2),
  Tools (index 4). All three already have an `other` option today.
- Team size is **not** affected (no "Other" option).

## Behavior

- Selecting "Other" reveals a single-line input (reusing the existing
  `Skeletons.Entry` `__input-field`), prefilled from saved state.
- Industry and Role are **required** steps: when "Other" is selected, the
  Continue button stays **disabled** until the custom text is non-empty.
- Tools is optional: an empty "Other" custom field is simply ignored.
- Reveal/hide happens **in place** via a dedicated part (no full form rebuild,
  no scroll reset) — mirroring the existing invite-list partial-refresh pattern.
- Values survive Back/forward navigation within a session (held in memory in this._data). Note: they do NOT survive a full page reload — the client does not hydrate from get_onboarding_response (a pre-existing resume gap that affects all onboarding fields, not just these). The new *_other columns are surfaced by get_onboarding_response for forward compatibility when server-side resume is wired.

## Data / DB layer (loby)

### Table `onboarding_responses`

New patch file `schemas/patches/alter_onboarding_responses_other.sql`:

```sql
ALTER TABLE onboarding_responses
  ADD COLUMN industry_other VARCHAR(255) NULL AFTER industry,
  ADD COLUMN role_other     VARCHAR(255) NULL AFTER role;
```

Also reflected in the canonical `schemas/tables/onboarding_responses.sql`.

### Procedures

- `save_onboarding_industry` — add `IN _industry_other VARCHAR(255)`. Keep the
  enum check on `_industry`. Store `_industry_other` only when
  `_industry = 'other'`; otherwise force it NULL.
- `save_onboarding_role` — same, with `_role_other`.
- `get_onboarding_response` — add `industry_other`, `role_other` to the SELECT so
  the wizard can resume/hydrate.
- `save_onboarding_tools` — **no change**. The custom tool rides in the existing
  JSON array as a plain string element.

## Service layer (`loby/service/onboarding.js`)

- `save_industry` / `save_role` — read optional `industry_other` / `role_other`
  via `this.input.get(...)`, pass as the new proc argument.
- `save_tools` — no change (array flows through unchanged).
- `update_profile` — **no change**. The YP profile still receives
  `industry='other'` / `role='other'`; the custom text is intentionally **not**
  propagated into the profile (out of scope).

## Tools encoding decision

The custom tool is stored as a **raw string element** in the JSON array, e.g.
`["notion", "MyCustomTool"]`. Chosen over `{other: "MyCustomTool"}` because it
matches how the array is used today and keeps `save_onboarding_tools` untouched.
Consequence: free text is indistinguishable from a canonical key to consumers —
accepted trade-off.

## UI (`onboarding-ui`)

### State (`this._data` in `app/main.js`)

Add `industry_other`, `role_other`, `tools_other` (strings).

### Rendering (`app/skeleton/toolkit/form.js`)

- `buildOptionGrid(ui, opts, field)` — after the grid, render a reveal region as
  its own part (`sys_pn: '<field>-other'`), empty unless the selected value is
  `'other'`, in which case it shows a single-line `Skeletons.Entry`
  (`name: '<field>_other'`, prefilled from `ui._data`).
- `tools_form` — the `other` chip toggles as today; when on, reveal a
  `tools_other` single-line input below the chips; when off, hide it.
- Helper `other_input(ui, field)` returns the reveal-region kids (`[]` or
  `[Entry]`) so the part can be re-fed on selection.

### Interaction (`app/main.js`)

- `onUiEvent` → `select-option` / `toggle-tool`: after updating selection state,
  re-feed just the `<field>-other` part and focus the input when it appears
  (new `_refreshOtherInput(field)`, analogous to `_refreshInviteList`).
- `checkForm` (Industry/Role): `completed` only when the field is set **and**
  (value ≠ `'other'` **or** the `*_other` text is non-empty).
- `_captureStep` + `_a.input` handler: snapshot `industry_other` / `role_other` /
  `tools_other` so they survive Back-navigation and re-render.
- `commitForm`:
  - case 1 (industry): send `industry_other` when industry === 'other'.
  - case 2 (role): send `role_other` when role === 'other'.
  - case 4 (tools): build effective tools array — when `tools_other` is
    non-empty, append the typed string and drop the bare `'other'` marker;
    an empty custom "Other" is omitted.

### Locale

Add `ONBOARDING_OTHER_PLACEHOLDER` ("Please specify…") to the 7 locale files
(`en, es, fr, km, ru, zh`), with an inline English fallback matching the
existing `LOCALE.X || 'fallback'` idiom.

### Skin (`app/skin/form.scss`)

Reuse `__input-field`; add a small `.__other-input` wrapper rule for spacing.

## Verification

- **Schema/procedures:** validate in a scratch DB (general_ci collation locally),
  since onboarding tables are not provisioned locally. Patch via
  `bin/patch-from-file` and sweep instances.
- **UI:** standalone `sass -I . -I skin` compile + chromium headless harness to
  check the reveal/hide and gating without a full build.

## Out of scope

- Propagating custom industry/role text into the YP user profile.
- Distinguishing custom tools from canonical keys for downstream consumers.
- Any change to Team size.
