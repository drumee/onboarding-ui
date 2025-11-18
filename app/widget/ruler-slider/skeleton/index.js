/* ==================================================================== *
* Widget skeleton automatically generated on 2025-10-29T06:58:33.203Z
* npm run add-widget -- --fig=<grpup.family> --dest=/path/to/the/widget
* ==================================================================== */
const { button } = require("../../../skeleton/toolkit")

/**
 * 
 * @param {*} ui 
 * @returns 
 */

function skl_slider_bar(ui) {
  let pfx = ui.fig.family;
  let kids = [
    button(ui, {
      className: `slider`,
      service: _a.next,
      sys_pn: _a.slider,
      partHandler: [ui],
      img: { type: "raw", name: "logo-gradient" }
    }),
  ];
  for (let i = 0; i < 6; i++) {
    kids.push(
      Skeletons.Element({
        className: `${pfx}__tick`,
        service: _e.select,
        mark: i,
        dataset: { mark: i }
      })
    )
  }
  let txt = "Extremely important"
  if (Visitor.device() == _a.mobile) {
    txt = "A lot"
  }
  const skeleton = Skeletons.Box.G({
    className: `${pfx}__main`,
    debug: __filename,
    kids: [
      Skeletons.Note({
        className: `${pfx}__text`,
        content: "Not much"
      }),
      Skeletons.Box.X({
        className: `${pfx}__rulers`,
        sys_pn: 'rulers',
        kids
      }),
      Skeletons.Note({
        className: `${pfx}__text`,
        content: txt
      }),
    ]
  })

  return skeleton;
}
module.exports = skl_slider_bar;