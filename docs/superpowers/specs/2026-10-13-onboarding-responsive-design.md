# Onboarding wizard — downsize + responsive (desktop / tablet / phone)

Date: 2026-10-13
Branch: `feat/onboarding-responsive`

## Goal

1. **Downsize.** On desktop, every element of the wizard is drawn at ~85% of
   its current (Figma 155:47112) size: type, buttons, chips, inputs, icons,
   logo, card width, gaps and paddings.
2. **Responsive.** The wizard works at three width classes — desktop, tablet,
   phone — with no horizontal scroll and the primary action always reachable.

Unchanged: colours, copy, step order, services, the `_data`/save flow in
`main.js`, the existing max-height tiers (they keep compressing vertical rhythm
on short screens, re-based on the new sizes).

## Current state (why this needs more than a media query)

- The only media queries are `max-height: 900px` / `720px` in
  `app/skin/vars.scss`. There is no width breakpoint at all.
- Spacing is already tokenised (`--ob-*` on `.onboarding-app__ui`), but type
  sizes, control heights, icon/logo sizes and container widths are literal px
  in `app/skin/index.scss` and `app/skin/form.scss`.
- `buildOptionGrid` (`app/skeleton/toolkit/form.js`) chunks options into
  `__option-row` Box.X rows of `perRow` (3 for industry, 2 otherwise), and the
  chip width is `calc((100% - 16px) / 2)`. The column count is therefore fixed
  in markup and cannot change per breakpoint.

## Approach

