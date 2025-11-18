
const SVC_OPT = { async: 1 };
const TOOLS = ['notion', 'dropbox', 'google_drive', 'other'];
const PLANS = ['personal', 'team', 'storage', 'other'];

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
    this._saved_data = []
    this._timer;
  }

  /**
   * 
   */
  async start() {
    let { data } = await this.fetchService(
      SERVICE.onboarding.get_response, {}, SVC_OPT
    );

    this.debug("AAA:167", data)
    if (data) {
      this._saved_data[0] = {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        country_code: data.country_code
      }
      if (data.tools) {
        this._saved_data[1] = data.tools
      }
      if (data.plan) {
        this._saved_data[2] = data.plan
      }
      this._saved_data[3] = { privacy: data.privacy }
    }

    this.loadForm();
    if (data) {
      setTimeout(() => { this.checkForm() }, 1000)
    }
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
    this.warn("AAA:72", err)
    Butler.say(LOCALE.INTERNAL_ERROR)
  }

  /**
   * 
   */
  loadForm() {
    localStorage.onboarding_step = this._step;
    this.feed(require('./skeleton')(this))
    this.checkForm()
  }

  /**
   * 
   */
  setItemState(pn, s = 0) {
    this.ensurePart(pn).then((p) => { setTimeout(() => { p.setState(s) }, 100) })
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
    let data = this.getData() || {}
    if (_.isEmpty(data)) {
      data = this._saved_data[this._step] || {}
    }
    let completed = 1;
    switch (this._step) {
      case 0:
        for (let k of [_a.firstname, _a.lastname, _a.email, 'country_code']) {
          let value = data[k]
          if (!value) {
            completed = 0;
            continue
          }
          this._data[k] = data[k]
        }
        if (!data.email || !data.email.isEmail()) {
          completed = 0;
        } else {
          this._data.email = data.email;
        }
        break
      case 1:
        this._data.tools = {}
        for (let k of TOOLS) {
          if (data[k]) {
            this._data.tools[k] = data[k]
          }
        }
        this.mset({ tools: this._data.tools });
        if (_.isEmpty(this._data.tools)) {
          completed = 0;
        }
        break
      case 2:
        this._data.plan = {}
        for (let k of PLANS) {
          if (data[k]) {
            this._data.plan[k] = data[k]
          }
        }
        this.mset({ plan: this._data.plan })
        if (_.isEmpty(this._data.plan)) {
          completed = 0;
        }
        break
      case 3:
        this._data.privacy = this.getData().privacy
        if (this._data.privacy == null) {
          completed = 0;
        }
        break
    }
    this.debug("AAA:158z", data, this._data, this._step, completed)
    if (completed) {
      this.setItemState(_a.next, 1)
    } else {
      this.setItemState(_a.next, 0)
    }
    return completed;
  }

  /**
   * 
   */
  commitForm() {
    let args = this.getData()
    this.setItemState(_a.next, 0)
    this.debug("AAA:173", args)
    switch (this._step) {
      case 0:
        this.postService(
          SERVICE.onboarding.save_user_info, args, SVC_OPT
        ).then((data) => {
          this.debug("AAA:178", data)
          this._saved_data[this._step] = args;;
          this._step++;
          if (this._step > 3) this._step = 3;
          this.loadForm()
        });
        break;
      case 1:
        this.postService(
          SERVICE.onboarding.save_tools, { args }, SVC_OPT
        ).then((data) => {
          this.debug("AAA:183", data)
          this._saved_data[this._step] = args;;
          this._step++;
          if (this._step > 3) this._step = 3;
          this.loadForm()
        });
        break;
      case 2:
        this.postService(
          SERVICE.onboarding.save_usage_plan, { args }, SVC_OPT
        ).then((data) => {
          this._saved_data[this._step] = args;;
          this._step++;
          if (this._step > 3) this._step = 3;
          this.loadForm()
        });
        break;
      case 3:
        this.postService(
          SERVICE.onboarding.save_privacy, args, SVC_OPT
        ).then(() => {
          this._saved_data[this._step] = args;;
          this._step++;
          if (this._step > 3) this._step = 3;
          this.feed(require('./skeleton/done')(this))
          localStorage.onboarding_step = "0"
          this.postService(
            SERVICE.onboarding.reset, {}, SVC_OPT
          ).then((data) => {
            this._saved_data = {};;
            this._step = 0;
          })
        });
        break;
    }
  }


  /**
   * User Interaction Evant Handler
   * @param {View} cmd
   * @param {Object} args
   */
  async onUiEvent(cmd, args = {}) {
    const service = args.service || cmd.get(_a.service);
    let sanity = this.checkForm()
    this.debug("AAA:233", service, sanity, cmd.mget(_a.state));
    switch (service) {
      case _a.next:
        if (!sanity) return;
        this.commitForm()
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
      case "tick":
        if (!cmd.mget(_a.state)) {
          cmd.setState(1)
        } else {
          cmd.setState(0)
        }
        break;
      case _e.select:
        this.checkForm();
        this._timer = setTimeout(() => { this._timer = null; }, 300)
        break;
      case _a.input:
        this.checkForm();
        break;
      case 'set-privacy':
        this._saved_data[this._step] = this.getData()
        this.setItemState(_a.next, 1)
        break;
      case _e.close:
        localStorage.onboarding_step = "0"
        this.postService(
          SERVICE.onboarding.reset, {}, SVC_OPT
        ).then((data) => {
          this._saved_data = {};;
          this._step = 0;
          this.feed(require('./skeleton')(this))
        })
        break;
      default:
      // RADIO_BROADCAST.trigger(_e.click);

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
    this.debug("AAA:304 ", sender, service, data, options.service, options)
  }
}

module.exports = onboarding_app