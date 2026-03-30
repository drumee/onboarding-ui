const { locale } = require("../../locale")
/**
 * 
 * @param {*} ui 
 * @returns 
 */
export function header(ui) {
  const fig = ui.fig.family;
  let step = ui._step;
  const { steps, total_steps } = locale();
  const currentStep = steps[step] || steps[0];

  return Skeletons.Box.Y({
    className: `${fig}__header`,
    debug: __filename,
    kids: [
      Skeletons.Element({
        className: `${fig}__progress-bar step-${step}`,
        content: ' ',
      }),
      Skeletons.Note({
        className: `${fig}__step-indicator`,
        content: `STEP ${step + 1} OF ${total_steps} — ${currentStep.label}`,
      }),
      Skeletons.Note({
        className: `${fig}__title`,
        content: currentStep.title,
      }),
      Skeletons.Note({
        className: `${fig}__tips`,
        content: currentStep.tips,
      })
    ]
  })
}
