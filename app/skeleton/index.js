
const { radioButtons } = require('../widgets')
const { state } = require('../utils')

module.exports = function (ui, data) {
  return Skeletons.Box.G({
    className: `${ui.fig.family}__main`,
    kids: [
      Skeletons.Box.Y({
        className: `${ui.fig.family}__nav`,
        kids: [radioButtons(ui, {
          service: _a.radio,
          flow: _a.y,
          buttons: [
            { state: state(ui, "dashboard"), label: "Dashboard", type: "dashboard" },
            { state: state(ui, "users"), label: "Users", type: "users" },
          ]
        })]
      }),
      Skeletons.Box.Y({
        className: `${ui.fig.family}__content`,
        sys_pn: _a.content,
        kids: [require('./kpi')(ui)]
      }),
    ]
  })
}
