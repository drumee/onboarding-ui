const { locale } = require("../../locale")

/**
 * Header with drumee logo + progress bar (7 steps) + title + tips
 * Step 4 (tools): title is in the form body, header shows only logo + progress
 * Done step: logo centered, no progress bar
 */
export function header(ui) {
  const fig = ui.fig.family;
  let step = ui._step;
  const loc = locale();
  const isDone = step >= loc.steps.length;
  const isToolsStep = step === 4;
  const currentStep = isDone ? {} : (loc.steps[step] || loc.steps[0]);
  const userName = ui._data.firstname || Visitor.get('firstname') || 'Alex';

  let title = currentStep.title || '';
  title = title.replace('{0}', userName);
  let tips = currentStep.tips || '';

  // Build progress steps (7 segments)
  let progressKids = [];
  const TOTAL_PROGRESS = 7;
  for (let i = 0; i < TOTAL_PROGRESS; i++) {
    progressKids.push(
      Skeletons.Element({
        className: `${fig}__progress-step${i <= step ? ' active' : ''}`,
        content: ' ',
      })
    )
  }

  let headerKids = [];

  if (isDone) {
    // Done: logo centered, no progress bar
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
    // Normal: logo + progress bar
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

    // Title + tips (skip for tools step — it has its own title in the form)
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
