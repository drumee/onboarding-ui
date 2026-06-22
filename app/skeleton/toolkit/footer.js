function backBtn(ui) {
  const fig = ui.fig.family;
  return Skeletons.Note({
    className: `${fig}__back-btn`,
    content: LOCALE.BACK || "Back",
    service: _a.back,
    uiHandler: [ui],
  });
}

export function footer(ui) {
  const fig = ui.fig.family;
  let step = ui._step;
  let kids = [];

  switch (step) {
    case 0:
    case 1:
    case 3:
      kids.push(
        Skeletons.Note({
          className: `${fig}__primary-btn`,
          sys_pn: _a.next,
          partHandler: [ui],
          content: LOCALE.CONTINUE || "Continue",
          service: _a.next,
          state: 0,
          reference: _a.state,
          dataset: { state: 0 },
        })
      );
      break;

    case 2:
    case 5:
      kids.push(
        Skeletons.Note({
          className: `${fig}__primary-btn`,
          sys_pn: _a.next,
          partHandler: [ui],
          content: LOCALE.CONTINUE || "Continue",
          service: _a.next,
          state: 0,
          reference: _a.state,
          dataset: { state: 0 },
        })
      );
      kids.push(
        Skeletons.Note({
          className: `${fig}__secondary-btn`,
          content: LOCALE.ONBOARDING_TELL_ME_LATER || "Tell me later",
          service: 'skip',
          uiHandler: [ui],
        })
      );
      break;

    case 4:
      kids.push(
        Skeletons.Note({
          className: `${fig}__primary-btn`,
          sys_pn: _a.next,
          partHandler: [ui],
          content: LOCALE.CONTINUE || "Continue",
          service: _a.next,
          state: 1,
          reference: _a.state,
          dataset: { state: 1 },
        })
      );
      kids.push(
        Skeletons.Note({
          className: `${fig}__secondary-btn`,
          content: LOCALE.ONBOARDING_TELL_ME_LATER || "Tell me later",
          service: 'skip',
          uiHandler: [ui],
        })
      );
      break;

    case 6:
      kids.push(
        Skeletons.Note({
          className: `${fig}__primary-btn`,
          sys_pn: _a.next,
          partHandler: [ui],
          content: LOCALE.ONBOARDING_SEND_INVITES || "Send invites",
          service: _a.next,
          state: 1,
          reference: _a.state,
          dataset: { state: 1 },
        })
      );
      kids.push(
        Skeletons.Note({
          className: `${fig}__secondary-btn`,
          content: LOCALE.ONBOARDING_SKIP_THIS_STEP || "Skip this step",
          service: 'skip',
          uiHandler: [ui],
        })
      );
      break;

    default:
      kids.push(
        Skeletons.Note({
          className: `${fig}__primary-btn`,
          sys_pn: _a.next,
          partHandler: [ui],
          content: LOCALE.ONBOARDING_OPEN_WORKSPACE || "Open workspace",
          service: 'enter-workspace',
          state: 1,
          reference: _a.state,
          dataset: { state: 1 },
        })
      );
      break;
  }

  // On every step except the first (0) and the final "done" screen, pair the
  // primary button with a Back button to its left (Back stays smaller, the
  // primary button grows to fill the row). Secondary buttons (skip / tell me
  // later), if any, stay stacked below.
  if (step > 0 && step < 7 && kids.length) {
    let primary = kids.shift();
    kids.unshift(
      Skeletons.Box.X({
        className: `${fig}__btn-row`,
        kids: [backBtn(ui), primary],
      })
    );
  }

  if (!kids.length) return Skeletons.Element({ className: `${fig}__footer-empty`, content: '' });

  return Skeletons.Box.Y({
    className: `${fig}__footer`,
    kids
  })
}
