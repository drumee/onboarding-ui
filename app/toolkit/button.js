
/**
 * 
 * @param {*} ui 
 * @param {*} opt 
 * @returns 
 */
export function button(ui, opt) {
  const pfx = `${ui.fig.family}__button`;
  let { label, img } = opt;
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
    let { type, name } = img;
    let url = `${icons}/${type}/${name}.svg`
    icon = 'with-icon'
    kids.push(
      Skeletons.Element({
        className: `${pfx} icon`,
        tagName: _K.tag.span,
        content: `<img src="${url}" alt="" class="${pfx}  image">`
      })
    )
  }
  return Skeletons.Box.X({
    className: `${pfx}-main ${icon}`,
    service: "next",
    kidsOpt: {
      active: 0,
    },
    kids
  })
}
