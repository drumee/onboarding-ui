const { header, team_type_form, invite_team_form, welcome_form, see_action_form, footer } = require('./toolkit')
const { locale } = require("../locale")

// Step label keys mapping for LOCALE.*
const STEP_LOCALE_KEYS = [
  'STEP_SELECT_TEAM_TYPE',
  'STEP_INVITE_YOUR_TEAM',
  'STEP_IDENTITY_VERIFICATION',
  'STEP_HOW_DRUMEE_WORKS',
];

module.exports = function (ui, opt = {}) {
  let content;
  switch (ui._step) {
    case 0:
      content = team_type_form(ui);
      break;
    case 1:
      content = invite_team_form(ui);
      break;
    case 2:
      content = welcome_form(ui);
      break;
    case 3:
      content = see_action_form(ui);
      break;
    default:
      content = team_type_form(ui);
  }

  const loc = locale();
  const totalSteps = 5;
  const stepNum = ui._step + 2; // onboarding steps map to steps 2-5
  const localeKey = STEP_LOCALE_KEYS[ui._step];
  const stepLabel = (localeKey && LOCALE[localeKey])
    ? LOCALE[localeKey]
    : (loc.steps && loc.steps[ui._step]) ? loc.steps[ui._step].label : '';

  let kids = [
    Skeletons.Box.Y({
      className: `${ui.fig.family}__card`,
      kids: [
        header(ui),
        content,
        footer(ui),
      ]
    }),
    Skeletons.Box.X({
      className: `${ui.fig.family}__step-indicator`,
      kids: [
        Skeletons.Element({
          className: `${ui.fig.family}__step-dot`,
          content: "●"
        }),
        Skeletons.Element({
          className: `${ui.fig.family}__step-text`,
          content: `STEP ${stepNum} OF ${totalSteps}: ${stepLabel}`,
        }),
      ]
    })
  ];

  return Skeletons.Box.Y({
    className: `${ui.fig.family}__main`,
    kids
  })
}
