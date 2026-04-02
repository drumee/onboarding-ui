const { locale } = require("../../locale")

// LOCALE key mapping for step titles and tips
const STEP_TITLE_KEYS = [
  'ONBOARDING_HOW_WILL_YOU_USE',     // Step 0: "How will you use DRUMEE?"
  'ONBOARDING_INVITE_YOUR_TEAM',     // Step 1: "Invite your team"
  'ONBOARDING_ALL_SET_TITLE',        // Step 2: "You're all set!"
  'ONBOARDING_SEE_IN_ACTION',        // Step 3: "See Drumee in action"
];

const STEP_TIPS_KEYS = [
  'ONBOARDING_SELECT_TEAM_TYPE_TIPS',
  'ONBOARDING_INVITE_TEAM_TIPS',
  'ONBOARDING_ALL_SET_TIPS',
  'ONBOARDING_SEE_ACTION_TIPS',
];

/**
 * Header with drumee logo + progress bar (5 steps) + title + tips
 * @param {*} ui 
 * @returns 
 */
export function header(ui) {
  const fig = ui.fig.family;
  let step = ui._step;
  const { steps } = locale();
  const currentStep = steps[step] || steps[0];

  // Resolve title and tips: LOCALE.* first, then local locale fallback
  const titleKey = STEP_TITLE_KEYS[step];
  const tipsKey = STEP_TIPS_KEYS[step];
  const title = (titleKey && LOCALE[titleKey]) || currentStep.title;
  const tips = (tipsKey && LOCALE[tipsKey]) || currentStep.tips;

  // Build progress steps (5 total)
  // step 1 (signin) is always completed, onboarding starts at step 2
  // So active count = step + 2 (signin done + current progress)
  let progressKids = [];
  const TOTAL_PROGRESS = 5;
  for (let i = 0; i < TOTAL_PROGRESS; i++) {
    progressKids.push(
      Skeletons.Element({
        className: `${fig}__progress-step${i <= step + 1 ? ' active' : ''}`,
        content: ' ',
      })
    )
  }

  return Skeletons.Box.Y({
    className: `${fig}__header`,
    debug: __filename,
    kids: [
      Skeletons.Box.X({
        className: `${fig}__header-top`,
        kids: [
          Skeletons.Box.X({
            className: `${fig}__logo-container`,
            kids: [
              Skeletons.Button.Svg({
                ico: "raw-logo-drumee-icon",
                className: `${fig}__logo-content`,
              }),
              Skeletons.Element({
                className: `${fig}__logo-text`,
                content: "drumee",
              })
            ]
          }),
          Skeletons.Box.X({
            className: `${fig}__progress-bar`,
            kids: progressKids
          })
        ]
      }),
      Skeletons.Note({
        className: `${fig}__title`,
        content: title,
      }),
      Skeletons.Note({
        className: `${fig}__tips`,
        content: tips,
      })
    ]
  })
}
