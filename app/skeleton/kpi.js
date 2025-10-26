

module.exports = function (ui, data) {
  const kind= "widget_kpi";
  return Skeletons.Box.G({
    className: `${ui.fig.family}__kpi`,
    kids: [
      { kind, type: "month", column: "cumulative", title: "Total user evolution", api: SERVICE.analytics.users_history },
      { kind, type: "month", chartType: "bar", title: "New user per period", api: SERVICE.analytics.users_history },
      { kind, type: "hour", title: "Number of visites on Portal", api: SERVICE.analytics.trafic_history },
      { kind, type: "hour", title: "Number of visite on App", api: SERVICE.analytics.trafic_history },
    ]
  })
}
