
const SVC_OPT = { async: 1 };
const MAX_STEP = 3;
const TEAM_TYPES = ['personal', 'startup', 'enterprise'];

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
    this._shareLink = '';
    this._referralCode = null;
    this._inviteCount = 2;
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
    if (this._step === 1 && !this._shareLink) {
      this.fetchInviteLink();
    }
    this.feed(require('./skeleton')(this))
    this.checkForm()
  }

  /**
   * Fetch referral invite link from backend
   */
  async fetchInviteLink() {
    try {
      let data = await this.postService(
        SERVICE.onboarding.get_onboarding_invite_link, {}, SVC_OPT
      );
      if (data) {
        this._referralCode = data.referral_code;
        this._shareLink = data.referral_url;
      }
    } catch (e) {
      this.warn("Failed to fetch invite link", e);
    }
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
    if (_.isEmpty(data)) {
      data = this._saved_data[this._step] || {}
    }
    let completed = 0;
    switch (this._step) {
      case 0: // Team type - must select exactly one
        if (data.team_type || this._data.team_type) {
          completed = 1;
          if (data.team_type) this._data.team_type = data.team_type;
        }
        break;
      case 1: // Invite team
        completed = 1;
        break;
      case 2: // Welcome - all set (info only)
        completed = 1;
        break;
      case 3: // See in action
        completed = 1;
        break;
    }
    if (completed) {
      this.setItemState(_a.next, 1)
    }
    return completed;
  }

  /**
   * Collect invite emails from form
   */
  _collectEmails(formData) {
    let emails = [];
    for (let i = 0; i < this._inviteCount; i++) {
      let email = formData[`invite_email_${i}`];
      if (email && email.trim() && String(email.trim()).isEmail()) {
        emails.push(email.trim());
      }
    }
    return emails;
  }

  /**
   *
   */
  commitForm() {
    let args = this.getData()
    this.setItemState(_a.next, 0)
    switch (this._step) {
      case 0: // Team type
        this.postService(
          SERVICE.onboarding.save_usage_plan, { args: this._data.team_type }, SVC_OPT
        ).then((data) => {
          this._saved_data[this._step] = { team_type: this._data.team_type };
          this._step++;
          if (this._step > MAX_STEP) this._step = MAX_STEP;
          this.loadForm()
        });
        break;
      case 1: // Invite team
        {
          let emails = this._collectEmails(args);
          const advance = () => {
            this._saved_data[this._step] = { invites: emails };
            this._data.invites = emails;
            this._step++;
            if (this._step > MAX_STEP) this._step = MAX_STEP;
            this.loadForm()
          };
          if (emails.length > 0) {
            this.postService(
              SERVICE.onboarding.send_onboarding_invites, { emails }, SVC_OPT
            ).then(advance);
          } else {
            advance();
          }
        }
        break;
      case 2: // Welcome (info step)
        this._saved_data[this._step] = args;
        this._step++;
        if (this._step > MAX_STEP) this._step = MAX_STEP;
        this.loadForm()
        break;
      case 3: // See in action - final
        this._saved_data[this._step] = args;
        this._step++;
        if (this._step > MAX_STEP) this._step = MAX_STEP;
        this.loadForm()
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
   * User Interaction Event Handler
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
      case 'skip':
        // When skipping invite step, still notify backend
        if (this._step === 1) {
          this.postService(
            SERVICE.onboarding.send_onboarding_invites, { emails: [] }, SVC_OPT
          ).then(() => {
            this._step++;
            if (this._step > MAX_STEP) this._step = MAX_STEP;
            this.loadForm()
          }).catch(() => {
            this._step++;
            if (this._step > MAX_STEP) this._step = MAX_STEP;
            this.loadForm()
          });
        } else {
          this._step++;
          if (this._step > MAX_STEP) this._step = MAX_STEP;
          this.loadForm()
        }
        break;
      case 'enter-workspace':
        localStorage.onboarding_step = "0";
        this.postService(
          SERVICE.drumate.mark_onboarding_complete, 
          {
            hub_id: Visitor.id,
          }, SVC_OPT
        ).then((data) => {
          this.debug("Onboarding marked complete", data);
          if (this.mget(_a.type) == 'app') {
            this.softDestroy();
            return;
          }
          window.location.href = '/';
        }).catch((e) => {
          this.warn("mark_onboarding_complete error", e);
          if (this.mget(_a.type) == 'app') {
            this.softDestroy();
            return;
          }
          window.location.href = '/';
        });
        break;
      case "select-country":
        if (args.source) {
          this._data.country = args.source.mget('country_code');
          this.checkForm();
        }
        break;
      case _a.input:
        this.checkForm();
        break;
      case _e.select:
        this.checkForm();
        break;
      case 'select-team-type':
        {
          let selectedName = cmd.mget(_a.name);
          if (selectedName && TEAM_TYPES.includes(selectedName)) {
            this._data.team_type = selectedName;
            for (let tt of TEAM_TYPES) {
              this.ensurePart(`team-type-${tt}`).then((p) => {
                if (tt === selectedName) {
                  p.setState(1);
                  p.el.dataset.state = "1";
                } else {
                  p.setState(0);
                  p.el.dataset.state = "0";
                }
              });
            }
            this.setItemState(_a.next, 1);
            setTimeout(() => {
              this.commitForm();
            }, 400);
          }
        }
        break;
      case 'add-invite':
        {
          let currentData = this.getData() || {};
          let currentEmails = [];
          for (let i = 0; i < this._inviteCount; i++) {
            let email = currentData[`invite_email_${i}`];
            if (email) currentEmails.push(email);
            else currentEmails.push('');
          }
          this._data.invites = currentEmails;
          this._data.invites.push('');
          this._inviteCount++;
          this.loadForm();
        }
        break;
      case 'copy-share-link':
        {
          let link = this._shareLink;
          if (!link) {
            Butler.say("Loading invite link...");
            await this.fetchInviteLink();
            link = this._shareLink;
          }
          if (link && navigator.clipboard) {
            navigator.clipboard.writeText(link).then(() => {
              Butler.say("Link copied to clipboard!");
            }).catch(() => {
              Butler.say("Could not copy link");
            });
          }
        }
        break;
      case 'send-chat':
        break;
      case _e.close:
        localStorage.onboarding_step = "0";
        if (this.mget(_a.type) == 'app') {
          this.triggerHandlers()
          return;
        }
        this.postService(
          SERVICE.onboarding.reset, {}, SVC_OPT
        ).then((data) => {
          this._saved_data = {};
          this._step = 0;
          this.feed(require('./skeleton')(this))
        })
        break;
      default:
        RADIO_BROADCAST.trigger(_e.click);
    }
  }

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
