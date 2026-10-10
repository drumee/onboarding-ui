/* ==================================================================== *
 * org_setup — "Set up your organization", B2B Org Structure (Figma
 * Drumee 2.0, section 900:149745 "1. create drumee org").
 *
 * Three steps behind a three-segment progress bar:
 *   0  name the organisation and its departments
 *   1  put workspaces into each department (existing or new)
 *   2  invite people by email to the workspaces of chosen departments
 *
 * Opened by the desk (Wm "org-setup-form") for an organisation owner whose
 * organisation has no department yet and never finished this wizard. Every
 * write is an existing organization.* / desk.* / hub.* service; the wizard
 * only records that it was finished (organization.setup_done) so the desk
 * stops offering it.
 *
 * Custom domain (Figma: "northbeam.drumee.com") is the organisation's
 * address label, <ident>.<main domain>. Step 0 only CHECKS the label
 * (organization.ident_check); the move itself (organization.change_ident)
 * waits for Finish, because the page is served from the current address and
 * stops resolving the moment it changes: Finish moves, then reloads the desk
 * on the new address. Bringing one's own domain (DNS / email verification)
 * is the "later in Settings" part of the hint, not this wizard.
 * ==================================================================== */
const { loc } = require("../lib/locale-text");

const STEPS = 3;

class org_setup extends LetcBox {

  /**
   * Pin the BEM family: Terser mangles constructor names in production.
   */
  static initClass() {
    this.prototype.figName = "org_setup";
  }

  /**
   *
   */
  initialize(opt = {}) {
    require("./skin");
    super.initialize(opt);
    this.declareHandlers();
    this._step = 0;
    this._busy = false;
    this._error = "";
    this._name = (Organization && Organization.name && Organization.name()) || "";
    // Step 0: department names as typed. Existing departments are listed too
    // (from the overview) so a second visit shows what is already there.
    this._deptNames = [];
    this._removed = new Set(); // existing department ids the user x'ed
    this._overview = { departments: [], workspaces: [], organisation: null };
    // Step 1: which department's "+ Add workspace" picker is open, its query,
    // and whether its "+ New workspace" field is showing.
    this._pickerFor = null;
    this._pickerQuery = "";
    this._newWsFor = null;
    // Step 2
    this._selected = new Set(); // department ids to invite to
    this._sent = null; // { ok, failed } after a send
    // Public link (Figma 998:85923): which tab, the expiry choice and the
    // minted link { token, url, expires_at }.
    this._tab = "email";
    this._expiry = "7d";
    this._customDays = 30;
    this._link = null;
    // Custom domain: the current address split as <ident>.<suffix>, whether
    // the field is switched on, what is typed, and a label checked free at
    // step 0 that Finish will move to.
    const host = String(
      (Organization && Organization.host && Organization.host()) || location.hostname,
    ).toLowerCase();
    const dot = host.indexOf(".");
    this._identNow = dot > 0 ? host.slice(0, dot) : host;
    this._identSuffix = dot > 0 ? host.slice(dot + 1) : "";
    this._identOn = true;
    this._identDraft = this._identNow;
    this._pendingIdent = null;
  }

  /**
   *
   */
  onDomRefresh() {
    this._load().then(() => {
      this._deptNames = this._overview.departments.map((d) => ({ id: d.id, name: d.name }));
      // A new organisation starts from three suggested departments the owner
      // renames or removes (Figma 900:149766 "auto display 3 dept for user to
      // enter the name", 900:150729). Nothing is created until Continue.
      if (!this._deptNames.length) {
        this._deptNames = [
          loc("DEPT_SUGGEST_MARKETING", "Marketing"),
          loc("DEPT_SUGGEST_ENGINEERING", "Engineering"),
          loc("DEPT_SUGGEST_DESIGN", "Design"),
        ].map((name) => ({ id: null, name }));
      }
      this._render();
    });
    this._render();
  }

  /**
   * Re-read the organisation's departments and workspaces.
   */
  async _load() {
    const res = await this._call(SERVICE.organization.overview, {});
    if (!res.ok) return;
    const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
    const d = res.data || {};
    this._overview = {
      organisation: d.organisation || null,
      departments: list(d.departments),
      workspaces: list(d.workspaces),
    };
  }

