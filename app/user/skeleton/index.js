module.exports = function (ui) {
  let fig = ui.fig.family
  return Skeletons.Box.G({
    className: `${fig}__main`,
    uiHandler: [ui],
    kids: [
      Skeletons.Note({
        className: `${fig}__date field`,
        content: Dayjs.unix(ui.mget(_a.ctime)).format(Visitor.dateformat())
      }),
      // Skeletons.Note({
      //   className: `${fig}__name field`,
      //   content: ui.mget(_a.surname),
      // }),
      Skeletons.Note({
        className: `${fig}__email field`,
        content: ui.mget(_a.email),
      }),
      { kind: "profile", id: ui.mget(_a.id) }
    ]
  })
}
