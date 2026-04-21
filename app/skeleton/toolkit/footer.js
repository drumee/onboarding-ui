const { locale } = require("../../locale")

export function footer(ui) {
  const fig = ui.fig.family;
  const loc = locale();
  let step = ui._step;
  let kids = [];

  switch (step) {
    case 0: // Name — Continue only
      kids.push(
        Skeletons.Note({
          className: `${fig}__primary-btn`,
          sys_pn: _a.next,
          partHandler: [ui],
          content: loc.continue || "Continue",
          service: _a.next,
          state: 0,
          reference: _a.state,
          dataset: { state: 0 },
        })
      );
      break;

    case 1: // Industry — Continue only
    case 3: // Team size — Continue only
      kids.push(
        Skeletons.Note({
          className: `${fig}__primary-btn`,
          sys_pn: _a.next,
          partHandler: [ui],
          content: loc.continue || "Continue",
          service: _a.next,
          state: 0,
          reference: _a.state,
          dataset: { state: 0 },
        })
      );
      break;

    case 2: // Role — Continue + Tell me later
    case 5: // Goals — Continue + Tell me later
      kids.push(
        Skeletons.Note({
          className: `${fig}__primary-btn`,
          sys_pn: _a.next,
          partHandler: [ui],
          content: loc.continue || "Continue",
          service: _a.next,
          state: 0,
          reference: _a.state,
          dataset: { state: 0 },
        })
      );
      kids.push(
        Skeletons.Note({
          className: `${fig}__secondary-btn`,
          content: loc.tell_me_later || "Tell me later ->",
          service: 'skip',
          uiHandler: [ui],
        })
      );
      break;

    case 4: // Tools — Continue + Tell me later
      kids.push(
        Skeletons.Note({
          className: `${fig}__primary-btn`,
          sys_pn: _a.next,
          partHandler: [ui],
          content: loc.continue || "Continue",
          service: _a.next,
          state: 1,
          reference: _a.state,
          dataset: { state: 1 },
        })
      );
      kids.push(
        Skeletons.Note({
          className: `${fig}__secondary-btn`,
          content: loc.tell_me_later || "Tell me later ->",
          service: 'skip',
          uiHandler: [ui],
        })
      );
      break;

    case 6: // Invite — Send invites + Skip this step
      kids.push(
        Skeletons.Note({
          className: `${fig}__primary-btn`,
          sys_pn: _a.next,
          partHandler: [ui],
          content: loc.send_invites || "Send invites",
          service: _a.next,
          state: 1,
          reference: _a.state,
          dataset: { state: 1 },
        })
      );
      kids.push(
        Skeletons.Note({
          className: `${fig}__secondary-btn`,
          content: loc.skip_this_step || "Skip this step ->",
          service: 'skip',
          uiHandler: [ui],
        })
      );
      break;

    default: // Done (step 7) — Open workspace
      kids.push(
        Skeletons.Note({
          className: `${fig}__primary-btn`,
          sys_pn: _a.next,
          partHandler: [ui],
          content: loc.open_workspace || "Open workspace ->",
          service: 'enter-workspace',
          state: 1,
          reference: _a.state,
          dataset: { state: 1 },
        })
      );
      break;
  }

  if (!kids.length) return Skeletons.Element({ className: `${fig}__footer-empty`, content: '' });

  return Skeletons.Box.Y({
    className: `${fig}__footer`,
    kids
  })
}
