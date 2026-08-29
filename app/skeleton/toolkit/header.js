const { LOGO_SVG } = require('./logo');
const { loc } = require('../../lib/locale-text');

// [locale key, English fallback]. The fallback is what renders when a bundle
// has no row for the key — LOCALE echoes the key name back in that case, which
// is why these go through loc() rather than `LOCALE[k] || ''` (that prints
// "ONBOARDING_WHAT_TO_START_WITH" on screen; see lib/locale-text.js). The
// goals wording is Figma 155:47398 verbatim, the name step 155:47112.
const STEP_TITLES = [
  ['ONBOARDING_WHAT_SHOULD_WE_CALL_YOU', 'What should we call you?'],
  ['ONBOARDING_WHAT_KIND_OF_WORK',       'Hi {0}, what kind of work do you do?'],
  ['ONBOARDING_WHAT_YOUR_ROLE',          "What's your role, {0}?"],
  ['ONBOARDING_HOW_MANY_PEOPLE',         'How many people do you work with, {0}?'],
  ['ONBOARDING_HELP_TAILOR',             'Help us tailor your workspace'],  // tools, inline
  ['ONBOARDING_HELP_TAILOR',             'Help us tailor your workspace'],  // challenges, inline
  ['ONBOARDING_WHAT_TO_START_WITH',      'What do you want to start with?'],
];

// One segment per question screen. Seven — matching the design's progress bar
// (Figma 155:47112 fills 1 of 7, 155:47287 fills 6, 155:47398 fills all 7).
// Was 8 while the flow carried an invite step.
const TOTAL_STEPS = 7;

// Steps that render "Help us tailor your workspace" inside the form body (star
// icon + text, see tailor_title in ./form.js), so the header must not also
// print a title for them.
const INLINE_TITLE_STEPS = [4, 5];

// The wordmark, as one exported asset. It replaces the old sprite-icon +
// "drumee" text pair: the Figma mark is a single vector whose letterforms are
// not the UI font, so composing it from a text node never matched. The 0.7deg
// tilt is part of the design (Figma node 155:47118).
function logo(ui) {
  const fig = ui.fig.family;
  return Skeletons.Element({
    className: `${fig}__logo`,
    content: LOGO_SVG,
    active: 0,
  });
}

export function header(ui) {
  const fig = ui.fig.family;
  let step = ui._step;
  const isDone = step >= TOTAL_STEPS;
  const hasInlineTitle = INLINE_TITLE_STEPS.includes(step);
  const userName = ui._data.firstname || Visitor.get('firstname') || 'Alex';

  const titleEntry = STEP_TITLES[step];
  let title = titleEntry ? loc(titleEntry[0], titleEntry[1]) : '';
  title = title.replace('{0}', userName);

  let progressKids = [];
  for (let i = 0; i < TOTAL_STEPS; i++) {
    progressKids.push(
      Skeletons.Element({
        className: `${fig}__progress-step${i <= step ? ' active' : ''}`,
        content: ' ',
      })
    )
  }

  let headerKids = [];

  if (isDone) {
    headerKids.push(
      Skeletons.Box.X({
        className: `${fig}__header-top centered`,
        kids: [
          logo(ui),
        ]
      })
    );
  } else {
    // Wrap the logo row and the progress bar in one lead container so it can be
    // centered as a unit (esp. on the wider is-wide steps) while the progress
    // bar keeps its own justify-content: flex-start.
    headerKids.push(
      Skeletons.Box.Y({
        className: `${fig}__header-lead`,
        kids: [
          Skeletons.Box.X({
            className: `${fig}__header-top`,
            kids: [
              logo(ui),
            ]
          }),
          Skeletons.Box.X({
            className: `${fig}__progress-bar`,
            kids: progressKids
          }),
        ]
      })
    );

    if (!hasInlineTitle) {
      // Its own box so the header's 48px gap separates the question from the
      // logo/progress lead. A single child today — no 2.0 screen carries a tip
      // line — but the wrapper stays, because controlling that gap is what it
      // exists for.
      headerKids.push(
        Skeletons.Box.Y({
          className: `${fig}__header-copy`,
          kids: [
            Skeletons.Note({ className: `${fig}__title`, content: title }),
          ],
        })
      );
    }
  }

  return Skeletons.Box.Y({
    className: `${fig}__header`,
    debug: __filename,
    kids: headerKids
  })
}
