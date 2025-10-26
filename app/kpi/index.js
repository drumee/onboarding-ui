
const { Chart } = require('chart.js/auto')
const { colorFromName } = require('../utils')


class widget_kpi extends LetcBox {

  /**
   * 
   */
  initialize(opt = {}) {
    require('./skin');
    super.initialize(opt);
    this.declareHandlers();
    this.debug("AAA:23", this)
    this.model.atLeast({
      type: 'day',
      interval: 7,
      chartType:'line'
    })
  }

  /**
   * 
   */
  onDestroy(){
    this.chart.destroy()
  }


  /**
   * 
   * @returns 
   */
  loadData() {
    let api = this.mget(_a.api)
    if (!api) return
    let args = {
      type: this.mget(_a.type),
      interval: this.mget(_a.interval),
    }
    this.fetchService(api, args)
      .then((rows) => {
        this.debug("AAA:23", rows, api, args)
        let labels = [];
        let data = [];
        let column = this.mget(_a.column) || "instant"
        for (let row of rows) {
          labels.push(row.period)
          data.push(row[column])
        }
        let title = this.mget(_a.title);
        let datasets = [{
          color: colorFromName(title),
          data,
        }
        ]
        if(this.chart){
          this.chart.data.datasets = datasets;
          this.chart.data.labels = labels;
          this.chart.update()
          return
        }
        this.ensurePart('canvas').then((ctx) => {
          this.debug("AAA:48", datasets, labels, ctx)
          this.chart = new Chart(ctx.el, {
            type: this.mget('chartType'),
            label: title,
            data: {
              labels,
              datasets,
            },
            options: {
              scales: {
                y: {
                  beginAtZero: true
                }
              },
              plugins: {
                title: {
                  display: false,
                  text: title
                },
                legend: {
                  display: false,
                  // labels: {
                  //   color: 'rgb(255, 99, 132)'
                  // }
                }
              }
            }
          });
        })

      })

  }
  /**
 * Upon DOM refresh, after element actually insterted into DOM
 */
  onDomRefresh() {
    this.feed(require('./skeleton')(this))
    this.loadData()
  }
  /**
   * User Interaction Evant Handler
   * @param {View} cmd
   * @param {Object} args
   */
  async onUiEvent(cmd, args = {}) {
    const service = args.service || cmd.get(_a.service);
    this.debug("AAA:58", this, args, service, cmd)
    switch (service) {
      case _a.radio:
        this.mset(args)
        this.mset(this.getData())
        this.loadData()
        // this.openLink('input.html');
        break;

    }
  }

}

module.exports = widget_kpi