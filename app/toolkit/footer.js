const { button } = require("./button")
/**
 * 
 * @param {*} ui 
 * @returns 
 */
export function footer(ui, opt = {}) {
  const fig = ui.fig.family;

  return Skeletons.Box.X({
    className: `${fig}__footer-container`,
    kids: [
      button(ui, { label: LOCALE.BACK }),
      button(ui, {
        label: LOCALE.CONTINUE,
        img: { type: "raw", name: "arrow-right" }
      }),

      // Skeletons.Box.X({
      //   className: `${fig}__button btn`,
      //   kids: [
      //     button(ui, { label: LOCALE.BACK })
      //   ]
      // }),
      // Skeletons.Box.X({
      //   className: `${fig}__button btn`,
      //   kids: [
      //     button(ui, {
      //       label: LOCALE.CONTINUE,
      //       img: { type: "raw", name: "arrow-right" }
      //     })
      //   ]
      // }),
    ]
  })
}
