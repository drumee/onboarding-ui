
const SVC_OPT = { async: 1 };
const MAX_STEP = 7;
const { isValidEmail, normalizeEmail } = require('./lib/email');

class onboarding_app extends LetcBox {

  /**
   * Pin the BEM family explicitly. The framework otherwise derives `fig.family`
   * from `this.constructor.name`, which Terser mangles to a single letter (e.g.
   * `e`) in production builds — yielding `e__main` instead of `onboarding-app__main`.
   */
  static initClass() {
    this.prototype.figName = "onboarding_app";
  }

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
   * Re-render only the step-6 invite list region (validation error + staged
   * chips) in place, instead of re-feeding the whole step via loadForm().
   * Avoids the flash / scroll-reset of a full rebuild and keeps the email
   * input (which lives outside this part) untouched.
   */
  _refreshInviteList() {
    const { invite_list } = require('./skeleton/toolkit');
    this.ensurePart('invite-list').then((p) => {
      p.clear();
      p.feed(invite_list(this));
    });
  }

  /**
   * Clear and refocus the invite email input after a successful add, without
   * rebuilding it.
   */
  _clearInviteInput() {
    if (!this.el) return;
    let input = this.el.querySelector('[name="invite_email"]');
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  /**
   * Toggle a loading state on the step-6 primary ("Send invites") button while
   * the contact/invite calls are in flight. `is-loading` shows a spinner and
   * blocks clicks (see app/skin/index.scss). No explicit reset is needed on
   * success/failure because the flow advances and re-feeds the footer, but we
   * expose `off` for safety.
   */
  _setSubmitLoading(on) {
    if (!this.el) return;
    let btn = this.el.querySelector(`.${this.fig.family}__primary-btn`);
    if (!btn) return;
    if (on) {
      btn.classList.add('is-loading');
      btn.setAttribute('data-state', '1'); // keep the active look; is-loading blocks clicks
    } else {
      btn.classList.remove('is-loading');
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
    this._inviteError = null;
    this._step++;
    if (this._step > MAX_STEP) this._step = MAX_STEP;
    this.loadForm();
  }

  /**
   * Persist the current step's data via its dedicated loby endpoint, then
   * advance. We always advance — even on failure — so a transient network
   * blip can't strand the user mid-wizard; the user's choice stays in
   * `this._data` and is re-sent next time mark_complete validates the row.
   */
  commitForm() {
    let args = this.getData() || {};
    this.setItemState(_a.next, 0);
    const advance = () => this._advance();

    switch (this._step) {
      case 0: // Name → save_user_info(firstname)
        if (args.firstname) this._data.firstname = args.firstname.trim();
        this.postService(
          SERVICE.onboarding.save_user_info,
          { firstname: this._data.firstname },
          SVC_OPT
        ).then(advance).catch(advance);
        break;

      case 1: // Industry
        this.postService(
          SERVICE.onboarding.save_industry,
          { industry: this._data.industry },
          SVC_OPT
        ).then(advance).catch(advance);
        break;

      case 2: // Role
        this.postService(
          SERVICE.onboarding.save_role,
          { role: this._data.role },
          SVC_OPT
        ).then(advance).catch(advance);
        break;

      case 3: // Team size
        this.postService(
          SERVICE.onboarding.save_team_size,
          { team_size: this._data.team_size },
          SVC_OPT
        ).then(advance).catch(advance);
        break;

      case 4: // Tools + challenges. Free-text comes from the form via getData().
        {
          if (args.challenge_text != null) {
            this._data.challenge_text = args.challenge_text;
          }
          let tools = this._data.tools || [];
          let challenges = this._data.challenges || [];
          let note = this._data.challenge_text || '';
          let saveTools = tools.length
            ? this.postService(SERVICE.onboarding.save_tools, { tools }, SVC_OPT)
            : Promise.resolve();
          let saveChallenges = (challenges.length || note)
            ? this.postService(
                SERVICE.onboarding.save_challenges,
                { challenges, note },
                SVC_OPT
              )
            : Promise.resolve();
          Promise.all([saveTools, saveChallenges]).then(advance).catch(advance);
        }
        break;

      case 5: // Intent (the "What do you want to start with?" goals screen)
        if (this._data.goal) {
          this.postService(
            SERVICE.onboarding.save_intent,
            { intent: this._data.goal },
            SVC_OPT
          ).then(advance).catch(advance);
        } else {
          advance();
        }
        break;

      case 6: // Invite team members — each becomes a contact via contact/invite
        {
          let emails = (this._data.invites || [])
            .map(inv => (typeof inv === 'string' ? inv : inv.email) || '')
            .map(e => e.trim())
            .filter(Boolean);

          if (!emails.length) {
            advance();
            break;
          }

          this._setSubmitLoading(true);

          let calls = emails.map(email =>
            this.postService(
              SERVICE.contact.invite,
              { email, hub_id: Visitor.id },
              SVC_OPT
            ).then(res => ({ email, res }))
             .catch(() => ({ email, res: { status: 'SERVICE_ERROR' } }))
          );

          Promise.all(calls).then(results => {
            // Treat a response without a known error status as success.
            const FAIL = ['INVALID_DATA', 'SERVICE_ERROR'];
            let sent = results.filter(r => !FAIL.includes(r.res && r.res.status)).length;
            // LOCALE returns the key name itself for an unset key, so guard
            // against that (not just undefined) before falling back, otherwise
            // the toast shows the literal "ONBOARDING_INVITES_SENT".
            let tpl = LOCALE.ONBOARDING_INVITES_SENT;
            if (!tpl || tpl === 'ONBOARDING_INVITES_SENT') tpl = '{0} invite(s) sent';
            let msg = tpl.replace('{0}', String(sent));
            try { Butler.say(msg); } catch (e) { /* toast is best-effort */ }
            advance();
          }).catch(advance);
        }
        break;

      default:
        advance();
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
   * Highlight the chosen chip in a single-select group and clear the others,
   * in place — no form rebuild. Selection styling is driven purely by the
   * [data-state] attribute (see app/skin/form.scss).
   */
  _selectOption(field, value) {
    if (!this.el) return;
    let chips = this.el.querySelectorAll(`[data-field="${field}"]`);
    for (let chip of chips) {
      chip.setAttribute('data-state', chip.dataset.value === value ? '1' : '0');
    }
  }

  /**
   * Toggle a single multi-select chip's selected state in place.
   */
  _toggleChip(cmd, on) {
    if (cmd && cmd.el) cmd.el.setAttribute('data-state', on ? '1' : '0');
  }

  /**
   * Snapshot the current step's free-text inputs into this._data so they
   * survive backward navigation and re-render. Single/multi-select values are
   * already committed to this._data as the user clicks, so only text entries
   * (firstname, challenge_text) need capturing here.
   */
  _captureStep() {
    let data = this.getData() || {};
    if (data.firstname != null && data.firstname.trim()) {
      this._data.firstname = data.firstname.trim();
    }
    if (data.challenge_text != null) {
      this._data.challenge_text = data.challenge_text;
    }
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
        // Preserve what's on the current step before leaving it, so values
        // are restored when the user navigates forward again. Selections
        // already live in this._data (written on select/toggle); only the
        // free-text fields still sit in the rendered Entries.
        this._captureStep();
        this._inviteError = null;
        this._step--;
        if (this._step < 0) this._step = 0;
        this.loadForm();
        break;

      case 'skip':
        this._advance();
        break;

      case 'enter-workspace':
        localStorage.onboarding_step = "0";
        {
          const exit = () => {
            if (this.mget(_a.type) == 'app') {
              this.softDestroy();
              return;
            }
            window.location.href = '/';
          };
          this.postService(SERVICE.onboarding.mark_complete, {}, SVC_OPT)
            .then(() => this.postService(SERVICE.onboarding.update_profile, {}, SVC_OPT))
            .then(exit)
            .catch(exit);
        }
        break;

      case 'select-option':
        {
          let field = cmd.el ? cmd.el.dataset.field : (args.field || '');
          let value = cmd.el ? cmd.el.dataset.value : (args.value || '');
          if (field && value) {
            this._data[field] = value;
            // Reflect the selection in place rather than rebuilding the whole
            // form. The selected look is CSS-driven via [data-state="1"]
            // (see app/skin/form.scss), so toggling the attribute on the chips
            // in this field group avoids the visible flash / scroll reset that
            // a full loadForm() re-feed causes.
            this._selectOption(field, value);
            this.checkForm();
          }
        }
        break;

      case 'toggle-tool':
        {
          let value = cmd.el ? cmd.el.dataset.value : '';
          if (value) {
            this._toggleArrayField('tools', value);
            this._toggleChip(cmd, (this._data.tools || []).includes(value));
          }
        }
        break;

      case 'toggle-challenge':
        {
          let value = cmd.el ? cmd.el.dataset.value : '';
          if (value) {
            this._toggleArrayField('challenges', value);
            this._toggleChip(cmd, (this._data.challenges || []).includes(value));
          }
        }
        break;

      case 'add-invite':
        {
          let formData = this.getData() || {};
          let email = normalizeEmail(formData.invite_email || '');
          this._inviteError = null;
          let added = false;

          if (!email) {
            this._inviteError = LOCALE.EMAIL_REQUIRED || 'Please enter an email address.';
          } else if (!isValidEmail(email)) {
            this._inviteError = LOCALE.INVALID_EMAIL_FORMAT || 'Please enter a valid email address.';
          } else if (email === normalizeEmail((Visitor.profile && Visitor.profile().email) || '')) {
            this._inviteError = LOCALE.CANNOT_ADD_SELF_AS_CONTACT || 'You cannot add yourself.';
          } else {
            if (!this._data.invites) this._data.invites = [];
            let dup = this._data.invites.some(inv => normalizeEmail(inv.email || inv) === email);
            if (dup) {
              this._inviteError = LOCALE.ALREADY_IN_LIST || 'That email is already in the list.';
            } else {
              this._data.invites.push({ email });
              added = true;
            }
          }
          // Re-render only the invite-list region (error + chips) in place,
          // not the whole step — no flash / scroll reset. Clear the input only
          // on a successful add so a rejected entry stays editable.
          this._refreshInviteList();
          if (added) this._clearInviteInput();
        }
        break;

      case 'remove-invite':
        {
          let index = parseInt(cmd.el ? cmd.el.dataset.index : -1);
          if (index >= 0 && this._data.invites) {
            this._data.invites.splice(index, 1);
            this._inviteError = null;
            this._refreshInviteList();
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

onboarding_app.initClass();

module.exports = onboarding_app
