/* ==================================================================== *
* Widget skeleton automatically generated on 2026-04-21T04:32:56.074Z
* npm run add-widget -- --fig=<grpup.family> --dest=/path/to/the/widget
* ==================================================================== */

/**
 * 
 * @param {*} ui 
 * @returns 
 */

function skl_onboard_form(ui) {
  const skeleton = Skeletons.Box.Y({
    className  : `${ui.fig.family}__main`,
    debug      : __filename,
    kids       : [
      Skeletons.Box.X({
        className  : `${ui.fig.family}__container`,
        kids : [
          Skeletons.Note({
            className  :`${ui.fig.family}__text`,
            content : "Hello world!"
          }),
          Skeletons.Button.Svg({
            className  :`${ui.fig.family}__icon`,
            ico : "message_smile"
          }),
        ]
      })
    ]
  })

  return skeleton;
}
module.exports = skl_onboard_form;