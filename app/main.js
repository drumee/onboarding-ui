

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
  }


  /**
   * 
   */
  async start() {
    await this.fetchService(SERVICE.onboarding.get_env, {}, { async: 1 });
    this.feed(require('./skeleton')(this))
    setTimeout(() => {
      this.bindEvent(_a.live);
    }, 3000)
  }

  /**
   * 
   * @param {*} cmd 
   */
  loadPanel(args) {
    let { type } = args;
    if (this.mget(_a.type) == type) return;
    switch (type) {
      case "users":
        this.ensurePart(_a.content).then((p) => {
          p.feed(require('./skeleton/users-list')(this))
        })
        break
      case "dashboard":
        this.ensurePart(_a.content).then((p) => {
          p.feed(require('./skeleton/users-history')(this))
        })
        break
    }
  }

  /**
   * 
   * @param {*} cmd 
   */
  addRecipient(r) {
    this.ensurePart('recipients').then((p) => {
      p.el.dataset.state = "1";
      p.prepend({ ...r.data(), service: "remove-recipient", uiHandler: [this] })
    })
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
   * @param {*} cmd 
   */
  sendSelection(r) {
    let data = this._checkMessage();
    if (!data.message) {
      return;
    }
    if (this._isSending) return
    this.ensurePart('recipients').then((p) => {
      let recipients = []
      for (let c of p.children.toArray()) {
        recipients.push(c.mget(_a.email))
      }
      if (!data.subject) data.subject = "Drumee News Letter";

      this.debug("AAAA:75", data, recipients)
      this.postService(SERVICE.onboarding.emailing, { ...data, recipients }).then((r) => {
        Butler.say("Message sucessfuly sent")
        this.ensurePart("subject").then((p) => { p.setValue("") })
        this.ensurePart("message").then((p) => { p.setValue("") })
        this._isSending = 0
      }).catch((e) => {
        Butler.say(LOCALE.INTERNAL_ERROR)
        this._isSending = 0
      })
    })
  }
  /**
   * 
   * @param {*} cmd 
   */
  sendToAll(r) {
    let data = this._checkMessage();
    if (!data.message) {
      return;
    }
    if (this._isSending) return
    this.postService(SERVICE.onboarding.emailing, { recipients: "all" }).then((r) => {
      Butler.say("Message sucessfuly sent")
      this.ensurePart("subject").then((p) => { p.setValue("") })
      this.ensurePart("message").then((p) => { p.setValue("") })
      this._isSending = 0
    }).catch((e) => {
      Butler.say(LOCALE.INTERNAL_ERROR)
      this._isSending = 0
    })
  }

  /**
   * 
   * @param {*} cmd 
   */
  removeRecipient(r) {
    this.ensurePart('recipients').then((p) => {
      r.cut()
      if (!p.collection.length) {
        p.el.dataset.state = "0";
      }
    })
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
   * Upon DOM refresh, after element actually insterted into DOM
   */
  onDomRefresh() {
    if (!Visitor.isOnline()) {
      Butler.login().then(() => {
        this.start()
      })
      return;
    }
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
      case _a.radio:
        this.loadPanel(args);
        break;
      case "remove-recipient":
        this.removeRecipient(cmd);
        break;
      case "add-recipient":
        this.addRecipient(cmd);
        break;
      case "send-to-selected":
        this.sendSelection(cmd);
        break;
      case "send-to-all":
        this.sendToAll(cmd);
        break;
      case _a.interactive:
        this._checkMessage()
        break;

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
    let { appHash } = bootstrap()
    if (options.service != 'dicycle.publish' || sender.uid != Visitor.id) return
    this._dispatchResults(data)
  }
}

module.exports = onboarding_app