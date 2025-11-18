const { locale } = require("../../locale")
const { menuInput } = require("./button")
/**
 * 
 * @param {*} ui 
 * @param {*} opt 
 * @returns 
 */
export function entry(ui, opt) {
  let { value, name, placeholder, label, sys_pn, service = _a.input, autocomplete } = opt;
  autocomplete = autocomplete || name;
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
    autocomplete,
    state: 0,
    radio: ui._id
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
  let data = ui._saved_data[ui._step] || {}
  let { firstname, lastname, email, country_code } = data;
  return Skeletons.Box.G({
    className: `${pfx}-main`,
    kids: [
      Skeletons.Box.G({
        className: `${pfx}-row`,
        kids: [
          entry(ui, {
            label: LOCALE.FIRSTNAME,
            autocomplete: "given-name",
            name: _a.firstname,
            placeholder: "Alice",
            value: firstname
          }),
          entry(ui, {
            label: LOCALE.LASTNAME,
            name: _a.lastname,
            placeholder: "Borderland",
            value: lastname,
          })
        ]
      }),
      Skeletons.Box.G({
        className: `${pfx}-row`,
        kids: [
          entry(ui, {
            label: LOCALE.EMAIL,
            name: _a.email,
            value: email,
            placeholder: "mi5@example.org"
          }),
          Skeletons.Box.G({
            className: `${ui.fig.family}__entry-main`,
            kids: [
              Skeletons.Note({
                className: `${ui.fig.family}__entry-label country`,
                content: LOCALE.COUNTRY,
              }),
              menuInput(ui, {
                name: 'country_code',
                service: "select-country",
                refAttribute: 'locale_name',
                placeholder: 'Select a country',
                value: country_code,
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
  let tools = ui._saved_data[ui._step] || []

  let service = _e.select;
  return Skeletons.Box.G({
    className: `${pfx}-main`,
    kidsOpt: {
      service,
      toggle: 1,
      className: `${pfx}-button`,
      uiHandler: [ui],
      partHandler: [ui],
    },
    kids: [
      Skeletons.Button.Label({
        label: "Notion",
        name: "notion",
        ico: "notion",
        state: tools.notion || 0,
        initialState: tools.notion || 0,
      }),
      Skeletons.Button.Label({
        label: "Dropbox",
        name: "dropbox",
        ico: "dropbox",
        state: tools.dropbox || 0,
        initialState: tools.dropbox || 0,
      }),
      Skeletons.Button.Label({
        name: "google_drive",
        label: "Google Drive",
        ico: "google-drive",
        state: tools.google_drive || 0,
        initialState: tools.google_drive || 0,
      }),
      Skeletons.Note({
        content: "Other",
        name: "other",
        formItem: "other",
        state: tools.other || 0,
        reference: _a.state,
        initialState: tools.other || 0,
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
  let plan = ui._saved_data[ui._step] || []

  let service = _e.select;
  let kids = [];
  let keys = ['personal', 'team', 'storage', 'other'];
  let i = 0;
  for (let p of purpose) {
    let state = plan[keys[i]] || 0
    kids.push(Skeletons.Note({
      content: p,
      reference: _a.state,
      state,
      name: keys[i],
    }))
    i++;
  }
  return Skeletons.Box.G({
    className: `${pfx}-main`,
    bubble: 0,
    kidsOpt: {
      bubble: 0,
      service,
      className: `${pfx}-button`
    },
    kids
  })
}