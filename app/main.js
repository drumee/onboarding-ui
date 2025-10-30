

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
    this._step = parseInt(localStorage.onboarding_step) || 0;
    this._data = {}
  }

  /**
   * 
   */
  async start() {
    let { data: countries } = await this.fetchService(SERVICE.onboarding.get_countries, {}, { async: 1 });
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
    localStorage.onboarding_step = this._step;
    this.debug("AAAA:58", this._step)
    this.feed(require('./skeleton')(this))
  }

  /**
   * 
   */
  setItemState(pn, s = 0) {
    this.ensurePart(pn).then((p) => { p.setState(s) })
  }
  /**
   * Upon DOM refresh, after element actually insterted into DOM
   */
  onDomRefresh() {
    this.start()
  }

  /**
   * 
   */
  checkForm() {
    let data = this.getData()
    let completed = 1;
    switch (this._step) {
      case 0:
        for (let k of [_a.firstname, _a.lastname, _a.email, 'country_code']) {
          let value = data[k] || this._data[k]
          if (!value) {
            completed = 0;
            continue
          }
          this._data[k] = data[k]
        }
        if (!data.email.isEmail()) {
          completed = 0;
        } else {
          this._data.email = data.email;
        }
        if (completed) {
          this.setItemState(_a.next, 1)
        }
        break
      case 1:
        this._data.tools = []
        for (let k of ['notion', 'dropbox', 'google-drive', 'other']) {
          if (data[k]) {
            this._data.tools.push(k)
          }
        }
        if (this._data.tools.length) {
          this.setItemState(_a.next, 1)
        } else {
          completed = 0;
        }
        break
      case 2:
        this._data.plan = []
        for (let k of ['personal', 'team', 'storage', 'other']) {
          if (data[k]) {
            this._data.plan.push(k)
          }
        }
        if (this._data.plan.length) {
          this.setItemState(_a.next, 1)
        } else {
          completed = 0;
        }
        break
      case 3:
        this._data.plan = []
        for (let k of ['personal', 'team', 'storage', 'other']) {
          if (data[k]) {
            this._data.plan.push(k)
          }
        }
        if (this._data.plan.length) {
          this.setItemState(_a.next, 1)
        } else {
          completed = 0;
        }
        break
    }
    return completed;
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
        if (!this.checkForm()) return;
        this._step++;
        if (this._step > 3) this._step = 3;
        this.debug("AAAA:158", this.checkForm())
        this.loadForm()
        break;
      case _a.back:
        this._step--;
        if (this._step < 0) this._step = 0;
        this.loadForm()
        break;
      case "select-country":
        if (args.source) {
          this._data.country = args.source.mget('country_code');
          this.checkForm();
        }
        break;
      case _a.input:
      case _e.select:
        this.checkForm();
        break;
      case 'set-privacy':
        this.setItemState(_a.next, 1)
        break;
      default:
        RADIO_BROADCAST.trigger(_e.click);

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