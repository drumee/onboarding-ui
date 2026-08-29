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

    // Step 2 (Role) sits with the mandatory steps, NOT with the skippable
    // ones. It used to fall through to the skippable case and so offered
    // "Tell me later",
    // but mark_onboarding_complete treats role as required (its own comment
    // claims "no Tell me later in UI for these steps" — which this footer
    // contradicted). Skipping it produced a wizard that could be walked to the
    // end and then refused to complete:
    //   mark_onboarding_complete -> SIGNAL 'Step 3 (role) is incomplete.'
    // and the done screen has no Back button, so the user was stuck.
    case 2:
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

    // Tools (4) and challenges (5). Skippable, but Continue is gated on an
    // actual answer: it renders disabled and checkForm() lights it once
    // something is selected or typed. Getting past these steps with nothing to
    // say is what "Tell me later" is for.
    case 4:
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

    // Goals. The button stays disabled until something is picked, but the step
    // is skippable, so it carries both actions.
    case 6:
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
  // Every question screen except the first gets a Back button beside its
  // primary action. 7 is the done screen, which has no way back.
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
