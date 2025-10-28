
/**
 * 
 * @param {*} ui 
 * @param {*} opt 
 * @returns 
 */
export function entry(ui, opt) {
  let { value, name, placeholder, label, sys_pn, service = _a.input,
    className = "" } = opt;
  const pfx = `${ui.fig.family}__entry ${name}`;
  let args = {
    className: `${pfx} entry ${className}`,
    name,
    value,
    formItem: name,
    innerClass: name,
    mode: _a.interactive,
    service,
    placeholder,
    uiHandler: [ui],
    dataset: { currency },
  }
  if (sys_pn) {
    args.sys_pn = sys_pn;
    args.partHandler = [ui];
  }
  return Skeletons.Box.G({
    className: `${pfx} row`,
    kids: [
      Skeletons.Note({
        className: `${pfx} no-border icon`,
        content: label,
      }),
      Skeletons.Entry(args)
    ]
  })
}
