const { header, team_type_form, invite_team_form, welcome_form, see_action_form, footer } = require('./toolkit')

module.exports = function (ui, opt = {}) {
  let content;
  switch (ui._step) {
    case 0:
      content = team_type_form(ui);
      break;
    case 1:
      content = invite_team_form(ui);
      break;
    case 2:
      content = welcome_form(ui);
      break;
    case 3:
      content = see_action_form(ui);
      break;
    default:
      content = team_type_form(ui);
  }
  return Skeletons.Box.Y({
    className: `${ui.fig.family}__main`,
    kids: [
      Skeletons.Box.Y({
        className: `${ui.fig.family}__card`,
        kids: [
          header(ui),
          content,
          footer(ui),
        ]
      })
    ]
  })
}