Size tokens + CSS grid (chosen over `zoom: 0.85`, which skews layout
measurement and does nothing for small screens, and over rem scaling, which
would need to own the desk's `<html>` font size).

### 1. Size tokens (`app/skin/vars.scss`)

Every literal size in `index.scss` / `form.scss` is replaced by a token. The
default (desktop) values are the old values × 0.85, rounded:

| Token | Was | Desktop |
|---|---|---|
| `--ob-fs-title` (step title, done title) | 32px | 27px |
| `--ob-fs-heading` (tools/challenges heading) | 20px | 17px |
| `--ob-fs-btn` (primary/secondary/back) | 16px / lh 24px | 14px / lh 20px |
| `--ob-fs-body` (chips, inputs, labels, pills, goals, badges) | 14px | 12px |
| `--ob-fs-small` (save-error banner) | 13px | 12px |
| `--ob-ctl-h` (button min-height) | 48px | 40px |
| `--ob-btn-pad-x` / `--ob-btn-pad-y` | 24 / 12px | 20 / 10px |
| `--ob-back-min` (Back min-width) | 96px | 82px |
| `--ob-chip-h` (option chip min-height) | 44px | 38px |
| `--ob-chip-pad-y` / `--ob-chip-pad-x` | 8 / 12px | 7 / 10px |
| `--ob-tool-pad-x` (tool pills, summary badges) | 20px | 17px |
| `--ob-input-pad` | 12px | 10px |
| `--ob-grid-gap` (option grid row/column gap) | 16px | 14px |
| `--ob-icon` (tools star, large check badge) | 20px | 17px |
| `--ob-check` (chip check badge) / `--ob-check-sm` (pill tick) | 16 / 12px | 14 / 10px |
| `--ob-goal-icon` (goal glyph box) | 21px | 18px |
| `--ob-logo-w` / `--ob-logo-h` (svg) | 190.471 / 37.866px | 162 / 32.2px |
| `--ob-logo-box-w` / `--ob-logo-box-h` | 190.917 / 40.181px | 162.3 / 34.2px |
| `--ob-progress-h` | 6px | 5px |
| `--ob-main-max` / `--ob-card-max` / `--ob-wide-max` | 620 / 520 / 800px | 527 / 442 / 680px |
| `--ob-card-top` | 110px | 94px |
| `--ob-card-pad` | 24px | 20px |
| `--ob-gap-lead` / `--ob-gap-block` / `--ob-gap-inline` / `--ob-gap-list` | 48 / 32 / 24 / 12px | 40 / 28 / 20 / 10px |
| `--ob-pill-pad-y` / `--ob-goal-pad-y` | 8 / 12px | 7 / 10px |
| `--ob-freetext-h` | 65px | 55px |
| `--ob-radius-btn` / `--ob-radius-field` | 12 / 8px | 10 / 7px |
| `--ob-done-badge-size` / `--ob-done-icon-size` / `--ob-done-col` / `--ob-gap-done` | 70 / 39 / 464 / 40px | 60 / 33 / 394 / 34px |

Small fixed gaps that are not worth a token (8px → 7px, 12px → 10px, 2px) are
scaled in place. `--ob-freetext-radius` (4px) and `--ob-pill-radius` /
`--ob-radius-pill` (fully round) are unchanged.

Goal glyphs carry intrinsic `width`/`height` attributes and are deliberately
NOT stretched to their box (see the `__goal-icon` comment). They are scaled
with `transform: scale(var(--ob-icon-scale))` (0.85 desktop) inside the
`--ob-goal-icon` box, which keeps their natural proportions.

The two max-height tiers are re-based (old tier values × 0.85, rounded) so each
tier is still a step down from the new desktop default:

| Token | ≤900px tall | ≤720px tall |
|---|---|---|
| `--ob-card-top` | 48 | 27 |
| `--ob-card-pad` | 17 | 14 |
| `--ob-gap-lead` | 27 | 20 |
| `--ob-gap-block` | 20 | 14 |
| `--ob-gap-inline` | 14 | 10 |
| `--ob-gap-list` | 7 | 5 |
| `--ob-pill-pad-y` | 6 | 5 |
| `--ob-goal-pad-y` | 9 | 7 |
| `--ob-freetext-h` | 48 | 41 |

### 2. Width breakpoints

Breakpoints are width media queries on the viewport (the wizard is a
`position: fixed` full-viewport layer, so the viewport is its container):

- **Desktop** `≥ 1024px` — the token defaults above. Centred card. Industry
  3 columns, role/team size 2.
- **Tablet** `600px – 1023px` — same type sizes as desktop. `--ob-main-max`
  and `--ob-card-max` 560px, `--ob-wide-max` 560px (the wide industry step no
  longer needs extra room because it drops to 2 columns), `--ob-card-top`
  64px.
- **Phone** `≤ 599px`:
  - Full-bleed: `__main` loses its max-width and gets 16px side gutters;
    `--ob-card-pad` 0; `--ob-card-top` 24px.
  - Type: `--ob-fs-title` 22px, `--ob-fs-heading` 17px, `--ob-fs-btn` 15px,
    `--ob-fs-body` 14px. **Inputs are 16px** — iOS Safari zooms the page on
    focus of any input below 16px.
  - Touch targets: `--ob-ctl-h` 44px, `--ob-chip-h` 44px.
  - Rhythm: `--ob-gap-lead` 24px, `--ob-gap-block` 20px, `--ob-gap-inline`
    16px. Logo `--ob-logo-w` 136px (height and box follow the aspect ratio).
  - Grids: 1 column, except team size which stays at 2 (its labels are short).
    Single-column chips are left-aligned and keep the right-hand check reserve.
  - Goal labels may wrap (`white-space: normal`) instead of truncating.
  - Footer: `position: sticky; bottom: 0` inside `__main` (the scroll
    container), background `rgba(255,255,255,0.92)` with
    `backdrop-filter: blur(8px)`, padding-bottom
    `calc(12px + env(safe-area-inset-bottom))`. The last option row therefore
    scrolls up from behind the buttons instead of the buttons being pushed
    below the fold.
  - Viewport height: `__ui` uses `height: 100dvh` with a `100vh` fallback, so
    the browser chrome on mobile cannot hide the sticky footer.
  - The max-height tiers still apply on top (a landscape phone is both narrow
    and short).

### 3. Markup change (`buildOptionGrid`)

The only JavaScript change. `buildOptionGrid` stops chunking into
`__option-row` boxes and returns one `__option-grid` box whose direct kids are
the chips, stamped `dataset: { cols: perRow, field }`.

CSS turns that box into a grid:

```scss
.onboarding-app__form-section > .onboarding-app__option-grid[data-flow] {
  display: grid;
  grid-template-columns: repeat(var(--ob-cols), minmax(0, 1fr));
  gap: var(--ob-grid-gap);
}
.onboarding-app__option-grid[data-cols="2"] { --ob-cols: 2; }
.onboarding-app__option-grid[data-cols="3"] { --ob-cols: 3; }
```

Specificity is (0,3,0) on purpose: Box.Y renders as
`.drumee-widget[data-flow=y] { display: flex }` (0,2,0), which beats a
single-class `display: grid`. Dataset keys are lower-case single words
(`cols`, `field`) because ui-core writes them with `setAttribute` verbatim.

Tablet: `[data-cols="3"]` → `--ob-cols: 2`. Phone: every grid → 1, then
`[data-field="team_size"]` → 2.

Behaviour is unaffected: `toggle-option` and `_selectOption` locate chips by
`[data-field][data-value]` on the chip itself, not by row. The chip's
`flex: 0 0 calc(...)` sizing and the `.cols-3` class rule are removed (the grid
sizes the cells); the `.cols-3` wrap/centre/padding treatment moves to
`[data-cols="3"]`.

### 4. Out of scope

- `widget/menu-input` and `widget/ruler-slider` — registered but not used by
  any of the 8 current screens.
- `app/skeleton/done.js` — dead code (unreferenced; reads an unset `_xlink`).
- The desk shell around the wizard. The wizard is a fixed full-viewport layer,
  so nothing outside it is restyled.

## Risks

- **Viewport meta in production.** `onboarding-ui/index.html` sets
  `width=device-width`, but in production the wizard runs inside the desk's
  document. If the desk page lacks the meta, phones render at 980px and no
  phone rule fires. Verify on a real or emulated device before calling it done.
- **Deployed locale rows.** Unaffected — no copy changes.
- **Short landscape phones** (e.g. 812×375): sticky footer + 720px tier must
  leave room for at least one option row; covered by a test viewport.

## Testing

All headless, using the existing `tests/harness.js` (puppeteer +
`/usr/bin/chromium`, `setViewport` per run, real compiled `app/skin`):

- A small skeleton renderer (`tests/render.js`) that executes the real
  `app/skeleton` modules with a `Skeletons` stub producing HTML (class names,
  `data-*`, `data-flow`, content), so the tests measure the actual markup, not
  hand-written copies of it.
- `tests/responsive.test.js` renders each of the 8 steps at 375×812, 812×375,
  768×1024, 1280×800 and 1440×900 and asserts:
  - no horizontal overflow (`scrollWidth <= clientWidth` on `__ui` and `__main`);
  - the primary button's bottom edge is inside the viewport (phone: via sticky);
  - phone: every chip, pill, goal row and button is ≥ 44px tall, inputs are
    16px;
  - grid column count per breakpoint (industry 3/2/1, role 2/2/1, team size
    2/2/2), read from the computed `grid-template-columns`;
  - desktop: title font-size 27px, primary button 40px tall, card ≤ 442px.
- `tests/resume.test.js` and `tests/load-modules.js` keep passing.
