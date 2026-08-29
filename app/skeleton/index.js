const {
  header,
  name_form,
  industry_form,
  role_form,
  team_size_form,
  tools_form,
  challenges_form,
  goals_form,
  invite_form,
  done_form,
  error_region,
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
      content = challenges_form(ui);
      break;
    case 6:
      content = goals_form(ui);
      break;
    case 7:
      content = invite_form(ui);
      break;
    default:
      content = done_form(ui);
  }

  // Wider shell for the only step that still needs horizontal room: step 2
  // (Industry, index 1) uses a 3-up option grid. Tools used to widen the shell
  // too, for its two-column tools/challenges split; those are separate steps
  // now (indexes 4 and 5) and both fit the standard card.
  const wide = (ui._step === 1) ? ' is-wide' : '';

  // Tools (4) and challenges (5) print their heading inside the form body
  // ("Help us tailor your workspace") instead of in the header, so the card's
  // own rhythm differs: Figma 155:47287 spaces those blocks 24px apart, not the
  // 32px the header-titled steps use, and puts 48px between the progress bar
  // and the heading. See __card.is-inline-title in skin/index.scss.
  const inline = [4, 5].includes(ui._step) ? ' is-inline-title' : '';

  // Goals (index 6) -- step 7 of 8 -- shares that 24px block rhythm but keeps its
  // title in the header, so it takes the gap without the form-section offset.
  const tight = (ui._step === 6) ? ' is-tight' : '';

  let kids = [
    Skeletons.Box.Y({
      className: `${ui.fig.family}__card${wide}${inline}${tight}`,
      kids: [
        header(ui),
        content,
        // Inline save-failure banner, sits between the form and its buttons so
        // the message is next to the action that failed. Its own part, so
        // main.js can re-feed only this region and leave the user's inputs
        // (and scroll position) alone. Empty on every step until something
        // actually fails.
        Skeletons.Box.Y({
          className: `${ui.fig.family}__error-region`,
          sys_pn: 'save-error',
          kids: error_region(ui),
        }),
        footer(ui),
      ]
    }),
  ];

  return Skeletons.Box.Y({
    className: `${ui.fig.family}__main${wide}`,
    kids
  })
}
