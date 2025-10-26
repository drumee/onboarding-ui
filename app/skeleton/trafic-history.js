
const { colorFromName } = require('../utils')
module.exports = function (ui, data) {
  let labels = [];
  let cumulative = [];
  let instant = [];
  for (let row of data) {
    labels.push(`${row.hour}:${row.minute}`)
    cumulative.push(row.cumulative)
    instant.push(row.instant)
  }
  let title1 = "Portal number of visites"
  let title2 = "App number of visites"
  let datasets = [{
    type: 'line',
    label: title1,
    color: colorFromName(title1),
    data: cumulative
  }, {
    type: 'line',
    label: title2,
    color: colorFromName(title2),
    data: instant
  }]
  return Skeletons.Box.X({
    className: `${ui.fig.family}__reels-main`,
    kids: [
      { kind: "widget_chart", labels, datasets, label: ui.mget(_a.label) }
    ]
  })
}
