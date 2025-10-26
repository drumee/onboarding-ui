
class __radio_buttons extends LetcBox {

  /**
   * 
   */
  initialize(opt = {}) {
    require('./skin');
    super.initialize(opt);
    this.declareHandlers();
    this.debug('aaaa:111', opt, this)
    this.model.atLeast({ flow: _a.x, type: "dashboard" })
    this.skeleton = require("./skeleton")
  }

  /**
   * User Interaction Evant Handler
   * @param {View} trigger
   * @param {Object} args
   */
  onUiEvent(cmd, args = {}) {
    let { value } = this.mget("buttons")[cmd.mget(_a.position)]
    this.mset({ value })
    this.triggerHandlers({
      type: cmd.mget(_a.type),
    })
  }

}

module.exports = __radio_buttons