
const { header, user_form, footer } = require('./toolkit')

module.exports = function (ui, opt = {}) {
  const fig = ui.fig.family;
  const { step = 0 } = opt;
  return Skeletons.Box.Y({
    className: `${ui.fig.family}__main`,
    kids: [
      header(ui, step),
      user_form(ui),
      footer(ui),
    ]
  })
}
