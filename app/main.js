

class onboarding_app extends LetcBox {

  /**
   * 
   */
  initialize(opt = {}) {
    require('./skin');
    super.initialize(opt);
    this.declareHandlers();
    this.mset({
      flow: _a.y,
      lang: Visitor.language()
    })
    this._step = 0;
  }

  /**
   * 
   */
  async start() {
    let { data: countries } = await this.fetchService(SERVICE.onboarding.get_countries, {}, { async: 1 });
    this.debug("AAA:24", countries)
    this.mset({ countries })
    this.loadForm();
  }

  /**
   * 
   * @returns 
   */
  _checkMessage() {
    let data = this.getData();
    if (!data.message) {
      this.ensurePart("message").then((p) => { p.el.dataset.error = "1" })
      return;
    } else {
      this.ensurePart("message").then((p) => { p.el.dataset.error = "0" })
    }
    return data
  }

  /**
   * 
   * @param {*} res 
   */
  onServerComplain(err) {
    this.warn("AAA:131", err)
    Butler.say(LOCALE.INTERNAL_ERROR)
  }

  /**
   * 
   */
  loadForm() {
    this.feed(require('./skeleton')(this))
  }

  /**
   * Upon DOM refresh, after element actually insterted into DOM
   */
  onDomRefresh() {
    this.start()
  }

  /**
   * User Interaction Evant Handler
   * @param {View} cmd
   * @param {Object} args
   */
  async onUiEvent(cmd, args = {}) {
    const service = args.service || cmd.get(_a.service);
    this.debug("AAA:53", service, args, cmd, this)
    switch (service) {
      case _a.next:
        this._step++;
        if (this._step > 3) this._step = 3;
        this.loadForm()
        break;
      case _a.back:
        this._step--;
        if (this._step < 0) this._step = 0;
        this.loadForm()
        break;
      default:
        RADIO_BROADCAST.trigger(_e.click)
    }
  }

  /**
   * 
   */
  onServerComplain(xhr) {
    this.debug("Request failed", xhr)
  }

  /** Optional. 
   * uncomment and call this.bindEvent to subscribe to websocket events
   **/
  /** 
   * Websocket Service Endpoint
   * @param {String} service
   * @param {Object} options
   */
  onWsMessage(service, data, options) {
    let { sender } = options;
    this.debug("AAA: ", sender, service, data, options.service, options)
  }
}

module.exports = onboarding_app