
const { Chart } = require('chart.js/auto')



class widget_chart extends LetcBox {

  /**
   * 
   */
  initialize(opt = {}) {
    require('./skin');
    super.initialize(opt);
    this.declareHandlers();
    this.model.atLeast(_a.label, "Chart line")
    this.model.atLeast(_a.type, "line")
  }

  /**
 * Upon DOM refresh, after element actually insterted into DOM
 */
  onDomRefresh() {
    this.debug("AAA:18", Chart)
    const data = {
      labels: this.mget(_a.labels),
      datasets: this.mget('datasets') || [{
        label: this.mget(_a.label),
        data: this.mget(_a.values),
        borderColor: this.mget(_a.color),
        fill: false,
        tension: 0.1,
        // ...this.mget('datasets'),
      }]
    };
    this.feed(require('./skeleton')(this))
    this.ensurePart('canvas').then((ctx) => {
      this.debug("AAA:21", ctx)
      new Chart(ctx.el, {
        data,
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    })
  }

}

module.exports = widget_chart