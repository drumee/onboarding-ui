const { actionsButtons } = require('../widgets')
/**
 * 
 * @param {*} ui 
 * @param {*} opt 
 * @returns 
 */
function messageBox(ui) {
  const fig = `${ui.fig.family}`;
  let subject = Skeletons.Entry({
    className: `${fig}__subject`,
    name: "subject",
    formItem: "subject",
    placeholder: "Drumee News Letters",
    uiHandler: [ui],
    type: _a.input,
    sys_pn: "subject"
  })
  let body = Skeletons.Entry({
    className: `${fig}__message-body`,
    name: "message",
    formItem: "message",
    placeholder: LOCALE.MESSAGE,
    uiHandler: [ui],
    type: _a.textarea,
    sys_pn: "message"
  })
  return Skeletons.Box.Y({
    className: `${fig}__message-container`,
    kids: [
      subject,
      body,
      Skeletons.List.Smart({
        className: `${fig}__list-content recipients`,
        innerClass: "drive-content-scroll",
        sys_pn: "recipients",
        flow: _a.none,
        uiHandler: null,
        partHandler: [ui],
        dataset: {
          state: 0,
          role: _a.container,
        },
        itemsOpt: {
          kind: "widget_user",
          service: "remove-recipient",
          uiHandler: [ui]
        },
        vendorOpt: Preset.List.Orange_e,
      }),
      actionsButtons(ui, [
        { content: "Send to selected users", service: "send-to-selected" },
        { content: "Send to all users", service: "send-to-all" },
      ])
    ]
  });
}

module.exports = function (ui) {
  const fig = ui.fig.family;
  const users = Skeletons.Box.Y({
    className: `${fig}__list-container`,
    radio: _a.parent,
    debug: __filename,
    sys_pn: "users-list",
    kids: [
      Skeletons.List.Smart({
        className: `${fig}__list-content`,
        innerClass: "drive-content-scroll",
        sys_pn: "drumates",
        flow: _a.none,
        uiHandler: null,
        partHandler: [ui],
        dataset: {
          role: _a.container,
        },
        itemsOpt: {
          kind: "widget_user",
          service: "add-recipient",
          uiHandler: [ui]
        },
        vendorOpt: Preset.List.Orange_e,
        api: SERVICE.analytics.users_list
      })
    ]
  })

  return Skeletons.Box.G({
    className: `${fig}__users`,
    kids: [
      users,
      messageBox(ui, { placeholder: "Email message" })
    ]
  })
};