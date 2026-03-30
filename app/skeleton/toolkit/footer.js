const { locale } = require("../../locale")

export function footer(ui) {
  const fig = ui.fig.family;
  const loc = locale();
  let step = ui._step;

  let kids = [];

  // Back button (shown from step 1 onwards)
  if (step > 0) {
    kids.push(
      Skeletons.Note({
        className: `${fig}__back-btn`,
        content: loc.back,
        service: _a.back,
      })
    )
  }

  // Skip button (steps 0-1: team type and invite)
  if (step === 0 || step === 1) {
    kids.push(
      Skeletons.Note({
        className: `${fig}__skip-btn`,
        content: loc.skip,
        service: 'skip',
      })
    )
  }

  // Primary action button
  let primaryLabel;
  let primaryService = _a.next;
  switch (step) {
    case 0: // Team Type
    case 1: // Invite Team
      primaryLabel = loc.continue;
      break;
    case 2: // Welcome / folder colors
      primaryLabel = loc.next_see_live;
      break;
    case 3: // See in Action - final
      primaryLabel = loc.enter_workspace;
      primaryService = 'enter-workspace';
      break;
  }

  kids.push(
    Skeletons.Note({
      className: `${fig}__primary-btn`,
      sys_pn: _a.next,
      partHandler: [ui],
      content: primaryLabel,
      service: primaryService,
      state: 0,
      reference: _a.state,
      dataset: { state: 0 },
    })
  )

  return Skeletons.Box.X({
    className: `${fig}__footer`,
    kids
  })
}
