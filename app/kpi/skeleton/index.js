const { radioButtons, entry } = require('../../widgets')
const { state } = require('../../utils')

module.exports = function (ui) {
  return Skeletons.Box.Y({
    className: `${ui.fig.family}__main shadow-xl`,
    kids: Skeletons.Box.Y({
      className: `${ui.fig.family}__container`,
      kids: [
        Skeletons.Note({
          content: ui.mget(_a.title),
          className: `${ui.fig.family}__title`,
        }),
        Skeletons.Element({
          sys_pn: 'canvas',
          tagName: 'canvas',
          id: `chart-${ui._id}`,
          partHandler: [ui],
          className: `${ui.fig.family}__canvas`,
        }),
        Skeletons.Box.X({
          className: `${ui.fig.family}__footer`,
          kids: [
            entry(ui, { value: ui.mget(_a.interval), name: _a.interval, placeholder: LOCALE.DAYS }),
            radioButtons(ui, {
              service: _a.radio,
              buttons: [
                { state: state(ui, "hour"), label: LOCALE.HOURS, type: "hour" },
                { state: state(ui, "day"), label: LOCALE.DAYS, type: "day" },
                { state: state(ui, "month"), label: LOCALE.MONTHS, type: "month" },
                { state: state(ui, "year"), label: LOCALE.YEARS, type: "year" },
              ]
            })
          ]
        }),
      ]
    })
  })
}
