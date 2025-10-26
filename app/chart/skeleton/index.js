
module.exports = function (ui) {
  return Skeletons.Box.X({
    className: `${ui.fig.family}__main`,
    kids: Skeletons.Box.Y({
      className: `${ui.fig.family}__container`,
      kids: [
        Skeletons.Element({
          sys_pn: 'canvas',
          tagName: 'canvas',
          id: `chart-${ui._id}`,
          partHandler: [ui],
          className: `${ui.fig.family}__canvas`,
        }),
      ]
    })
  })
}
