
const { header, user_form, footer } = require('./toolkit')

module.exports = function (ui, opt = {}) {
  const fig = ui.fig.family;
  return Skeletons.Box.Y({
    className: `${ui.fig.family}__main`,
    kids: [
      header(ui),
      user_form(ui),
      footer(ui),
    ]
  })
}
