
const { header, user_form, usage_form, purpose_form, footer } = require('./toolkit')

module.exports = function (ui, opt = {}) {
  let data = ui._saved_data[ui._step] || {}
  let content = user_form(ui);
  switch (ui._step) {
    case 1:
      content = usage_form(ui);
      break;
    case 2:
      content = purpose_form(ui);
      break;
    case 3:
      content = {
        kind: 'ruler_slider',
        name: 'privacy',
        service: "set-privacy",
        value: data.privacy
      };
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
