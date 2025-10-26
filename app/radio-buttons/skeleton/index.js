module.exports = function (ui) {
  let uiHandler = [ui];
  const pfx = `${ui.fig.family}`;
  let { buttons, service, name, value, flow } = ui.model.toJSON();
  ui.debug("AAA:5", { flow })
  let kids = [];
  let i = 0;
  for (let b of buttons) {
    kids.push(
      Skeletons.Note({
        ...b,
        content: b.label,
        position: i,
        uiHandler,
        service,
        initialState: b.state,
      })
    )
    i++;
  }
  let opt = {
    className: `${pfx}__main`,
    name,
    value,
    formItem: name,
    kidsOpt: {
      className: `${pfx}__button`,
      dataset: {
        axis: flow
      },
      radio: `${ui.cid}-radio`,
    },
    kids
  }
  if (ui.mget(_a.flow) == _a.x) {
    return Skeletons.Box.X(opt)
  }
  return Skeletons.Box.Y(opt)

};
