
const SVC_OPT = { async: 1 };
const { isValidEmail, normalizeEmail } = require('./lib/email');
const { isOtherComplete, buildToolsSelection } = require('./lib/other-option');
const { classifyResponse, errorText } = require('./lib/service-result');
const { hydrate, resumeStep, firstIncompleteStep, MAX_STEP } = require('./lib/resume');

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
    // Set once the server state has been fetched, so onDomRefresh -> start()
    // firing more than once cannot re-run the restore.
    this._restored = false;
    // Last failure reported by the framework's onServerComplain hook. Read and
    // cleared by _call(); see the comment there for why it is needed.
    this._serverError = null;
    // Inline "we could not save that" banner text for the current step.
    this._saveError = null;
    // Set once at least one invite has actually gone out. Read by the close
    // handler, which finishes onboarding rather than discarding it from that
    // point on.
    this._invitesSent = false;
  }

  /**
   * Render immediately (so the wizard appears instantly, as before), then pull
   * the user's stored answers and re-render if there is anything to restore.
   *
   * Resume is server-driven. localStorage only ever held the step INDEX, so a
   * reload used to land the user on, say, step 5 with every answer blank —
   * their earlier choices were still in the database, the client simply never
   * asked for them. get_response has existed all along and was never called.
   */
  async start() {
    if (this._restored) {
      this.loadForm();
      return;
    }
    this._restored = true;
    this.loadForm();

    const restored = await this._restoreState();
    const step = this._resumeStep();
    if (restored || step !== this._step) {
      this._step = step;
      this.loadForm();
    }
  }

  /**
   * Fetch previously saved answers. Never blocks the wizard: if the read
   * fails, the user simply starts from what is on screen, and every step's
   * save is an upsert so nothing is corrupted by the missing context.
   */
  async _restoreState() {
    let res = await this._call(SERVICE.onboarding.get_response, {});
    if (!res.ok || !res.data || !res.data.session_id) return false;
    return this._hydrate(res.data);
  }

  /**
   * Merge a stored onboarding_responses row into `_data`. Field mapping and
   * JSON coercion live in lib/resume.js so they can be unit-tested.
   */
  _hydrate(row) {
    const { data, found } = hydrate(row);
    Object.assign(this._data, data);
    return found;
  }

  /**
   * Where to resume. See lib/resume.js: the stored index is honoured but never
   * placed past the first mandatory step with no answer, otherwise a user
   * whose step-2 save failed would return to step 5 and could never satisfy
   * mark_complete.
   */
  _resumeStep() {
    return resumeStep(localStorage.onboarding_step, this._data);
  }

  /**
   * Run a service call and report whether it ACTUALLY succeeded.
   *
   * This exists because postService does not reject on failure for this view.
   * ui-essentials/socket/utils.js routes both transport errors and 200-with-
   * `error` payloads through `view.onServerComplain` when the view defines it
   * — and this one does. The promise then RESOLVES (with `undefined` for a
   * transport error, or with the error payload for an application error).
   *
   * That is why the old `.then(advance).catch(advance)` was not merely
   * over-lenient: `.catch` was unreachable dead code, and `.then(advance)` ran
   * on success and failure alike. Detecting failure therefore has to be done
   * on the resolved value plus the complaint hook, not on rejection.
   */
  async _call(service, args = {}) {
    this._serverError = null;
    let res;
    try {
      res = await this.postService(service, args, SVC_OPT);
    } catch (e) {
      return { ok: false, error: this._errorText(e) };
    }
    return classifyResponse(res, this._serverError, this._fallbackError());
  }

  /**
   * Localised fallback for failures the server did not name.
   */
  _fallbackError() {
    return LOCALE.ONBOARDING_SAVE_FAILED
      || LOCALE.INTERNAL_ERROR
      || 'We could not save your answer. Please try again.';
  }

  _errorText(e) {
    return errorText(e, this._fallbackError());
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
    // Returns the promise so a caller can act once the region has actually been
    // re-fed — the add handler scrolls the new chip into view that way.
    return this.ensurePart('invite-list').then((p) => {
      p.clear();
      p.feed(invite_list(this));
    });
  }

  /**
   * Keep the newest invitee in view.
   *
   * The staged list scrolls once it passes about four entries (see
   * __invited-list in skin/form.scss). A chip appended below the fold is
   * indistinguishable from an add that did nothing, and the input has been
   * cleared by then, so there is not even the typed address left as evidence.
   */
  _scrollInviteListToEnd() {
    const run = () => {
      if (!this.el) return;
      let list = this.el.querySelector(`.${this.fig.family}__invited-list`);
      if (list) list.scrollTop = list.scrollHeight;
    };
    // After paint: feed() has returned by the time this is called, but the rows
    // it queued are not necessarily laid out, and scrollHeight before layout is
    // the height without them.
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
    else setTimeout(run, 0);
  }

  /**
   * Re-render only the "<field>-other" reveal region in place after a
   * selection/toggle change, and focus the input when it appears. Mirrors
   * _refreshInviteList — avoids a full-form rebuild / scroll reset.
   */
  _refreshOtherInput(field) {
    const { other_region, tools_other_region } = require('./skeleton/toolkit');
    this.ensurePart(`${field}-other`).then((p) => {
      p.clear();
      let kids = field === 'tools' ? tools_other_region(this) : other_region(this, field);
      p.feed(kids);
      if (kids.length && this.el) {
        let input = this.el.querySelector(`[name="${field}_other"]`);
        if (input) input.focus();
      }
    });
  }

  /**
   * Re-render the inline save-error banner in place. Same pattern as
   * _refreshInviteList: no full rebuild, so the user's inputs and scroll
   * position survive a failed save.
   */
  _refreshError() {
    const { error_region } = require('./skeleton/toolkit');
    this.ensurePart('save-error').then((p) => {
      p.clear();
      p.feed(error_region(this));
    });
  }

  /**
   * Show a failure and put the step back in a usable state so the user can
   * fix or simply retry. The answer stays in `this._data` and the step does not
   * advance.
   *
   * checkForm() rather than a flat setItemState(next, 1): a Continue that failed
   * had a valid answer by definition, so the button lights again and pressing it
   * re-sends the same payload — but a "Tell me later" that failed has just
   * emptied the answer, and forcing the button on there would offer to submit
   * nothing, which the gate exists to prevent.
   */
  _failStep(message) {
    this._saveError = message;
    this._setSubmitLoading(false);
    this.checkForm();
    this._refreshError();
  }

  /**
   * Drop the banner (on a retry, or when leaving the step).
   */
  _clearError() {
    if (!this._saveError) return;
    this._saveError = null;
    this._refreshError();
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
   * blocks clicks (see app/skin/index.scss). On success the flow advances and
   * re-feeds the footer; on failure _failStep turns it back off.
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
      // Name. The live input wins whenever it is on screen: `data.firstname` is
      // '' the moment the user clears the box, and the old fallback to the
      // stored value made an empty field still count as answered — _captureStep
      // only ever WRITES a non-empty name, so the previous one lingered in
      // _data and kept Continue lit over an empty input.
      case 0: {
        let name = data.firstname != null ? data.firstname : this._data.firstname;
        name = (name || '').trim();
        if (name) {
          completed = 1;
          this._data.firstname = name;
        } else if (data.firstname != null) {
          // Cleared on screen — drop it, so _data matches what is displayed and
          // the greeting on later steps cannot use a name that is no longer set.
          delete this._data.firstname;
        }
        break;
      }
      case 1: // Industry
        if (isOtherComplete(this._data.industry, this._data.industry_other)) completed = 1;
        break;
      case 2: // Role
        if (isOtherComplete(this._data.role, this._data.role_other)) completed = 1;
        break;
      case 3: // Team size
        if (this._data.team_size) completed = 1;
        break;
      // Tools. Nothing selected is not an answer: Continue stays disabled and
      // "Tell me later" is the way past the step. buildToolsSelection decides
      // what counts, so the button agrees with what would actually be sent —
      // in particular a bare "Other" chip with an empty input is not a
      // selection, exactly as save_onboarding_tools treats it.
      case 4: {
        let other = data.tools_other != null ? data.tools_other : this._data.tools_other;
        if (buildToolsSelection(this._data.tools, other).tools.length) completed = 1;
        break;
      }
      // Challenges. Either a picked row or a typed note counts — the note is a
      // real answer to the question, so leaving Continue disabled for someone
      // who only wrote free text would read as a broken button.
      case 5: {
        let note = data.challenge_text != null ? data.challenge_text : this._data.challenge_text;
        if ((this._data.challenges || []).length) completed = 1;
        else if ((note || '').trim()) completed = 1;
        break;
      }
      case 6: // Goals
        if (this._data.goal) completed = 1;
        break;
      // Invite. "Send invites" needs something to send: the gate is the staged
      // list, i.e. what the invite-list region shows as chips.
      //
      // Not the region's own emptiness, though it usually amounts to the same
      // thing — that region also carries the inline validation error, so a
      // rejected address ("already in the list") would make it non-empty while
      // there is still nothing to send.
      //
      // A typed-but-not-added address does not count either: "+ Add" is what
      // puts an address on the list, and the list is what gets sent.
      case 7:
        if ((this._data.invites || []).length) completed = 1;
        break;
      default: // Done
        completed = 1;
        break;
    }
    // Both directions. This used to only ever ENABLE, so a gate could be
    // satisfied and then un-satisfied — clear the name, de-select the last tool
    // — and the button stayed lit, letting an answer the step had just rejected
    // be submitted anyway.
    this.setItemState(_a.next, completed ? 1 : 0);
    return completed;
  }

  /**
   *
   */
  _advance() {
    this._inviteError = null;
    this._saveError = null;
    this._step++;
    if (this._step > MAX_STEP) this._step = MAX_STEP;
    this.loadForm();
  }

  /**
   * Persist the current step, then advance ONLY if the save succeeded.
   *
   * The previous version advanced unconditionally (`.then(advance).catch(advance)`)
   * on the theory that a network blip should not strand the user. In practice
   * it did the opposite: the answer was dropped, the user was walked to the
   * next step believing it had been recorded, and — because only step 1 could
   * INSERT the row — every later step then failed too, ending in a
   * mark_complete failure and a workspace the user was dropped into with
   * `onboarded` never set. They were sent round the whole wizard again on the
   * next login with nothing saved.
   *
   * Staying put with a visible error and a working retry is what actually
   * protects the data. The server side of the same root cause is fixed too:
   * any step can now create the row (see onboarding_resolve_row.sql), so a
   * single failure no longer poisons the rest of the flow.
   */
  async commitForm() {
    let args = this.getData() || {};
    this._clearError();
    this.setItemState(_a.next, 0);
    this._setSubmitLoading(true);

    let res;
    switch (this._step) {
      case 0: // Name → save_user_info(firstname)
        if (args.firstname) this._data.firstname = args.firstname.trim();
        res = await this._call(
          SERVICE.onboarding.save_user_info,
          { firstname: this._data.firstname }
        );
        break;

      case 1: // Industry
        {
          if (args.industry_other != null) this._data.industry_other = args.industry_other;
          let payload = { industry: this._data.industry };
          if (this._data.industry === 'other') {
            payload.industry_other = (this._data.industry_other || '').trim();
          }
          res = await this._call(SERVICE.onboarding.save_industry, payload);
        }
        break;

      case 2: // Role
        {
          if (args.role_other != null) this._data.role_other = args.role_other;
          let payload = { role: this._data.role };
          if (this._data.role === 'other') {
            payload.role_other = (this._data.role_other || '').trim();
          }
          res = await this._call(SERVICE.onboarding.save_role, payload);
        }
        break;

      case 3: // Team size
        res = await this._call(
          SERVICE.onboarding.save_team_size,
          { team_size: this._data.team_size }
        );
        break;

      case 4: // Tools. "Other" free text comes from the form via getData().
        res = await this._commitTools(args);
        break;

      case 5: // Challenges + the "tell me more" note, also from getData().
        res = await this._commitChallenges(args);
        break;

      case 6: // Intent (the "What do you want to start with?" goals screen)
        if (!this._data.goal) {
          this._advance();
          return;
        }
        res = await this._call(
          SERVICE.onboarding.save_intent,
          { intent: this._data.goal }
        );
        break;

      case 7: // Invite team members — each becomes a contact via contact/invite
        res = await this._commitInvites();
        // Sending does NOT leave the step. It used to advance to the done
        // screen, which threw the user off the list they were working on the
        // instant it succeeded — and took the "N invite(s) sent" toast with it,
        // since the toast lands on whatever screen is showing by the time it
        // paints. Staying put means the confirmation appears where the action
        // was, and a second and third teammate can be invited without walking
        // back. "Skip this step" is the way on.
        if (res && res.ok) {
          this._afterInvitesSent();
          return;
        }
        break;

      default:
        this._advance();
        return;
    }

    if (res && res.ok) {
      this._advance();
    } else {
      this._failStep((res && res.error) || this._errorText(null));
    }
  }

  /**
   * "Tell me later" / "Skip this step" — record that the user is NOT answering
   * this step, instead of walking past it.
   *
   * It used to just call _advance(), which left whatever was stored before
   * untouched. That was invisible while an empty answer could still be sent
   * with Continue, but Continue is gated on a real answer now: a user who had
   * saved tools, came back, de-selected them all and pressed "Tell me later"
   * would be told "later" while the database kept the old list forever. There
   * was no longer any path that could clear an answer.
   *
   * So skipping writes the empty answer. A failure is reported and the step
   * holds, exactly as for Continue — advancing anyway would put the record and
   * the UI back out of step, which is the whole thing this avoids.
   */
  async _skipStep() {
    // Skipping writes now, so it is no longer instantaneous: without this a
    // double-click on a slow connection fires two saves AND two _advance()
    // calls, jumping a step. The primary button protects itself by going to
    // state 0 (pointer-events: none); the secondary one has no such state.
    if (this._skipping) return;
    this._skipping = true;
    try {
      await this._skipStepOnce();
    } finally {
      this._skipping = false;
    }
  }

  async _skipStepOnce() {
    this._clearError();
    this.setItemState(_a.next, 0);

    let res;
    switch (this._step) {
      case 4: // Tools
        this._data.tools = [];
        this._data.tools_other = '';
        res = await this._call(SERVICE.onboarding.save_tools, { tools: [], tools_other: '' });
        break;

      case 5: // Challenges + note
        this._data.challenges = [];
        this._data.challenge_text = '';
        res = await this._call(SERVICE.onboarding.save_challenges, { challenges: [], note: '' });
        break;

      case 6: // Intent. '' clears the column — see save_onboarding_intent.sql,
              // which treats an empty value as "no answer" rather than as an
              // invalid enum member.
        delete this._data.goal;
        res = await this._call(SERVICE.onboarding.save_intent, { intent: '' });
        break;

      case 7:
        // Invites live in contacts, not in onboarding_responses: there is no
        // stored answer to clear, so dropping the staged addresses is the whole
        // of "later" here. Nothing to save, nothing that can fail.
        this._data.invites = [];
        this._advance();
        return;

      default:
        this._advance();
        return;
    }

    if (res && res.ok) {
      this._advance();
    } else {
      this._failStep((res && res.error) || this._errorText(null));
    }
  }

  /**
   * Step 5 (index 4). Whatever is selected is sent verbatim, so a shorter list
   * overwrites a longer one — the call is never skipped on the grounds that
   * "nothing changed", which is what used to leave a stale list in the database
   * while the UI showed something else.
   *
   * It can no longer be reached with an EMPTY selection: checkForm gates
   * Continue on a real answer, and "Tell me later" advances without saving. So
   * clearing every tool no longer records "none" — it leaves the stored answer
   * alone. That is the trade the gate makes; save_onboarding_tools still
   * accepts and overwrites with an empty array if any caller sends one.
   *
   * The "Other" free text travels in its own `tools_other` field instead of
   * being spliced into the tools array, matching how industry and role have
   * always handled it. buildToolsSelection strips a bare "other" with no text,
   * so the button, this payload and the procedure all agree on what counts as a
   * selection.
   *
   * Tools and challenges are separate steps now, so this is a single call.
   * When they shared a step it had to run the two saves sequentially rather
   * than via Promise.all, because _call reports failures through a single
   * `_serverError` slot that concurrent calls would race over — worth keeping
   * in mind before ever batching two saves into one step again.
   */
  async _commitTools(args) {
    if (args.tools_other != null) this._data.tools_other = args.tools_other;

    let selection = buildToolsSelection(this._data.tools, this._data.tools_other);

    return this._call(SERVICE.onboarding.save_tools, {
      tools: selection.tools,
      tools_other: selection.tools_other,
    });
  }

  /**
   * Step 6 (index 5). Same contract as _commitTools: both fields are sent as
   * they stand, so de-selecting rows or clearing the note overwrites, and the
   * step is only reachable with a row picked or a note typed — an entirely
   * empty answer goes through "Tell me later" instead, which saves nothing.
   */
  async _commitChallenges(args) {
    if (args.challenge_text != null) this._data.challenge_text = args.challenge_text;

    return this._call(SERVICE.onboarding.save_challenges, {
      challenges: this._data.challenges || [],
      note: this._data.challenge_text || '',
    });
  }

  /**
   * Reset the invite step after a successful send, without leaving it.
   *
   * The sent addresses are dropped from the staged list for the same reason
   * _commitInvites drops them on a partial failure: they have gone out, and a
   * second press of the button must not send them again. That empties the list,
   * so checkForm() puts "Send invites" back to disabled until another address
   * is added — the toast raised by _commitInvites is what reports the result.
   */
  _afterInvitesSent() {
    this._data.invites = [];
    this._inviteError = null;
    this._setSubmitLoading(false);
    this._refreshInviteList();
    this.checkForm();
  }

  /**
   * The "N invite(s) sent" notice (router-butler__main.notice).
   *
   * When everything went out, closing that notice IS the way on: its primary
   * button carries the user to the done screen — "Open workspace" — instead of
   * dropping them back on an invite step they have finished with. The header X
   * is dropped for the same reason (Butler.say's third argument): it fires the
   * very same _e.close, so it only offered a second, less obvious spelling of
   * the same action.
   *
   * When some addresses failed, the notice stays an ordinary dismissible one —
   * the failures are still on screen behind it, with the error banner and a
   * button that retries exactly those, and navigating away from that would lose
   * them.
   *
   * @param {String}  text
   * @param {Boolean} complete  true when nothing failed
   */
  _sayInvitesSent(text, complete) {
    const advance = () => {
      // Butler keeps _onClose armed after firing it, so an unrelated dialog
      // closed later can re-invoke this. Fixed in ui-team, but the deployed
      // bundle there may not carry the fix yet, and a stale callback that
      // silently advances the wizard is worse than a missing one. Only act
      // while the invite step is still the one on screen.
      if (this._step !== 7) return;
      this._advance();
    };
    try {
      // Third argument is ignored by an older Butler, which then simply keeps
      // its X — and since the X fires _e.close too, the navigation still works.
      Butler.say(text, complete ? advance : null, { closable: !complete });
      if (complete) this._dropNoticeClose();
    } catch (e) { /* best effort: the notice is not worth failing the send */ }
  }

  /**
   * Take the X off the "N invite(s) sent" notice.
   *
   * Belongs in Butler, and is there — header.js drops it for `closable: false`.
   * But that lives in ui-team, which deploys as the whole application, while
   * this plugin deploys on its own; the endpoint currently serving this wizard
   * is running an app build from before that option existed, so the X is still
   * rendered and the option is silently ignored.
   *
   * So the node is removed here as well. It is deliberately narrow: it runs
   * only for the notice this view just raised, and only on the complete-send
   * path where closing means "go to the workspace" rather than "dismiss". Once
   * a ui-team build carrying the option is deployed the element is never
   * created and this quietly finds nothing.
   *
   * Polled because feed() paints the notice asynchronously; bounded so a butler
   * that legitimately has no X costs half a second of cheap timers, not a
   * permanent one.
   */
  _dropNoticeClose(attempt = 0) {
    let el = null;
    try {
      el = document.querySelector('.router-butler__main.notice .router-butler__close');
    } catch (e) {
      return;
    }
    if (el) {
      el.remove();
      return;
    }
    if (attempt < 10) {
      setTimeout(() => this._dropNoticeClose(attempt + 1), 50);
    }
  }

  /**
   * Step 8 (index 7). Invites are optional, but a failure is still reported rather than
   * swallowed: addresses that went out are dropped from the staged list (so a
   * retry cannot double-send) and the ones that failed stay put with an error.
   */
  async _commitInvites() {
    let emails = (this._data.invites || [])
      .map(inv => (typeof inv === 'string' ? inv : inv.email) || '')
      .map(e => e.trim())
      .filter(Boolean);

    if (!emails.length) return { ok: true };

    let sent = [];
    let failed = [];
    for (let email of emails) {
      let r = await this._call(SERVICE.contact.invite, { email, hub_id: Visitor.id });
      if (r.ok) {
        sent.push(email);
      } else {
        failed.push(email);
      }
    }

    if (sent.length) {
      // Recorded here rather than on the all-succeeded path, because a PARTIAL
      // send still put real invitations out: those contacts exist and cannot be
      // recalled, so closing must not discard the onboarding row from this
      // point either.
      this._invitesSent = true;
      // LOCALE returns the key name itself for an unset key, so guard against
      // that (not just undefined) before falling back, otherwise the toast
      // shows the literal "ONBOARDING_INVITES_SENT".
      let tpl = LOCALE.ONBOARDING_INVITES_SENT;
      if (!tpl || tpl === 'ONBOARDING_INVITES_SENT') tpl = '{0} invite(s) sent';
      this._sayInvitesSent(tpl.replace('{0}', String(sent.length)), !failed.length);
    }

    if (!failed.length) return { ok: true };

    // Keep only what still needs sending, so pressing the button again retries
    // exactly the failures.
    this._data.invites = this._data.invites.filter((inv) => {
      let e = ((typeof inv === 'string' ? inv : inv.email) || '').trim();
      return failed.includes(e);
    });
    this._refreshInviteList();

    let tpl = LOCALE.ONBOARDING_INVITES_FAILED;
    if (!tpl || tpl === 'ONBOARDING_INVITES_FAILED') tpl = 'Could not invite: {0}';
    return { ok: false, error: tpl.replace('{0}', failed.join(', ')) };
  }

  /**
   * Record the failure instead of only toasting it.
   *
   * The framework calls this for BOTH transport errors and 200-with-`error`
   * payloads, and then resolves the promise regardless — so this hook is the
   * only place some failures are observable at all. _call reads and clears the
   * slot; the inline banner replaces the toast so the message sits next to the
   * step that failed rather than floating away.
   */
  onServerComplain(err) {
    this.warn("[onServerComplain]", err)
    this._serverError = this._errorText(err);
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
    if (data.industry_other != null) this._data.industry_other = data.industry_other;
    if (data.role_other != null) this._data.role_other = data.role_other;
    if (data.tools_other != null) this._data.tools_other = data.tools_other;
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
   * Leave the wizard. Both calls must succeed: mark_complete validates that
   * the mandatory steps really are stored, and update_profile is what sets
   * `onboarded = 1` — the flag desk reads to decide whether to show the wizard
   * again. Exiting when either fails is what produced the worst symptom of the
   * old flow: the user was dropped into the workspace believing they were
   * done, and met the wizard again on their next login.
   */
  async _enterWorkspace() {
    this._clearError();
    this.setItemState(_a.next, 0);
    this._setSubmitLoading(true);

    let res = await this._call(SERVICE.onboarding.mark_complete, {});
    if (res.ok) {
      res = await this._call(SERVICE.onboarding.update_profile, {});
    }
    if (!res.ok) {
      // mark_complete refuses with "Step N is incomplete" when a mandatory
      // answer never reached the server. The done screen carries no Back
      // button, so simply reporting the error here would trap the user on a
      // screen with one button that can only fail again. Send them to the step
      // that needs fixing, with the reason shown there.
      const gap = firstIncompleteStep(this._data);
      this._setSubmitLoading(false);
      this._saveError = res.error;
      if (gap >= 0) {
        this._step = gap;
      }
      this.loadForm();
      return;
    }

    localStorage.onboarding_step = "0";
    if (this.mget(_a.type) == 'app') {
      this.softDestroy();
      return;
    }
    window.location.href = '/';
  }

  /**
   * Close/reset. Clears BOTH sides: the server drops the stored answers
   * (reset_onboarding_response) and the client drops its cached state and step
   * index. Previously the service only threw away the session, which left an
   * unreachable half-filled row behind and restarted the wizard against a
   * session that no longer existed.
   */
  async _reset() {
    localStorage.onboarding_step = "0";
    if (this.mget(_a.type) == 'app') {
      this.triggerHandlers();
      return;
    }
    let res = await this._call(SERVICE.onboarding.reset, {});
    if (!res.ok) {
      this._failStep(res.error);
      return;
    }
    this._step = 0;
    this._data = {};
    this._inviteError = null;
    this._saveError = null;
    this.loadForm();
  }

  /**
   * User Interaction Event Handler
   */
  async onUiEvent(cmd, args = {}) {
    const service = args.service || cmd.get(_a.service);
    switch (service) {
      case _a.next:
        if (!this.checkForm()) return;
        await this.commitForm();
        break;

      case _a.back:
        // Preserve what's on the current step before leaving it, so values
        // are restored when the user navigates forward again. Selections
        // already live in this._data (written on select/toggle); only the
        // free-text fields still sit in the rendered Entries.
        this._captureStep();
        this._inviteError = null;
        this._saveError = null;
        this._step--;
        if (this._step < 0) this._step = 0;
        this.loadForm();
        break;

      case 'skip':
        await this._skipStep();
        break;

      case 'enter-workspace':
        await this._enterWorkspace();
        break;

      // Every single-select group (industry, role, team size, goal): first click
       // selects, a second click on the same option clears it. Clicking a
      // different option moves the selection, so only one is ever lit.
      //
      // Clearing a MANDATORY step's answer leaves Continue disabled and no way
      // forward but to pick something — which is the honest state, since
      // mark_onboarding_complete refuses without industry, role and team size.
      // Being able to undo a mis-click without having to pick a wrong answer to
      // replace it is worth that.
      case 'toggle-option':
        {
          let field = cmd.el ? cmd.el.dataset.field : (args.field || '');
          let value = cmd.el ? cmd.el.dataset.value : (args.value || '');
          if (field && value) {
            let on = this._data[field] !== value;
            if (on) {
              this._data[field] = value;
            } else {
              delete this._data[field];
            }
            // null clears every chip in the group: no option's value can match
            // it, so they all fall back to data-state="0".
            this._selectOption(field, on ? value : null);
            // Reveal or hide the "<field>-other" input. Unselecting "Other"
            // has to take its text box away with it, otherwise the step keeps
            // a filled-in field belonging to an option nobody has chosen.
            if (field === 'industry' || field === 'role') {
              this._refreshOtherInput(field);
            }
            this._clearError();
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
            if (value === 'other') this._refreshOtherInput('tools');
            // Continue is gated on a non-empty selection now, so every toggle
            // has to re-evaluate it — in both directions.
            this._clearError();
            this.checkForm();
          }
        }
        break;

      case 'toggle-challenge':
        {
          let value = cmd.el ? cmd.el.dataset.value : '';
          if (value) {
            this._toggleArrayField('challenges', value);
            this._toggleChip(cmd, (this._data.challenges || []).includes(value));
            this._clearError();
            this.checkForm();
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
          this._refreshInviteList().then(() => {
            if (added) this._scrollInviteListToEnd();
          });
          if (added) this._clearInviteInput();
          // "Send invites" is gated on the list being non-empty.
          this.checkForm();
        }
        break;

      case 'remove-invite':
        {
          let index = parseInt(cmd.el ? cmd.el.dataset.index : -1);
          if (index >= 0 && this._data.invites) {
            this._data.invites.splice(index, 1);
            this._inviteError = null;
            this._refreshInviteList();
            // Removing the last one has to put the button back to disabled.
            this.checkForm();
          }
        }
        break;

      case _a.input:
        this._captureStep();
        this.checkForm();
        break;

      case _e.close:
        // Once invites have gone out, closing FINISHES onboarding instead of
        // discarding it: it moves to the done screen, where "Open workspace"
        // runs mark_complete + update_profile.
        //
        // The alternative was destructive and silently so. _reset() wipes the
        // stored answers (reset_onboarding_response DELETEs the row), so a user
        // who had just invited their team and pressed X lost every answer they
        // had given — while the invites themselves, already sent as contacts,
        // could not be taken back. Nothing about "close" said that.
        if (this._step === 7 && this._invitesSent) {
          this._advance();
          break;
        }
        await this._reset();
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
