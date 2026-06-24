# Onboarding final step — "Invite your team members" (add as contact)

**Date:** 2026-06-23
**Status:** Design — approved; revised wiring (2026-06-23)
**Figma:** https://www.figma.com/design/g5V3PjhNMf5bHlsHMvV17w/Drumee?node-id=5-74682
**Repos touched:** `onboarding-ui` (UI only). Reuses existing `server-team` `contact/invite`; **no loby change**.

> **Revision (2026-06-23):** The originally-chosen backend approach (loby batch
> service `onboarding.add_contacts` dispatching internally to `contact.invite`) was
> found **infeasible**: `@drumee/server-team` does not resolve from `loby`
> (`MODULE_NOT_FOUND`) — they run as separate apps/processes, so loby cannot
> `require` and call the Contact service. Per the follow-up decision, the final
> wiring is **the onboarding-ui calls `contact/invite` directly, once per staged
> email** (exactly like the address-book widget). This makes the change
> onboarding-ui-only with zero backend duplication. Sections below are updated to
> reflect this; the superseded backend section is retained at the end for history.

## Summary

Redesign **step 6** of the onboarding wizard (the existing "invite team" step) to
match Figma node `5-74682` — an "Invite your team members" screen where the user
stages email addresses as removable chips and sends them. Each staged email is added
as a **contact** (the address-book `contact/invite` semantic: creates a contact entry
and dispatches a signup/notification email), not a separate "workspace invite."

The existing **step 7** ("You're all set" done screen) is unchanged and still follows
step 6. Step 6 stops calling `send_onboarding_invites`; it now calls a new loby batch
service `onboarding.add_contacts`.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| What "Send invites" does per email | **Add as contact only** — reuse `contact/invite` semantics; no separate workspace-invite/referral concept |
| Flow position | **Replace step 6, keep step 7 done** screen |
| Scope | **onboarding-ui only** (revised — no loby change) |
| Backend approach | **UI calls `contact/invite` per email** (revised; was "A") |
| Reuse mechanism | onboarding-ui `postService(SERVICE.contact.invite, …)` per staged email |

## Current-state references

- Wizard state machine & step 6/7 handlers: `onboarding-ui/app/main.js`
  (`enter-workspace` at ~main.js:300; step renderer `app/skeleton/index.js`;
  form/footer builders `app/skeleton/toolkit/form.js`, `footer.js`).
- Existing invite service: `loby/service/onboarding.js:394` `send_onboarding_invites`
  — requires `this.uid` (user **is** authenticated at this step), but only sends
  referral-signup emails; it does **not** create contact records. Step 6 will stop
  using it.
- Contact-invite logic to reuse: `server-team/service/private/contact.js:1237`
  `invite()` — resolves inviter's drumate DB, checks `drumate_exists` /
  `my_contact_exists`, generates a signup token (`token_generate_next`), sends
  signup-or-drumate mail, creates the contact entry. Returns a per-email `status`
  via `this.output.data(res)`.
- ACL for the existing contact service: `server-team/acl/contact.json` (`invite`,
  scope `hub`, `src: owner`).
- Address-book reference implementation (UI validation + status mapping to copy):
  `ui-team/src/drumee/builtins/widget/address-book/index.js`
  (`_submitInvite` ~414, `_inviteErrorMessage` ~482).

## UI design (onboarding-ui, step 6)

Mapped from Figma into the existing skeleton/form/footer pattern. Tokens: Geist
font; brand `#433CC5` (headings/primary button), `#5950FF` (accents/progress);
greys `#34343A`, `#65656C`; brand overlay `rgba(89,80,255,0.1)`.

Layout (top → bottom), 520px modal container:
1. **Header** — Drumee logo + 7-segment progress bar, all segments filled.
2. **Title** "Invite your team members" (32px semibold, `#433CC5`).
   **Subtitle** "Your workspace is ready. Bring your team in." (16px, `#34343A`).
3. **Note box** — brand-overlay background, 2px left border `#5950FF`, text
   "Add team member as contact." (14px, `#65656C`).
4. **Email row** — text input placeholder `name@company.com` + `+ Add` button (80px).
5. **Chip list** — each staged email as a pill (brand-overlay bg, 12px text) with an
   `X` remove icon.
6. **Footer** — primary `Send invites` button (full width, `#433CC5`) + secondary
   `Skip this step ->` (text button, `#65656C`).

