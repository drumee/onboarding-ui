
const { colorFromName } = require('../utils')
module.exports = function (ui, data) {
  let labels = [];
  let cumulative = [];
  let instant = [];
  for (let row of data) {
    labels.push(row.period)
    cumulative.push(row.cumulative)
    instant.push(row.instant)
  }
  let datasets = [{
    type: 'line',
    label: "Total number of users",
    color: colorFromName("Total number of users"),
    data: cumulative
  }, {
    type: 'bar',
    label: "New users ",
    color: colorFromName("New users"),
    data: instant
  }]
  return Skeletons.Box.X({
    className: `${ui.fig.family}__reels-main`,
    kids: [
      { kind: "widget_chart", labels, datasets, label: ui.mget(_a.label) }
    ]
  })
}
