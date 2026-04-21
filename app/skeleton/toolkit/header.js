const STEP_TITLE_KEYS = [
  'ONBOARDING_WHAT_SHOULD_WE_CALL_YOU',
  'ONBOARDING_WHAT_KIND_OF_WORK',
  'ONBOARDING_WHAT_YOUR_ROLE',
  'ONBOARDING_HOW_MANY_PEOPLE',
  'ONBOARDING_HELP_TAILOR',
  'ONBOARDING_WHAT_TO_START_WITH',
  'ONBOARDING_INVITE_TEAM',
];

const STEP_TIPS_KEYS = [
  'ONBOARDING_FIRST_NAME_TIP',
  'ONBOARDING_PICK_BEST_FIT',
  'ONBOARDING_PICK_BEST_FIT',
  'ONBOARDING_PICK_BEST_FIT',
  '',
  'ONBOARDING_SHAPES_WORKSPACE',
  'ONBOARDING_WORKSPACE_READY',
];

const TOTAL_STEPS = 7;

export function header(ui) {
  const fig = ui.fig.family;
  let step = ui._step;
  const isDone = step >= TOTAL_STEPS;
  const isToolsStep = step === 4;
  const userName = ui._data.firstname || Visitor.get('firstname') || 'Alex';

  const titleKey = STEP_TITLE_KEYS[step];
  const tipsKey = STEP_TIPS_KEYS[step];
  let title = (titleKey && LOCALE[titleKey]) || '';
  title = title.replace('{0}', userName);
  let tips = (tipsKey && LOCALE[tipsKey]) || '';

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
        ]
      })
    );
  } else {
    headerKids.push(
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
      })
    );

    if (!isToolsStep) {
      headerKids.push(
        Skeletons.Note({
          className: `${fig}__title`,
          content: title,
        })
      );
      if (tips) {
        headerKids.push(
          Skeletons.Note({
            className: `${fig}__tips`,
            content: tips,
          })
        );
      }
    }
  }

  return Skeletons.Box.Y({
    className: `${fig}__header`,
    debug: __filename,
    kids: headerKids
  })
}
