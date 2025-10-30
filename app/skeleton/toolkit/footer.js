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
      button(ui, {
        label: LOCALE.BACK,
        service: _a.back,
        sys_pn: _a.back,
        state: ui._step > 0 ? 1 : 0,
      }),
      button(ui, {
        label: LOCALE.CONTINUE,
        service: _a.next,
        sys_pn: _a.next,
        state: 0,
        img: { type: "raw", name: "arrow-right" }
      }),
    ]
  })
}
