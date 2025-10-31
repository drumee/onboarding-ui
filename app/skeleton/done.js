const { entry } = require('./toolkit')

module.exports = function user_form(ui, opt) {
  const pfx = `${ui.fig.family}__done`;
  const content = [
    Skeletons.Box.X({
      className: `${pfx}-container`,
      kids: [
        Skeletons.Button.Svg({
          chartName: "logo-drumee-icon",
          type: "raw",
          className: `${pfx}-logo-content`,
        })]
    }),
    Skeletons.Box.Y({
      className: `${pfx}-container`,
      kids: [
        Skeletons.Element({
          className: `${pfx}-big-text`,
          content: `You’re all done`
        }),
        Skeletons.Element({
          className: `${pfx}-call-to-action`,
          content: `<span>Follow us on</span>
          <a href="https://x.com/DrumeeOS" class="highlight">X╱Twitter</a>
          <span>for the latest Drumee updates and vibes.</span>`
        })
      ]
    }),
    Skeletons.Box.X({
      className: `${pfx}-container`,
      kids: [
        Skeletons.Element({
          className: `${pfx}-button neutral`,
          content: LOCALE.CLOSE,
          service: _e.close
        }),
        Skeletons.Element({
          className: `${pfx}-button active`,
          content: `Follow Drumee`,
          href: 'https://x.com/DrumeeOS'
        })
      ]
    }),
  ]
  return Skeletons.Box.Y({
    className: `${pfx}`,
    kids: [
      Skeletons.Box.Y({
        className: `${pfx}-main`,
        kids: content
      }),
    ]
  })
}