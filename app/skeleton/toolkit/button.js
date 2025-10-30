
/**
 * 
 * @param {*} ui 
 * @param {*} opt 
 * @returns 
 */
export function button(ui, opt) {
  let { label, img, service, state, sys_pn, className } = opt;
  const pfx = className || `${ui.fig.family}__button`;
  let kids = []
  if (label) kids.push(
    Skeletons.Element({
      className: `${pfx} btn`,
      content: label,
      tagName: _K.tag.span,
    })
  )
  let icon = ''
  if (img) {
    let { icons } = bootstrap()
    let { type, name, position } = img;
    let url = `${icons}/${type}/${name}.svg`
    icon = 'with-icon'
    let el = Skeletons.Element({
      className: `${pfx} icon`,
      tagName: _K.tag.span,
      content: `<img src="${url}" alt="" class="${pfx}  image">`
    })

    if (position === 0) {
      kids.unshift(el)
    } else {
      kids.push(el)
    }
  }

  return Skeletons.Box.X({
    className: `${pfx}-main ${icon}`,
    partHandler: [ui],
    uiHandler: [ui],
    sys_pn,
    service,
    state,
    kidsOpt: {
      active: 0,
    },
    kids
  })
}



/**
 * 
 * @returns 
 */
export function menuInput(ui, opt = {}) {
  const pfx = `${ui.fig.family}`;
  let { className = "" } = opt;
  return {
    ...opt,
    state: 0,
    radio: ui._id,
    name: 'country_code',
    kind: 'menu_input',
    className: `${pfx}__entry-input ${className}`,
    uiHandler: [ui]
  }
}