  /**
   *
   */
  _render() {
    if (this.isDestroyed && this.isDestroyed()) return;
    // A repaint rebuilds every field: keep what was typed in the ones whose
    // value lives only in the DOM (the org name, the email list).
    const name = this._value("org-name");
    if (name) this._name = name;
    if (this.getPart && this.getPart("emails")) this._emailsRaw = this._value("emails");
    this.feed(require("./skeleton")(this));
  }

  /**
   * The framework routes 200-with-error and transport failures here instead
   * of rejecting the promise; _call reads what it left.
   */
  onServerComplain(xhr) {
    this._complaint = xhr || {};
  }

  /**
   * A service call that reports whether it really succeeded.
   *
   * @returns {Promise<{ok:Boolean, data:Object, status:String}>}
   */
  async _call(service, args = {}) {
    if (!service) return { ok: false, status: "SERVICE_UNAVAILABLE" };
    this._complaint = null;
    let data;
    try {
      data = await this.postService(service, { hub_id: Visitor.id, ...args });
    } catch (e) {
      return { ok: false, status: "FAILED" };
    }
    if (this._complaint || data === undefined || data === null) {
      return { ok: false, status: (data && data.status) || "FAILED" };
    }
    if (data && data.status && data.status !== "OK") {
      return { ok: false, status: String(data.status), data };
    }
    return { ok: true, data };
  }

  /**
   * A refusal's message: the server's status has a locale row of the same
   * name (DEPARTMENT_EXISTS, ...), else the generic one.
   */
  _message(status) {
    const known = {
      INVALID_IDENT: "Use 2 to 40 lowercase letters, numbers or dashes (not at the start or end).",
      IDENT_RESERVED: "This address is reserved. Please pick another one.",
      IDENT_NOT_AVAILABLE: "This address is already taken. Please pick another one.",
    };
    if (known[status]) return loc(status, known[status]);
    return loc(status, loc("SOMETHING_WENT_WRONG", "Something went wrong. Please try again."));
  }

  /**
   * The value of an Entry part, trimmed.
   */
  _value(pn) {
    const p = this.getPart && this.getPart(pn);
    return String((p && p.getValue && p.getValue()) || "").trim();
  }

  // ── Step 0 ─────────────────────────────────────────────────────────────

  /**
   * Add the typed department name as a chip and clear the field.
   */
  _addDeptName() {
    const name = this._value("dept-entry");
    if (!name) return;
    const exists = this._deptNames.some((d) => d.name.toLowerCase() === name.toLowerCase());
    if (!exists) this._deptNames.push({ id: null, name });
    this._error = "";
    this._render();
  }

  /**
   * x on a chip: a typed one is simply dropped; an existing department is
   * removed on Continue (its workspaces survive, ungrouped).
   */
  _removeDeptName(index) {
    const d = this._deptNames[index];
    if (!d) return;
    if (d.id) this._removed.add(String(d.id));
    this._deptNames.splice(index, 1);
    this._render();
  }

  /**
   * Continue from step 0: rename the organisation if its name changed, add
   * the new departments, remove the x'ed ones.
   */
  async _commitStep0() {
    // A name still sitting in the field counts as added.
    this._addDeptNameSilently();
    const name = this._value("org-name") || this._name;
    if (!name) {
      this._error = loc("ORG_NAME_REQUIRED", "Give your organization a name.");
      return this._render();
    }
    this._name = name;
    this._readIdent();
    if (!this._deptNames.length) {
      this._error = loc("ADD_ONE_DEPARTMENT", "Add at least one department.");
      return this._render();
    }
    this._busy = true;
    this._render();
    // Check the address now, move it at Finish (see the header).
    this._pendingIdent = null;
    if (this._identOn && this._identDraft && this._identDraft !== this._identNow) {
      const r = await this._call(SERVICE.organization.ident_check, { ident: this._identDraft });
      if (!r.ok) return this._fail(r.status);
      this._pendingIdent = this._identDraft;
    }
    if (name !== ((Organization && Organization.name && Organization.name()) || "")) {
      const r = await this._call(SERVICE.organization.rename, { name });
      if (!r.ok) return this._fail(r.status);
      if (Organization && Organization.set) Organization.set(_a.name, name);
      this._name = name;
    }
    for (const id of this._removed) {
      const r = await this._call(SERVICE.organization.department_remove, { department_id: id });
      if (!r.ok && r.status !== "DEPARTMENT_NOT_FOUND") return this._fail(r.status);
    }
    this._removed.clear();
    for (const d of this._deptNames) {
      if (d.id) continue;
      const r = await this._call(SERVICE.organization.department_add, { name: d.name });
      if (!r.ok && r.status !== "DEPARTMENT_EXISTS") return this._fail(r.status);
      if (r.ok && r.data) d.id = r.data.id;
    }
    await this._load();
    this._deptNames = this._overview.departments.map((x) => ({ id: x.id, name: x.name }));
    this._busy = false;
    this._error = "";
    this._step = 1;
    this._render();
  }

