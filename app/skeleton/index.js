
const { header, footer } = require('../toolkit')

module.exports = function (ui, data) {
  return Skeletons.Box.Y({
    className: `${ui.fig.family}__nav`,
    kids: [
      header(ui),
      footer(ui),
    ]
  })
}