## State, validation, submit (onboarding-ui)

- Component state: `this._teamEmails = []` (staged emails), plus a submitting flag and
  an inline error string.
- **+ Add** validates then pushes:
  - regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` → else inline `INVALID_EMAIL_FORMAT`
  - reject self (`Visitor.profile().email`) → `CANNOT_ADD_SELF_AS_CONTACT`
  - reject email already in `_teamEmails` (duplicate) → inline error
  - on success: push, clear input, re-render chip list
- **X** removes the chip from `_teamEmails` and re-renders.
- **Send invites**: fan out one `contact/invite` per staged email —
  `Promise.all(this._data.invites.map(inv => postService(SERVICE.contact.invite, { email: inv.email, hub_id: Visitor.id }, SVC_OPT)))`.
  Button enters sending state; controls disabled while in flight. No-op / advance when
  the list is empty.
- **Skip this step ->**: advances to step 7 without calling the service. Always available.

## Backend reuse — `contact/invite` (no new code)

No backend changes. onboarding-ui calls the **existing** server-team service
`contact/invite` (`server-team/service/private/contact.js:1237`), once per staged
email, exactly like the address-book widget does. The user is authenticated with an
owner hub context at this step (the workspace exists), which `contact/invite`
(scope `hub`, `src: owner`) requires.

- Per-email call: `postService(SERVICE.contact.invite, { email, hub_id: Visitor.id }, SVC_OPT)`.
- `contact/invite` returns a per-email `{ status, input }` object where
  `status ∈ <success record> | ALREADY_IN_CONTACT | INVITE_RECEIVED | SAME_DOMAIN |
  INVALID_DATA | invited | SERVICE_ERROR`.
- onboarding-ui fans these out with `Promise.all(...)` and aggregates the results for
  user feedback.

**Runtime-verify:** `SERVICE.contact.invite` must be present in onboarding-ui's
services map (built at runtime from the server-wide ACL set, the same map the
address-book uses). Confirm during implementation; if absent, the onboarding app's
ACL exposure must be checked.

## Success / error handling (onboarding-ui)

- Map each per-email status using the same status→message strings the address-book uses
  (`_inviteErrorMessage`).
- Show a summary toast ("N invites sent"); optionally mark failed chips so the user can
  remove/retry them. (See open question Q-B.)
- On overall success, advance to step 7 (done screen).
- On thrown error, show a generic error, keep the staged list for retry. Skip always
  lets the user proceed.

## Edge cases

- Empty list + Send invites → no call, advance (or disabled button).
- Duplicate / self / invalid email → rejected inline before staging.
- Partial success (e.g. some `ALREADY_IN_CONTACT`) → treated as progress; surface
  per-email outcome.

## Testing

- Pure logic (node assert tests, no framework — none exists in this repo): email
  validation, self-email rejection, duplicate-in-list rejection.
- UI (manual build + load): add/remove chip state; validation rejections; empty-list
  behavior; submit disables controls; per-email `contact/invite` fan-out fires; success
  advances to step 7.

## Open items / risks

1. **`SERVICE.contact.invite` reachability** — confirm the global services map in the
   onboarding-ui runtime includes `contact.invite` (runtime-verify above).
2. **Owner/hub auth context** — `contact/invite` is `scope: hub, src: owner`; confirm the
   onboarding-ui session at step 6 carries the owner hub context and `Visitor.id` resolves
   to the hub id (as the address-book passes `hub_id: Visitor.id`).
3. **Per-email feedback granularity** (Q-B) — default is a summary toast ("N invites
   sent") plus keeping any failed chips with an inline message; confirm whether per-chip
   error detail is wanted.

## Superseded approach (history)

The original plan added a loby batch service `onboarding.add_contacts` that internally
dispatched to `contact.invite`. Rejected because `@drumee/server-team` is not
requirable from `loby` (separate processes). Replicating `contact.invite`'s ~150-line
orchestration (`token_generate_next`, `my_contact_add_next`, `contact_invite`,
`my_contact_mail_add`, mail send, `contact_log_activity`, realtime notify) in loby was
deemed too much duplication / drift risk. See revision note at top.

## Out of scope

- Changes to step 7 (done screen) and the `enter-workspace` completion sequence.
- Deprecating/removing `send_onboarding_invites` (left in place; simply unused by step 6).
- CSV/bulk import of contacts.
