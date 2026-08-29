
const SVC_OPT = { async: 1 };
const { isOtherComplete, buildToolsSelection } = require('./lib/other-option');
const { classifyResponse, errorText } = require('./lib/service-result');
const { hydrate, resumeStep, firstIncompleteStep, MAX_STEP } = require('./lib/resume');
const { loc, loct } = require('./lib/locale-text');

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
    const generic = loc('INTERNAL_ERROR', 'We could not save your answer. Please try again.');
    return loc('ONBOARDING_SAVE_FAILED', generic);
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
   * Re-render only the "<field>-other" reveal region in place after a
   * selection/toggle change, and focus the input when it appears. Mirrors
   * Avoids a full-form rebuild / scroll reset.
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
   * No full rebuild, so the user's inputs and scroll
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
   * Toggle a loading state on the primary button while a submit is in flight.
   * `is-loading` shows a spinner and
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
        break;      default: // Done
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

      case _a.input:
        this._captureStep();
        this.checkForm();
        break;

      case _e.close:
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
