
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
  }

  /**
   * 
   */
  async start() {
    let data = await this.fetchService(
      SERVICE.onboarding.get_response, {}, SVC_OPT
    );

    if (data) {
      this._saved_data[0] = {
        firstname: this.mget(_a.firstname) || data.firstname,
        lastname: this.mget(_a.lastname) || data.lastname,
        email: this.mget(_a.email) || data.email,
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
    this._xlink = data.xlink;
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
    this.warn("[onServerComplain][73]", err)
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
    let data = this.getData() || {}
    if (_.isEmpty(data)) {
      data = this._saved_data[this._step] || {}
    }
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
        if (!data.email || !data.email.isEmail()) {
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
        for (let k of TOOLS) {
          if (data[k]) {
            this._data.tools.push(k)
          }
        }
        if (this._data.tools.length) {
          this.setItemState(_a.next, 1)
          this.mset({ tools: this._data.tools })
        } else {
          completed = 0;
        }
        break
      case 2:
        this._data.plan = []
        for (let k of PLANS) {
          if (data[k]) {
            this._data.plan.push(k)
          }
        }
        if (this._data.plan.length) {
          this.mset({ plan: this._data.plan })
          this.setItemState(_a.next, 1)
        } else {
          completed = 0;
        }
        break
      case 3:
        this._data.privacy = this.getData().privacy
        if (this._data.privacy != null) {
          this.setItemState(_a.next, 1)
          completed = 1;
        }
        break
    }
    return completed;
  }

  /**
   * 
   */
  commitForm() {
    let args = this.getData()
    this.setItemState(_a.next, 0)
    switch (this._step) {
      case 0:
        this.postService(
          SERVICE.onboarding.save_user_info, args, SVC_OPT
        ).then((data) => {
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
    switch (service) {
      case _a.next:
        if (!this.checkForm()) return;
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
      case _a.input:
      case _e.select:
        this.checkForm();
        break;
      case 'set-privacy':
        this._saved_data[this._step] = this.getData()
        this.setItemState(_a.next, 1)
        break;
      case 'set-privacy':
        this._saved_data[this._step] = this.getData()
        this.setItemState(_a.next, 1)
        break;
      case 'follow-on-x':
        window.open(this._xlink, "_blank");
        break;
      case _e.close:
        localStorage.onboarding_step = "0";
        if (this.mget(_a.type) == 'app') {
          this.postService(
            SERVICE.onboarding.update_profile, { email: this.mget(_a.email) }, SVC_OPT
          ).then((data) => {
          })
          this.triggerHandlers()
          return;
        }
        this.postService(
          SERVICE.onboarding.reset, {}, SVC_OPT
        ).then((data) => {
          this._saved_data = {};;
          this._step = 0;
          this.feed(require('./skeleton')(this))
        })
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