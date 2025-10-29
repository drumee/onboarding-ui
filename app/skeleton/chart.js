const { entry } = require('./toolkit')

module.exports = function user_form(ui, opt) {
  const pfx = `${ui.fig.family}__user-form`;
  return Skeletons.Box.G({
    className: `${pfx}`,
    kids: [
      Skeletons.Box.X({
        className: `${pfx} row`,
        kids: [
          entry(ui, { 
            label:LOCALE.FIRSTNAME, 
            name: _a.firstname, 
            placeholder: "Alice" 
          }),
          entry(ui, { 
            label:LOCALE.LASTNAME, 
            name: _a.lastname, 
            placeholder: "Borderland" 
          })
        ]
      }),
      Skeletons.Box.X({
        className: `${pfx} row`,
        kids: [
          entry(ui, { 
            label:LOCALE.EMAIL, 
            name: _a.email, 
            placeholder: "me@example.org" 
          }),
          entry(ui, { 
            label:LOCALE.COUNTRY,
            name: _a.country,
            placeholder: "Borderland" 
          })
        ]
      }),
    ]
  })
}