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
      button(ui, { label: LOCALE.BACK, service: _a.back }),
      button(ui, {
        label: LOCALE.CONTINUE,
        service: _a.next,
        img: { type: "raw", name: "arrow-right" }
      }),
    ]
  })
}