  /**
   * What is in the address field, normalised the way the server checks it.
   */
  _readIdent() {
    if (!this._identOn) return;
    const p = this.getPart && this.getPart("org-ident");
    if (!p || !p.getValue) return;
    // Only the label is typed; a pasted full address is cut back to it.
    const raw = String(p.getValue() || "").trim().toLowerCase();
    const tail = `.${this._identSuffix}`;
    this._identDraft = this._identSuffix && raw.endsWith(tail) ? raw.slice(0, -tail.length) : raw;
  }

  /**
   * The address label's entry is as wide as its text, so the fixed domain
   * after it reads as one address (northbeam.drumee.com). Measured with the
   * input's own font; a click anywhere in the field focuses it.
   */
  _fitIdent(part) {
    const input = part && part.el && part.el.querySelector("input");
    if (!input || input.dataset.fit) return;
    input.dataset.fit = "1";
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const fit = () => {
      const cs = getComputedStyle(input);
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const text = input.value || input.placeholder || "";
      input.style.width = `${Math.ceil(ctx.measureText(text).width) + 2}px`;
    };
    input.addEventListener("input", fit);
    fit();
    const box = part.el.parentElement;
    if (box) box.addEventListener("click", (e) => { if (e.target !== input) input.focus(); });
  }

  /**
   * @param {View} child
   * @param {String} pn
   */
  onPartReady(child, pn) {
    if (pn === "org-ident") this._fitIdent(child);
    if (super.onPartReady) super.onPartReady(child, pn);
  }

  _addDeptNameSilently() {
    const name = this._value("dept-entry");
    if (name && !this._deptNames.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      this._deptNames.push({ id: null, name });
    }
  }

  // ── Step 1 ─────────────────────────────────────────────────────────────

  /**
   * Put a workspace into a department, or (department '') take it out.
   */
  async _assign(hubId, deptId) {
    this._busy = true;
    const r = await this._call(SERVICE.organization.department_assign, {
      nid: hubId,
      department_id: deptId || "",
    });
    if (!r.ok) return this._fail(r.status);
    await this._load();
    this._busy = false;
    this._error = "";
    this._render();
  }

  /**
   * "+ New workspace" in a department's picker: create it, then put it in.
   */
  async _createWorkspace(deptId) {
    const name = this._value("new-ws-entry");
    if (!name) return;
    this._busy = true;
    this._render();
    const r = await this._call(SERVICE.desk.create_hub, { filename: name, area: "private" });
    if (!r.ok) return this._fail(r.status);
    const hubId = r.data && (r.data.hub_id || r.data.id);
    this._newWsFor = null;
    this._pickerFor = null;
    if (hubId) {
      RADIO_BROADCAST.trigger("workspace:refresh");
      return this._assign(hubId, deptId);
    }
    await this._load();
    this._busy = false;
    this._render();
  }

  // ── Step 2 ─────────────────────────────────────────────────────────────

