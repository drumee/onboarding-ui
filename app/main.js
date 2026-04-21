
const SVC_OPT = { async: 1 };
const MAX_STEP = 7;

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
    this.loadForm();
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
   * Upon DOM refresh, after element actually inserted into DOM
   */
  onDomRefresh() {
    this.start()
  }

  /**
   *
   */
  checkForm() {
    let data = this.getData() || {}
    let completed = 0;
    switch (this._step) {
      case 0: // Name
        if ((data.firstname && data.firstname.trim()) || (this._data.firstname && this._data.firstname.trim())) {
          completed = 1;
          if (data.firstname) this._data.firstname = data.firstname.trim();
        }
        break;
      case 1: // Industry
        if (this._data.industry) completed = 1;
        break;
      case 2: // Role
        if (this._data.role) completed = 1;
        break;
      case 3: // Team size
        if (this._data.team_size) completed = 1;
        break;
      case 4: // Tools & challenges (optional, always allow continue)
        completed = 1;
        break;
      case 5: // Goals
        if (this._data.goal) completed = 1;
        break;
      case 6: // Invite (optional)
        completed = 1;
        break;
      default: // Done
        completed = 1;
        break;
    }
    if (completed) {
      this.setItemState(_a.next, 1)
    }
    return completed;
  }

  /**
   *
   */
  _advance() {
    this._step++;
    if (this._step > MAX_STEP) this._step = MAX_STEP;
    this.loadForm();
  }

  /**
   *
   */
  commitForm() {
    let args = this.getData() || {};
    this.setItemState(_a.next, 0);

    switch (this._step) {
      case 0: // Name
        if (args.firstname) this._data.firstname = args.firstname.trim();
        this.postService(
          SERVICE.onboarding.save_usage_plan,
          { args: { firstname: this._data.firstname } },
          SVC_OPT
        ).then(() => this._advance()).catch(() => this._advance());
        break;

      case 1: // Industry
        this.postService(
          SERVICE.onboarding.save_usage_plan,
          { args: { industry: this._data.industry } },
          SVC_OPT
        ).then(() => this._advance()).catch(() => this._advance());
        break;

      case 2: // Role
        this.postService(
          SERVICE.onboarding.save_usage_plan,
          { args: { role: this._data.role } },
          SVC_OPT
        ).then(() => this._advance()).catch(() => this._advance());
        break;

      case 3: // Team size
        this.postService(
          SERVICE.onboarding.save_usage_plan,
          { args: { team_size: this._data.team_size } },
          SVC_OPT
        ).then(() => this._advance()).catch(() => this._advance());
        break;

      case 4: // Tools & challenges
        this.postService(
          SERVICE.onboarding.save_usage_plan,
          { args: { tools: this._data.tools, challenges: this._data.challenges, challenge_text: this._data.challenge_text } },
          SVC_OPT
        ).then(() => this._advance()).catch(() => this._advance());
        break;

      case 5: // Goals
        this.postService(
          SERVICE.onboarding.save_usage_plan,
          { args: { goal: this._data.goal } },
          SVC_OPT
        ).then(() => this._advance()).catch(() => this._advance());
        break;

      case 6: // Invite
        {
          let emails = (this._data.invites || []).map(inv => typeof inv === 'string' ? inv : inv.email).filter(e => e && e.trim());
          const advance = () => this._advance();
          if (emails.length > 0) {
            this.postService(
              SERVICE.onboarding.send_onboarding_invites,
              { emails },
              SVC_OPT
            ).then(advance).catch(advance);
          } else {
            advance();
          }
        }
        break;

      default:
        this._advance();
        break;
    }
  }

  /**
   *
   * @param {*} res
   */
  onServerComplain(err) {
    this.warn("[onServerComplain]", err)
    Butler.say(LOCALE.INTERNAL_ERROR)
  }

  /**
   * Toggle a multi-select array field (tools, challenges)
   */
  _toggleArrayField(field, value) {
    if (!this._data[field]) this._data[field] = [];
    let idx = this._data[field].indexOf(value);
    if (idx >= 0) {
      this._data[field].splice(idx, 1);
    } else {
      this._data[field].push(value);
    }
  }

  /**
   * Update chip/option visual state
   */
  _updateOptionStates(prefix, count, field) {
    const { locale } = require("./locale");
    const loc = locale();
    const items = loc[field] || [];
    for (let i = 0; i < items.length; i++) {
      let val = typeof items[i] === 'object' ? items[i].key : items[i];
      let isOn = (Array.isArray(this._data[field]))
        ? this._data[field].includes(val)
        : this._data[field] === val;
      this.ensurePart(`${prefix}-${i}`).then((p) => {
        p.setState(isOn ? 1 : 0);
        p.el.dataset.state = isOn ? 1 : 0;
      }).catch(() => {});
    }
  }

  /**
   * User Interaction Event Handler
   */
  async onUiEvent(cmd, args = {}) {
    const service = args.service || cmd.get(_a.service);
    switch (service) {
      case _a.next:
        if (!this.checkForm()) return;
        this.commitForm();
        break;

      case _a.back:
        this._step--;
        if (this._step < 0) this._step = 0;
        this.loadForm();
        break;

      case 'skip':
        this._advance();
        break;

      case 'enter-workspace':
        localStorage.onboarding_step = "0";
        this.postService(
          SERVICE.drumate.mark_onboarding_complete,
          { hub_id: Visitor.id },
          SVC_OPT
        ).then(() => {
          if (this.mget(_a.type) == 'app') {
            this.softDestroy();
            return;
          }
          window.location.href = '/';
        }).catch(() => {
          if (this.mget(_a.type) == 'app') {
            this.softDestroy();
            return;
          }
          window.location.href = '/';
        });
        break;

      case 'select-option':
        {
          let field = cmd.el ? cmd.el.dataset.field : (args.field || '');
          let value = cmd.el ? cmd.el.dataset.value : (args.value || '');
          if (field && value) {
            this._data[field] = value;
            this.loadForm();
          }
        }
        break;

      case 'toggle-tool':
        {
          let value = cmd.el ? cmd.el.dataset.value : '';
          if (value) {
            this._toggleArrayField('tools', value);
            this.loadForm();
          }
        }
        break;

      case 'toggle-challenge':
        {
          let value = cmd.el ? cmd.el.dataset.value : '';
          if (value) {
            this._toggleArrayField('challenges', value);
            this.loadForm();
          }
        }
        break;

      case 'add-invite':
        {
          let formData = this.getData() || {};
          let email = formData.invite_email;
          if (email && email.trim()) {
            if (!this._data.invites) this._data.invites = [];
            this._data.invites.push({ email: email.trim(), role: 'Admin' });
            this.loadForm();
          }
        }
        break;

      case 'remove-invite':
        {
          let index = parseInt(cmd.el ? cmd.el.dataset.index : -1);
          if (index >= 0 && this._data.invites) {
            this._data.invites.splice(index, 1);
            this.loadForm();
          }
        }
        break;

      case _a.input:
        this.checkForm();
        break;

      case _e.close:
        localStorage.onboarding_step = "0";
        if (this.mget(_a.type) == 'app') {
          this.triggerHandlers();
          return;
        }
        this.postService(
          SERVICE.onboarding.reset, {}, SVC_OPT
        ).then(() => {
          this._saved_data = {};
          this._step = 0;
          this._data = {};
          this.feed(require('./skeleton')(this))
        });
        break;

      default:
        RADIO_BROADCAST.trigger(_e.click);
    }
  }

  /**
   * Websocket Service Endpoint
   */
  onWsMessage(service, data, options) {
    let { sender } = options;
    this.debug("AAA: ", sender, service, data, options.service, options)
  }
}

module.exports = onboarding_app
