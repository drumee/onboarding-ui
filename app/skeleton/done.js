const { locale } = require("../locale")

module.exports = function done_screen(ui, opt) {
  const pfx = `${ui.fig.family}__done`;
  const { done } = locale();
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
          content: done.title
        }),
        Skeletons.Element({
          className: `${pfx}-subtitle`,
          content: done.subtitle
        }),
        Skeletons.Element({
          className: `${pfx}-description`,
          content: done.description
        })
      ]
    }),
    Skeletons.Box.X({
      className: `${pfx}-actions`,
      kids: [
        Skeletons.Element({
          className: `${pfx}-button primary`,
          content: done.enter_workspace,
          service: 'enter-workspace'
        })
      ]
    }),
    Skeletons.Box.Y({
      className: `${pfx}-footer-links`,
      kids: [
        Skeletons.Element({
          className: `${pfx}-link`,
          content: `<span>${done.follow_text_before}</span>
          <a href="${ui._xlink}" class="highlight">X╱Twitter</a>
          <span>${done.follow_text_after}</span>`
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
