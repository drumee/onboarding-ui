
/**
 * 
 * @param {*} ui 
 * @param {*} opt 
 * @returns 
 */
export function button(ui, opt) {
  let { label, img, service, sys_pn, className } = opt;
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
    kidsOpt: {
      active: 0,
    },
    kids
  })
}
