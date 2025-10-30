const { locale } = require("../../locale")
const { menuInput } = require("./button")
/**
 * 
 * @param {*} ui 
 * @param {*} opt 
 * @returns 
 */
export function entry(ui, opt) {
  let { value, name, placeholder, label, sys_pn, service = _a.input } = opt;
  const pfx = `${ui.fig.family}__entry`;
  let args = {
    className: `${pfx}-input`,
    name,
    value,
    formItem: name,
    innerClass: name,
    mode: _a.interactive,
    service,
    placeholder,
    uiHandler: [ui],
    state:0,
    radio:ui._id
  }
  if (sys_pn) {
    args.sys_pn = sys_pn;
    args.partHandler = [ui];
  }
  return Skeletons.Box.G({
    className: `${pfx}-main`,
    kids: [
      Skeletons.Note({
        className: `${pfx}-label ${name}`,
        content: label,
      }),
      Skeletons.Entry(args)
    ]
  })
}


/**
 * 
 * @param {*} ui 
 * @param {*} opt 
 * @returns 
 */
export function user_form(ui, opt) {
  const pfx = `${ui.fig.family}__user-form`;
  return Skeletons.Box.G({
    className: `${pfx}-main`,
    kids: [
      Skeletons.Box.G({
        className: `${pfx}-row`,
        kids: [
          entry(ui, {
            label: LOCALE.FIRSTNAME,
            name: _a.firstname,
            placeholder: "Alice"
          }),
          entry(ui, {
            label: LOCALE.LASTNAME,
            name: _a.lastname,
            placeholder: "Borderland"
          })
        ]
      }),
      Skeletons.Box.G({
        className: `${pfx}-row`,
        kids: [
          entry(ui, {
            label: LOCALE.EMAIL,
            name: _a.email,
            placeholder: "me@example.org"
          }),
          Skeletons.Box.G({
            className: `${ui.fig.family}__entry-main`,
            kids: [
              Skeletons.Note({
                className: `${ui.fig.family}__entry-label country`,
                content: LOCALE.COUNTRY,
              }),
              menuInput(ui, {
                items: ui.mget('countries'),
                name: 'country',
                refAttribute: 'locale_name',
                placeholder: 'Select a country',
                value: "",
              }),
            ]
          })
        ]
      }),
    ]
  })
}

/**
 * 
 * @param {*} ui 
 * @param {*} opt 
 * @returns 
 */
export function usage_form(ui, opt) {
  const pfx = `${ui.fig.family}__usage-form`;
  let service = _e.select;
  return Skeletons.Box.G({
    className: `${pfx}-main`,
    kidsOpt: {
      radio: ui._id,
      service,
      className: `${pfx}-button`
    },
    kids: [
      Skeletons.Button.Label({
        label: "Notion",
        ico: "notion",
      }),
      Skeletons.Button.Label({
        label: "Dropbox",
        ico: "dropbox",
      }),
      Skeletons.Button.Label({
        label: "Google Drive",
        ico: "google-drive",
      }),
      Skeletons.Note({
        content: "Other",
        name: "other",
      }),
    ]
  })
}

/**
 * 
 * @param {*} ui 
 * @param {*} opt 
 * @returns 
 */
export function purpose_form(ui, opt) {
  const pfx = `${ui.fig.family}__purpose-form`;
  const { purpose } = locale();

  let service = _e.select;
  let kids = [];
  for (let p of purpose) {
    kids.push(Skeletons.Note({ content: p }))
  }
  return Skeletons.Box.G({
    className: `${pfx}-main`,
    kidsOpt: {
      radio: ui._id,
      service,
      className: `${pfx}-button`
    },
    kids
  })
}