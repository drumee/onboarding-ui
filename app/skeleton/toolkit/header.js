const { locale } = require("../../locale")
/**
 * 
 * @param {*} ui 
 * @returns 
 */
export function header(ui, step = 0) {
  const fig = ui.fig.family;
  const { title, tips } = locale();
  let kids = [
    Skeletons.Box.X({
      className: `${fig}__logo-container`,
      kids: [
        Skeletons.Button.Svg({
          name: "logo-drumee-full",
          type: "raw",
          className: `${fig}__logo-content`,
        })
      ]
    }),

    Skeletons.Box.X({
      className: `${fig}__progress-bar step-${step}`,
    }),
    Skeletons.Box.Y({
      className: `${fig}__text-container`,
      kids: [
        Skeletons.Note({
          className: `${fig}__title`,
          content: title[step],
        }),
        Skeletons.Note({
          className: `${fig}__tips`,
          content: tips,
        })
      ]
    })
  ]
  let a = Skeletons.Box.Y({
    className: `${ui.fig.family}__header`,
    debug: __filename,
    kids
  })
  return a;
}
