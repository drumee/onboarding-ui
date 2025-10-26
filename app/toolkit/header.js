
/**
 * 
 * @param {*} ui 
 * @returns 
 */
export function header(ui, opt = {}) {
  const fig = ui.fig.family;
  const { title, tips } = opt;
  let kids = [
    Skeletons.Box.X({
      className: `${fig}__logo-container`,
      kids: [Skeletons.Button.Svg({
        svgSource: "/assets/images/logo-drumee-full.svg",
        className: `${fig}__logo-content`,
      })]
    }),
    Skeletons.Box.X({
      className: `${fig}__progress-bar`,
    }),
    Skeletons.Note({
      className: `${fig}__title`,
      content: title,
    }),
    Skeletons.Note({
      className: `${fig}__tips`,
      content: tips,
    }),
  ]
  let a = Skeletons.Box.Y({
    className: `${ui.fig.family}__header`,
    debug: __filename,
    kids
  })
  return a;
}