  /**
   * Emails from the field: split on commas, semicolons and spaces, lower-
   * cased, de-duplicated, crudely validated (the server validates again).
   */
  _emails() {
    const raw = this._value("emails") || this._emailsRaw || "";
    const out = [];
    for (const part of raw.split(/[\s,;]+/)) {
      const e = part.trim().toLowerCase();
      if (e && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) && !out.includes(e)) out.push(e);
    }
    return out;
  }

  /**
   * The workspaces of the chosen departments — where the invitations go.
   * hub.invite is per workspace, so a department invite is one call per
   * workspace in it.
   */
  _targetHubs() {
    const ids = new Set();
    for (const w of this._overview.workspaces) {
      if (w.department_id && this._selected.has(String(w.department_id))) ids.add(String(w.hub_id));
    }
    return [...ids];
  }

  async _sendInvites() {
    const invitees = this._emails();
    if (!invitees.length) {
      this._error = loc("ENTER_VALID_EMAIL", "Enter at least one valid email address.");
      return this._render();
    }
    const hubs = this._targetHubs();
    if (!hubs.length) {
      this._error = loc("CHOOSE_DEPARTMENT_WITH_WORKSPACE",
        "Choose a department that has at least one workspace.");
      return this._render();
    }
    this._busy = true;
    this._error = "";
    this._render();
    let ok = 0;
    let failed = 0;
    for (const hub_id of hubs) {
      // hub_id here is the WORKSPACE: hub.invite is scoped to the hub it
      // addresses, and the caller must administer it.
      this._complaint = null;
      let res;
      try {
        res = await this.postService(SERVICE.hub.invite, { hub_id, invitees });
      } catch (e) {
        res = null;
      }
      if (!res || this._complaint || (res.status && res.status !== "OK")) failed++;
      else ok++;
    }
    this._busy = false;
    this._sent = { ok, failed, people: invitees.length };
    this._render();
  }

  // ── Public link ────────────────────────────────────────────────────────

  /** Seconds for the chosen expiry; 0 = no expiry (toggle off). */
  _expirySeconds() {
    if (this._expiry === "none") return 0;
    if (this._expiry === "1h") return 3600;
    if (this._expiry === "24h") return 86400;
    if (this._expiry === "7d") return 7 * 86400;
    return Math.max(1, ~~this._customDays) * 86400;
  }

  /**
   * The link people open: this endpoint's address with ?join=<token>. The
   * desk accepts it once they are signed in (ui-team desk _maybeAcceptJoinLink).
   */
  _linkUrl(token) {
    const base = `${location.origin}${location.pathname}`;
    return `${base}?join=${encodeURIComponent(token)}`;
  }

  async _getLink() {
    const departments = [...this._selected];
    if (!departments.length) {
      this._error = loc("CHOOSE_DEPARTMENT", "Choose at least one department.");
      return this._render();
    }
    if (this._expiry === "custom") {
      const v = parseInt(this._value("custom-days"), 10);
      if (v > 0) this._customDays = v;
    }
    this._busy = true;
    this._error = "";
    this._render();
    const r = await this._call(SERVICE.organization.join_link_create, {
      departments, expires_in: this._expirySeconds(),
    });
    this._busy = false;
    if (!r.ok) return this._fail(r.status);
    const token = r.data && r.data.token;
    this._link = token ? { token, url: this._linkUrl(token), expires_at: r.data.expires_at } : null;
    this._render();
  }

  async _revokeLink() {
    if (!this._link) return;
    const r = await this._call(SERVICE.organization.join_link_revoke, { token: this._link.token });
    if (!r.ok) return this._fail(r.status);
    this._link = null;
    this._render();
  }

  _copyLink() {
    if (!this._link) return;
    const done = () => {
      this._copied = true;
      this._render();
      setTimeout(() => { this._copied = false; this._render(); }, 1500);
    };
    try {
      navigator.clipboard.writeText(this._link.url).then(done, done);
    } catch (e) {
      done();
    }
  }

  // ── Finish ─────────────────────────────────────────────────────────────

  /**
   * Done or skipped: record it, tell the desk, close.
   */
  async _finish() {
    if (this._finishing) return;
    this._finishing = true;
    await this._call(SERVICE.organization.setup_done, {});
    if (this._pendingIdent) {
      this._busy = true;
      this._render();
      const r = await this._call(SERVICE.organization.change_ident, { ident: this._pendingIdent });
      if (!r.ok) {
        // Taken in the meantime, most likely: stay, say so, let them go back.
        this._finishing = false;
        this._pendingIdent = null;
        return this._fail(r.status);
      }
      const link = r.data && r.data.link;
      if (link && link !== location.hostname) {
        // The old address no longer resolves: reload the desk on the new one.
        location.href = `${location.protocol}//${link}${location.pathname}${location.hash}`;
        return;
      }
    }
    RADIO_BROADCAST.trigger("org:refresh");
    RADIO_BROADCAST.trigger("department:changed");
    if (this.parent && _.isFunction(this.parent.clear)) return this.parent.clear();
    return this.goodbye();
  }

  _fail(status) {
    this._busy = false;
    this._error = this._message(status);
    this._render();
  }

  /**
   * @param {View} cmd
   * @param {Object} args
   */
  onUiEvent(cmd, args = {}) {
    const service = args.service || (cmd.get && cmd.get(_a.service));
    if (this._busy && service !== "org-setup-skip") return;
    switch (service) {
      case "org-setup-add-dept":
        return this._addDeptName();
      case "org-setup-remove-dept":
        return this._removeDeptName(parseInt(cmd.mget("index"), 10));
      case "org-setup-next":
        if (this._step === 0) return this._commitStep0();
        if (this._step === 1) {
          this._step = 2;
          this._pickerFor = null;
          // Every department that has a workspace is ticked by default: the
          // owner just built this structure to invite people into it.
          this._selected = new Set(
            this._overview.departments
              .filter((d) => this._overview.workspaces.some((w) => String(w.department_id) === String(d.id)))
              .map((d) => String(d.id)),
          );
          return this._render();
        }
        return this._finish();
      case "org-setup-back":
        if (this._step > 0) this._step--;
        this._error = "";
        this._sent = null;
        return this._render();
      case "org-setup-skip":
        return this._finish();
      case "org-setup-ident-toggle":
        this._readIdent();
        this._identOn = !this._identOn;
        if (!this._identOn) this._identDraft = this._identNow;
        this._error = "";
        return this._render();

      case "org-setup-open-picker": {
        const id = String(cmd.mget("deptId"));
        this._pickerFor = this._pickerFor === id ? null : id;
        this._pickerQuery = "";
        this._newWsFor = null;
        return this._render();
      }
      case "org-setup-picker-search": {
        const q = String(args.value == null ? this._value("picker-search") : args.value);
        // Only a CHANGED query repaints. The field also reports on blur, and a
        // blur caused by clicking a row would otherwise swap the rows out
        // under that very click, which then lands on nothing.
        if (q === this._pickerQuery) return;
        this._pickerQuery = q;
        return this.ensurePart("picker-list").then((p) => {
          if (p) p.feed(require("./skeleton").pickerRows(this, this._pickerFor));
        });
      }
      case "org-setup-pick":
        this._pickerFor = null;
        return this._assign(cmd.mget("hubId"), cmd.mget("deptId"));
      case "org-setup-unassign":
        return this._assign(cmd.mget("hubId"), "");
      case "org-setup-new-ws":
        this._newWsFor = String(cmd.mget("deptId"));
        return this._render();
      case "org-setup-create-ws":
        return this._createWorkspace(cmd.mget("deptId"));

      case "org-setup-expand-dept": {
        const id = String(cmd.mget("deptId"));
        this._expanded = this._expanded || new Set();
        if (this._expanded.has(id)) this._expanded.delete(id);
        else this._expanded.add(id);
        return this._render();
      }
      case "org-setup-toggle-dept": {
        const id = String(cmd.mget("deptId"));
        if (this._selected.has(id)) this._selected.delete(id);
        else this._selected.add(id);
        this._sent = null;
        return this._render();
      }
      case "org-setup-toggle-all": {
        const all = this._overview.departments.map((d) => String(d.id));
        const every = all.length && all.every((id) => this._selected.has(id));
        this._selected = every ? new Set() : new Set(all);
        this._sent = null;
        return this._render();
      }
      case "org-setup-send":
        return this._sendInvites();

      case "org-setup-tab":
        if (cmd.mget("tab") === "link" && !(SERVICE.organization && SERVICE.organization.join_link_create)) return;
        this._tab = cmd.mget("tab");
        this._error = "";
        return this._render();
      case "org-setup-expiry":
        this._expiry = cmd.mget("value");
        this._link = null;
        return this._render();
      case "org-setup-expiry-toggle":
        this._expiry = this._expiry === "none" ? "7d" : "none";
        this._link = null;
        return this._render();
      case "org-setup-get-link":
        return this._getLink();
      case "org-setup-copy-link":
        return this._copyLink();
      case "org-setup-revoke-link":
        return this._revokeLink();

      default:
        if (super.onUiEvent) super.onUiEvent(cmd, args);
    }
  }
}

org_setup.initClass();

module.exports = org_setup;
