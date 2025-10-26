
/**
 * 
 * @param {*} ui 
 * @returns 
 */
export function list(ui, partName = _a.list, args) {
  let opt = {
    className: `${ui.fig.family}__searchbox`,
    innerClass: "drive-content-scroll",
    sys_pn: partName,
    flow: _a.none,
    uiHandler: null,
    spinnerWait: 1000,
    spinner: true,
    vendorOpt: Preset.List.Orange_e,
    ...args,
  }
  return Skeletons.List.Smart(opt);
};


/**
 * 
 * @param {*} ui 
 * @param {*} opt 
 * @returns 
 */
export function entry(ui, opt) {
  let { value, name, placeholder, sys_pn, className = "",
    uppercase = 0, capitalize = 0 } = opt;
  const pfx = `${ui.fig.family}__entry ${name}`;
  let args = {
    className: `${pfx} entry ${className}`,
    name,
    value,
    formItem: name,
    innerClass: name,
    mode: _a.interactive,
    service: _a.input,
    placeholder,
    uppercase,
    capitalize,
    uiHandler: [ui]
  }
  if (sys_pn) {
    args.sys_pn = sys_pn;
    args.partHandler = [ui];
  }
  return Skeletons.Entry(args)
}


/**
 * 
 * @param {*} ui 
 * @param {*} opt 
 * @returns 
 */
export function radioButtons(ui, opt) {
  return {
    className: `${ui.fig.family}__radio-buttons`,
    uiHandler: [ui],
    ...opt,
    kind: 'radio_buttons',
  }
};

/**
 * 
 * @param {*} ui 
 * @returns 
 */
export function buttons(ui, opt = {}) {
  const { label, service } = opt;
  const pfx = `${ui.fig.family}`;
  let ok = Skeletons.Note({
    className: `${pfx}__button-go`,
    content: label || LOCALE.CREATE,
    uiHandler: [ui],
    service: service || _a.create,
  })
  return Skeletons.Box.X({
    className: `${pfx}__buttons-container`,
    sys_pn: "buttons",
    id: `${ui._id}-button`,
    kids: Skeletons.Box.X({
      className: `${pfx}__buttons-main`,
      kids: [ok]
    })
  })
};

/**
 * 
 * @param {*} ui 
 * @returns 
 */
// export function actionsButtons(ui, buttons) {
//   const pfx = `${ui.fig.family}`;
//   let kids = [];
//   let i = 0;
//   for (let b of buttons) {
//     kids.push(Skeleton.Node(ui, { ...b, position: i }))
//     i++;
//   }

//   return Skeletons.Box.X({
//     className: `${pfx}__buttons-container`,
//     sys_pn: "buttons",
//     kids: Skeletons.Box.X({
//       className: `${pfx}__buttons-main`,
//       kids,
//     })
//   })
// };

/**
 * 
 * @param {*} ui 
 * @returns 
 */
export function actionsButtons(ui, buttons) {
  const pfx = `${ui.fig.family}`;
  let uiHandler = [ui];
  let kids = [];
  let i = 0;
  for (let b of buttons) {
    kids.push(
      Skeletons.Note({
        className: `${pfx}__button-item`,
        ...b,
        position: i,
        uiHandler,
      })
    )
    i++;
  }

  return Skeletons.Box.X({
    className: `${pfx}__buttons-container`,
    sys_pn: "buttons",
    kids: Skeletons.Box.X({
      className: `${pfx}__buttons-main`,
      kids,
    })
  })
};

export function placeholder(ui, opt) {
  let { labels, service } = opt || {};
  labels = labels || [];
  return Skeletons.Box.Y({
    className: `${ui.fig.family}__placehoder-main`,
    kids: [
      Skeletons.Note({
        className: `${ui.fig.family}__placeholder`,
        content: labels[0] || "Aucune correspondance trouvee."
      }),
      service ? Skeletons.Note({
        className: `${ui.fig.family}__placeholder button`,
        service: service || "prompt-location",
        content: labels[1] || "Faire une saisie manuelle",
        uiHandler: [ui]
      }) : Skeletons.Element()
    ]
  })
}

export function messageBock(ui) {
  return Skeletons.Wrapper.Y({
    className: `${ui.fig.family}__message`,
    sys_pn: "message-block",
    state: 0,
  })
}

