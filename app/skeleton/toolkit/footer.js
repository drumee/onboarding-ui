const { locale } = require("../../locale")

export function footer(ui) {
  const fig = ui.fig.family;
  const loc = locale();
  let step = ui._step;

  let kids = [];

  switch (step) {
    case 0: // Team Type - no explicit footer needed, cards are clickable
      break;

    case 1: // Invite Team - Continue button + Skip for now
      kids.push(
        Skeletons.Note({
          className: `${fig}__primary-btn`,
          sys_pn: _a.next,
          partHandler: [ui],
          content: LOCALE.CONTINUE || loc.continue || "Continue",
          service: _a.next,
          state: 1,
          reference: _a.state,
          dataset: { state: 1 },
        })
      )
      kids.push(
        Skeletons.Note({
          className: `${fig}__skip-btn`,
          content: LOCALE.SKIP_FOR_NOW || loc.skip_for_now || "Skip for now",
          service: 'skip',
        })
      )
      break;

    case 2: // Welcome / All set - Tour button + Skip to workspace
      kids.push(
        Skeletons.Box.X({
          className: `${fig}__primary-btn`,
          sys_pn: _a.next,
          partHandler: [ui],
          service: _a.next,
          state: 1,
          reference: _a.state,
          dataset: { state: 1 },
          kids: [
            Skeletons.Note({
              className: `${fig}__primary-btn-label`,
              content: LOCALE.TAKE_QUICK_TOUR || loc.take_quick_tour || "Let's take a quick tour",
              active: 0,
            }),
            Skeletons.Element({
              className: `${fig}__primary-btn-icon`,
              content: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
              active: 0,
            })
          ]
        })
      )
      kids.push(
        Skeletons.Note({
          className: `${fig}__skip-btn`,
          content: LOCALE.SKIP_TO_WORKSPACE || loc.skip_to_workspace || "Skip and go to workspace",
          service: 'enter-workspace',
        })
      )
      break;

    case 3: // Final step
      kids.push(
        Skeletons.Note({
          className: `${fig}__primary-btn`,
          sys_pn: _a.next,
          partHandler: [ui],
          content: LOCALE.ENTER_WORKSPACE || loc.enter_workspace || "Enter workspace 🚀",
          service: 'enter-workspace',
          state: 1,
          reference: _a.state,
          dataset: { state: 1 },
        })
      )
      break;
  }

  if (!kids.length) return Skeletons.Element({ className: `${fig}__footer-empty`, content: '' });

  return Skeletons.Box.Y({
    className: `${fig}__footer`,
    kids
  })
}
