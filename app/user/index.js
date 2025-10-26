
const { Chart } = require('chart.js/auto')



class widget_user extends LetcBox {

  /**
   * 
   */
  initialize(opt = {}) {
    require('./skin');
    super.initialize(opt);
    this.declareHandlers();
  }

  /**
   * 
   */
  data() {
    return {
      id: this.mget(_a.id),
      email: this.mget(_a.email),
      ctime: this.mget(_a.ctime),
      surname: this.mget(_a.surname),
    }
  }
  /**
 * Upon DOM refresh, after element actually insterted into DOM
 */
  onDomRefresh() {
    this.feed(require('./skeleton')(this))
  }

  /**
   * User Interaction Evant Handler
   * @param {View} cmd
   * @param {Object} args
   */
  async onUiEvent(cmd, args = {}) {
    this.triggerHandlers(args)
  }
}

module.exports = widget_user