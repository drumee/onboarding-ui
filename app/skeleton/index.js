const {
  header,
  name_form,
  industry_form,
  role_form,
  team_size_form,
  tools_form,
  goals_form,
  invite_form,
  done_form,
  footer,
} = require('./toolkit')

module.exports = function (ui, opt = {}) {
  let content;
  switch (ui._step) {
    case 0:
      content = name_form(ui);
      break;
    case 1:
      content = industry_form(ui);
      break;
    case 2:
      content = role_form(ui);
      break;
    case 3:
      content = team_size_form(ui);
      break;
    case 4:
      content = tools_form(ui);
      break;
    case 5:
      content = goals_form(ui);
      break;
    case 6:
      content = invite_form(ui);
      break;
    default:
      content = done_form(ui);
  }

  // Wider shell for steps that need horizontal room: step 2 (Industry, index 1)
  // uses a 3-up option grid; step 5 (Tools, index 4) uses a two-column split.
  const wide = (ui._step === 1 || ui._step === 4) ? ' is-wide' : '';

  let kids = [
    Skeletons.Box.Y({
      className: `${ui.fig.family}__card${wide}`,
      kids: [
        header(ui),
        content,
        footer(ui),
      ]
    }),
  ];

  return Skeletons.Box.Y({
    className: `${ui.fig.family}__main${wide}`,
    kids
  })
}
