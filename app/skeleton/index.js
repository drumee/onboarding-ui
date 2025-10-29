
const { header, user_form, usage_form, purpose_form, footer } = require('./toolkit')

module.exports = function (ui, opt = {}) {
  const fig = ui.fig.family;
  let content = user_form(ui);
  switch (ui._step) {
    case 1:
      content = user_form(ui);
      break;
    case 2:
      content = usage_form(ui);
      break;
    case 3:
      content = purpose_form(ui);
      break;
    case 4:
      content = { kind: 'ruler_slider', service: "set-privacy" };
      break;
  }
  return Skeletons.Box.Y({
    className: `${ui.fig.family}__main`,
    kids: [
      header(ui),
      content,
      footer(ui),
    ]
  })
}
