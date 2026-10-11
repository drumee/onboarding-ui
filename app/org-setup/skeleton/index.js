/* ==================================================================== *
 * org_setup skeleton — Figma 900:149766 (step 1), 900:149870 (step 2),
 * 900:150257 / 998:85923 (step 3).
 * ==================================================================== */
const { LOGO_SVG } = require("../../skeleton/toolkit/logo");
const { loc } = require("../../lib/locale-text");

const STEPS = 3;

function cube(pfx) {
  return Skeletons.Box.X({
    active: 0,
    className: `${pfx}__cube`,
    kids: [Skeletons.Image.Svg({ active: 0, ico: "ph-cube", className: `${pfx}__cube-svg` })],
  });
}

// The filled folder of the design's "folder mini icon" -- the desk's folder
// outline (media/grid/template/folder), coloured by the workspace's area.
const FOLDER_SVG = '<svg viewBox="0 0 105 86" xmlns="http://www.w3.org/2000/svg">'
  + '<path d="M33.5743 1.5H15C8.37258 1.5 3 6.87258 3 13.5V69C3 75.6274 8.37258 81 15 81H90C96.6274 81 '
  + '102 75.6274 102 69L102 28.2C102 21.5726 96.6274 16.2 90 16.2H58.8349C55.8072 16.2 52.8913 15.0555 '
  + '50.672 12.9959L41.7372 4.70411C39.5179 2.64453 36.6021 1.5 33.5743 1.5Z"/></svg>';

function folder(pfx, area) {
  return Skeletons.Element({
    active: 0,
    className: `${pfx}__folder ${pfx}__folder--${area || "private"}`,
    content: FOLDER_SVG,
  });
}

function label(pfx, text) {
  return Skeletons.Note({ className: `${pfx}__label`, content: text });
}

// One labelled block of a step: Figma stacks label / field / hint 12px
// apart, and the blocks themselves 24px apart.
function group(pfx, kids, extra = "") {
  return Skeletons.Box.Y({ className: `${pfx}__group${extra ? ` ${extra}` : ""}`, kids: kids.filter(Boolean) });
}

function toggle(pfx, ui, on, service) {
  return Skeletons.Box.X({
    className: `${pfx}__toggle${on ? ` ${pfx}__toggle--on` : ""}`,
    service,
    uiHandler: [ui],
    kids: [Skeletons.Box.X({ active: 0, className: `${pfx}__toggle-knob` })],
  });
}

function x(pfx, service, extra) {
  return Skeletons.Box.X({
    className: `${pfx}__x`,
    service,
    ...extra,
    kids: [Skeletons.Image.Svg({ active: 0, ico: "cross", className: `${pfx}__x-svg` })],
  });
}

// ── Step 0: name + departments (Figma 900:149766 / 900:150729) ─────────────
function step0(ui, pfx) {
  const host = (Organization && Organization.host && Organization.host())
    || (Organization && Organization.get && Organization.get("url"))
    || location.hostname;
  return [
    group(pfx, [
      label(pfx, loc("ORGANIZATION_NAME", "Organization name")),
      Skeletons.Entry({
        className: `${pfx}__input`,
        sys_pn: "org-name",
        partHandler: ui,
        value: ui._name || "",
        placeholder: loc("ORGANIZATION_NAME", "Organization name"),
        require: "any",
      }),
    ]),
    group(pfx, [
      Skeletons.Box.X({
        className: `${pfx}__row-between`,
        kids: [
          label(pfx, loc("CUSTOM_DOMAIN", "Custom domain")),
          // On: the address can be edited. Off: the current one is kept.
          toggle(pfx, ui, ui._identOn, "org-setup-ident-toggle"),
        ],
      }),
      // Reads as one address, as drawn (northbeam.drumee.com), but only the
      // label in front is editable: the entry sizes itself to its text
      // (_fitIdent) and the platform's domain follows it, fixed.
      ui._identOn && ui._identSuffix
        ? Skeletons.Box.X({
            className: `${pfx}__input ${pfx}__domain${ui._identError ? ` ${pfx}__input--error` : ""}`,
            kids: [
              Skeletons.Entry({
                className: `${pfx}__domain-entry`,
                sys_pn: "org-ident",
                partHandler: ui,
                value: ui._identDraft || "",
                placeholder: "northbeam",
                require: "any",
              }),
              Skeletons.Note({ active: 0, className: `${pfx}__domain-suffix`, content: `.${ui._identSuffix}` }),
            ],
          })
        : Skeletons.Note({ className: `${pfx}__input ${pfx}__input--readonly`, content: host }),
      // A refused address is said here, in place of the hint.
      ui._identError
        ? Skeletons.Note({ className: `${pfx}__field-error`, content: ui._identError })
        : Skeletons.Note({
            className: `${pfx}__hint`,
            content: loc("CUSTOM_DOMAIN_HINT", "Verify via DNS or email. It can be done later in Settings."),
          }),
    ]),
    group(pfx, [
      label(pfx, loc("CREATE_DEPARTMENT", "Create department")),
      ...ui._deptNames.map((d, index) =>
        Skeletons.Box.X({
          className: `${pfx}__dept-chip`,
          kids: [
            cube(pfx),
            Skeletons.Note({ active: 0, className: `${pfx}__dept-chip-name`, content: d.name }),
            x(pfx, "org-setup-remove-dept", { index, uiHandler: [ui] }),
          ],
        }),
      ),
      Skeletons.Entry({
        className: `${pfx}__input ${pfx}__input--dept`,
        sys_pn: "dept-entry",
        partHandler: ui,
        placeholder: loc("ENTER_DEPT_NAME", "Enter dept name..."),
        mode: _a.commit,
        require: "any",
        service: "org-setup-add-dept",
        uiHandler: [ui],
      }),
    ]),
  ];
}

// ── Step 1: workspaces per department ─────────────────────────────────────

/**
 * The picker's rows: the organisation's workspaces that belong to NO
 * department yet (a workspace sits in one department; moving one between
 * departments is the org view's job), filtered by the search box. Exported so
 * a keystroke repaints only the list.
 */
function pickerRows(ui, deptId) {
  const pfx = ui.fig.family;
  const q = String(ui._pickerQuery || "").toLowerCase();
  const rows = ui._overview.workspaces
    .filter((w) => !w.department_id)
    .filter((w) => !q || String(w.filename || w.name || "").toLowerCase().includes(q));
  if (!rows.length) {
    return [Skeletons.Note({ className: `${pfx}__picker-empty`, content: loc("NO_WORKSPACE_FOUND", "No workspace found") })];
  }
  return rows.map((w) =>
    Skeletons.Box.X({
      className: `${pfx}__picker-row`,
      service: "org-setup-pick",
      hubId: w.hub_id,
      deptId,
      uiHandler: [ui],
      kids: [
        folder(pfx, w.area),
        Skeletons.Note({ active: 0, className: `${pfx}__picker-name`, content: w.filename || w.name || "" }),
      ],
    }),
  );
}

function picker(ui, pfx, deptId) {
  return Skeletons.Box.Y({
    className: `${pfx}__picker`,
    kids: [
      Skeletons.Box.X({
        className: `${pfx}__row-between`,
        kids: [
          Skeletons.Note({ className: `${pfx}__picker-title`, content: loc("WORKSPACE", "Workspace") }),
          Skeletons.Note({
            className: `${pfx}__link`,
            content: `+ ${loc("NEW_WORKSPACE", "New workspace")}`,
            service: "org-setup-new-ws",
            deptId,
            uiHandler: [ui],
          }),
        ],
      }),
      // "+ New workspace": its name, Internal or External (as the desk's
      // "Create new workspace" asks), and Create -- Enter works too.
      ui._newWsFor === String(deptId)
        ? Skeletons.Box.Y({
            className: `${pfx}__new-ws`,
            kids: [
              Skeletons.Entry({
                className: `${pfx}__input ${pfx}__input--small`,
                sys_pn: "new-ws-entry",
                partHandler: ui,
                value: ui._newWsDraft || "",
                placeholder: loc("WORKSPACE_NAME", "Workspace name"),
                mode: _a.commit,
                require: "any",
                service: "org-setup-create-ws",
                deptId,
                uiHandler: [ui],
              }),
              Skeletons.Box.X({
                className: `${pfx}__new-ws-row`,
                kids: [
                  ...[["private", loc("INTERNAL", "Internal")], ["share", loc("EXTERNAL", "External")]].map(([area, label]) =>
                    Skeletons.Box.X({
                      className: `${pfx}__new-ws-area${(ui._newWsArea || "private") === area ? " active" : ""}`,
                      service: "org-setup-new-ws-area",
                      area,
                      uiHandler: [ui],
                      kids: [folder(pfx, area), Skeletons.Note({ active: 0, content: label })],
                    })),
                  Skeletons.Note({
                    className: `${pfx}__new-ws-create`,
                    content: loc("CREATE", "Create"),
                    service: "org-setup-create-ws",
                    deptId,
                    uiHandler: [ui],
                  }),
                ],
              }),
            ],
          })
        : null,
      Skeletons.Box.X({
        className: `${pfx}__search`,
        kids: [
          Skeletons.Image.Svg({ active: 0, ico: "ph-magnifying-glass", className: `${pfx}__search-svg` }),
          Skeletons.Entry({
            className: `${pfx}__search-input`,
            sys_pn: "picker-search",
            partHandler: ui,
            placeholder: loc("SEARCH", "Search..."),
            require: "any",
            watch: "org-setup-picker-search",
            interactive: 1,
            uiHandler: [ui],
          }),
        ],
      }),
      Skeletons.Box.Y({
        className: `${pfx}__picker-list`,
        sys_pn: "picker-list",
        partHandler: ui,
        kids: pickerRows(ui, deptId),
      }),
    ].filter(Boolean),
  });
}

function step1(ui, pfx) {
  const { departments, workspaces } = ui._overview;
  if (!departments.length) {
    return [Skeletons.Note({ className: `${pfx}__hint`, content: loc("NO_DEPARTMENTS_YET", "No department yet.") })];
  }
  return [group(pfx, departments.map((d) => {
    const id = String(d.id);
    const inDept = workspaces.filter((w) => String(w.department_id || "") === id);
    // Suggested "<Dept> internal / external" (Figma 900:149870), created on
    // Continue; drawn first, as the workspaces they will be.
    const suggested = ((ui._wsSuggest || {})[id] || []).map((w, index) =>
      Skeletons.Box.X({
        className: `${pfx}__ws-chip`,
        kids: [
          folder(pfx, w.area),
          Skeletons.Note({ active: 0, className: `${pfx}__ws-chip-name`, content: w.name }),
          x(pfx, "org-setup-drop-suggest", { deptId: id, index, uiHandler: [ui] }),
        ],
      }),
    );
    return Skeletons.Box.Y({
      className: `${pfx}__dept`,
      kids: [
        Skeletons.Box.X({
          className: `${pfx}__dept-head`,
          kids: [cube(pfx), Skeletons.Note({ active: 0, className: `${pfx}__dept-chip-name`, content: d.name })],
        }),
        Skeletons.Box.Y({
          className: `${pfx}__dept-body`,
          kids: [
            inDept.length || suggested.length
              ? Skeletons.Box.X({
                  className: `${pfx}__ws-chips`,
                  kids: [...suggested, ...inDept.map((w) =>
                    Skeletons.Box.X({
                      className: `${pfx}__ws-chip`,
                      kids: [
                        folder(pfx, w.area),
                        Skeletons.Note({ active: 0, className: `${pfx}__ws-chip-name`, content: w.filename || w.name || "" }),
                        x(pfx, "org-setup-unassign", { hubId: w.hub_id, uiHandler: [ui] }),
                      ],
                    }),
                  )],
                })
              : null,
            Skeletons.Box.X({
              className: `${pfx}__add`,
              service: "org-setup-open-picker",
              deptId: id,
              uiHandler: [ui],
              kids: [
                Skeletons.Image.Svg({ active: 0, ico: "ph-plus", className: `${pfx}__add-svg` }),
                Skeletons.Note({ active: 0, className: `${pfx}__add-label`, content: loc("ADD_WORKSPACE", "Add workspace") }),
              ],
            }),
            ui._pickerFor === id ? picker(ui, pfx, id) : null,
          ].filter(Boolean),
        }),
      ],
    });
  }), `${pfx}__depts`)];
}

// ── Step 2: invite ────────────────────────────────────────────────────────
function checkbox(pfx, on) {
  return Skeletons.Box.X({
    active: 0,
    className: `${pfx}__check`,
    attrOpt: { "data-checked": on ? "1" : "0" },
    kids: on ? [Skeletons.Image.Svg({ active: 0, ico: "app-check", className: `${pfx}__check-svg` })] : [],
  });
}

function orgCard(ui, pfx) {
  const { departments, organisation } = ui._overview;
  const org = organisation || {};
  return Skeletons.Box.Y({
    className: `${pfx}__org-card`,
    kids: [
      Skeletons.Note({ className: `${pfx}__org-card-name`, content: org.name || ui._name || "" }),
      Skeletons.Box.X({
        className: `${pfx}__org-card-meta`,
        kids: [
          Skeletons.Box.X({
            className: `${pfx}__meta`,
            kids: [
              Skeletons.Note({ className: `${pfx}__num`, content: String(departments.length) }),
              Skeletons.Note({ className: `${pfx}__muted`, content: loc("DEPARTMENTS", "Departments") }),
            ],
          }),
          Skeletons.Box.X({
            className: `${pfx}__meta`,
            kids: [
              Skeletons.Note({ className: `${pfx}__num`, content: String(~~org.member_count) }),
              Skeletons.Image.Svg({ active: 0, ico: "ph-users", className: `${pfx}__people-svg` }),
            ],
          }),
        ],
      }),
    ],
  });
}

function step2(ui, pfx) {
  const { departments, workspaces } = ui._overview;
  const inDept = (id) => workspaces.filter((w) => String(w.department_id || "") === String(id));
  const all = departments.length && departments.every((d) => ui._selected.has(String(d.id)));
  const expanded = ui._expanded || new Set();
  const kids = [
    tabs(ui, pfx),
    ui._tab === "link"
      ? null
      : group(pfx, [
          label(pfx, loc("INVITE_MEMBER_VIA_EMAIL", "Invite member via email")),
          Skeletons.Entry({
            className: `${pfx}__email`,
            sys_pn: "emails",
            partHandler: ui,
            value: ui._emailsRaw || "",
            placeholder: "name@company.com",
            require: "any",
          }),
        ]),
    group(pfx, [
      Skeletons.Box.X({
        className: `${pfx}__row-between ${pfx}__invite-head`,
        kids: [
          label(pfx, loc("INVITE_TO", "Invite to")),
          Skeletons.Box.X({
            className: `${pfx}__all`,
            service: "org-setup-toggle-all",
            uiHandler: [ui],
            kids: [Skeletons.Note({ active: 0, className: `${pfx}__all-label`, content: loc("ALL", "All") }), checkbox(pfx, all)],
          }),
        ],
      }),
      ...departments.map((d) => {
        const id = String(d.id);
        const ws = inDept(id);
        return Skeletons.Box.Y({
          className: `${pfx}__invite-item`,
          kids: [
            Skeletons.Box.X({
              className: `${pfx}__invite-line`,
              kids: [
                Skeletons.Box.X({
                  className: `${pfx}__invite-row`,
                  service: "org-setup-toggle-dept",
                  deptId: d.id,
                  uiHandler: [ui],
                  kids: [
                    cube(pfx),
                    Skeletons.Note({ active: 0, className: `${pfx}__invite-name`, content: d.name }),
                    Skeletons.Box.X({
                      active: 0,
                      className: `${pfx}__pill`,
                      kids: [
                        Skeletons.Note({ active: 0, className: `${pfx}__pill-num`, content: String(ws.length) }),
                        Skeletons.Note({ active: 0, className: `${pfx}__pill-text`, content: loc("WORKSPACES", "Workspaces") }),
                      ],
                    }),
                    // The caret opens the department's workspace list; it
                    // takes its own click, the row's toggles the department.
                    Skeletons.Box.X({
                      className: `${pfx}__caret${expanded.has(id) ? ` ${pfx}__caret--open` : ""}`,
                      service: "org-setup-expand-dept",
                      deptId: d.id,
                      uiHandler: [ui],
                      kids: [Skeletons.Image.Svg({ active: 0, ico: "ph-caret-down", className: `${pfx}__caret-svg` })],
                    }),
                  ],
                }),
                Skeletons.Box.X({
                  className: `${pfx}__check-hit`,
                  service: "org-setup-toggle-dept",
                  deptId: d.id,
                  uiHandler: [ui],
                  kids: [checkbox(pfx, ui._selected.has(id))],
                }),
              ],
            }),
            expanded.has(id)
              ? Skeletons.Box.X({
                  className: `${pfx}__ws-chips ${pfx}__ws-chips--invite`,
                  kids: ws.length
                    ? ws.map((w) =>
                        Skeletons.Box.X({
                          className: `${pfx}__ws-chip`,
                          kids: [
                            folder(pfx, w.area),
                            Skeletons.Note({ active: 0, className: `${pfx}__ws-chip-name`, content: w.filename || w.name || "" }),
                          ],
                        }),
                      )
                    : [Skeletons.Note({ className: `${pfx}__hint`, content: loc("NO_WORKSPACE_FOUND", "No workspace found") })],
                })
              : null,
          ].filter(Boolean),
        });
      }),
    ]),
  ];
  if (ui._tab === "link") kids.push(group(pfx, linkBlock(ui, pfx)));
  if (ui._sent && ui._tab !== "link") {
    kids.push(
      Skeletons.Note({
        className: `${pfx}__notice${ui._sent.failed ? ` ${pfx}__notice--warn` : ""}`,
        content: ui._sent.failed
          ? loc("INVITES_PARTLY_SENT", "Invitations sent to {0} workspace(s); {1} could not be reached.")
              .replace("{0}", ui._sent.ok).replace("{1}", ui._sent.failed)
          : loc("INVITES_SENT_TO", "Invitations sent to {0} workspace(s).").replace("{0}", ui._sent.ok),
      }),
    );
  }
  return kids;
}

// "Via email" / "Public link" (Figma 900:150257 / 998:85923). The link tab
// needs organization.join_link_create; without it it stays disabled.
function tabs(ui, pfx) {
  const hasLink = !!(SERVICE.organization && SERVICE.organization.join_link_create);
  const tab = (key, ico, text, enabled) =>
    Skeletons.Box.X({
      className: `${pfx}__tab${ui._tab === key ? ` ${pfx}__tab--on` : ""}${enabled ? "" : ` ${pfx}__tab--off`}`,
      ...(enabled ? { service: "org-setup-tab", tab: key, uiHandler: [ui] } : { tooltips: { content: loc("COMING_SOON", "Coming soon") } }),
      kids: [
        Skeletons.Image.Svg({ active: 0, ico, className: `${pfx}__tab-svg` }),
        Skeletons.Note({ active: 0, content: text }),
      ],
    });
  return Skeletons.Box.X({
    className: `${pfx}__tabs`,
    kids: [
      tab("email", "ph-envelope-simple", loc("VIA_EMAIL", "Via email"), true),
      tab("link", "apps-globe", loc("PUBLIC_LINK", "Public link"), hasLink),
    ],
  });
}

// Link Expiration (toggle + 1h / 24h / 7d / Custom), Get link, then the link
// with copy and Revoke.
function linkBlock(ui, pfx) {
  const on = ui._expiry !== "none";
  const choice = (value, text, ico) =>
    Skeletons.Box.X({
      className: `${pfx}__seg${ui._expiry === value ? ` ${pfx}__seg--on` : ""}`,
      service: "org-setup-expiry",
      value,
      uiHandler: [ui],
      kids: [
        Skeletons.Note({ active: 0, content: text }),
        ico ? Skeletons.Image.Svg({ active: 0, ico, className: `${pfx}__seg-svg` }) : null,
      ].filter(Boolean),
    });
  const out = [
    Skeletons.Box.X({
      className: `${pfx}__row-between`,
      kids: [
        label(pfx, loc("LINK_EXPIRATION", "Link Expiration")),
        toggle(pfx, ui, on, "org-setup-expiry-toggle"),
      ],
    }),
  ];
  if (on) {
    out.push(Skeletons.Box.X({
      className: `${pfx}__segs`,
      kids: [choice("1h", "1h"), choice("24h", "24h"), choice("7d", "7d"), choice("custom", loc("CUSTOM", "Custom"), "calendar")],
    }));
    if (ui._expiry === "custom") {
      out.push(Skeletons.Entry({
        className: `${pfx}__input ${pfx}__input--small`,
        sys_pn: "custom-days",
        partHandler: ui,
        value: String(ui._customDays || 30),
        placeholder: loc("DAYS", "Days"),
        require: "any",
      }));
    }
  }
  out.push(Skeletons.Box.X({
    className: `${pfx}__primary`,
    service: "org-setup-get-link",
    uiHandler: [ui],
    kids: [
      Skeletons.Image.Svg({ active: 0, ico: "apps-link-simple", className: `${pfx}__btn-svg` }),
      Skeletons.Note({ active: 0, content: loc("GET_LINK", "Get link") }),
    ],
  }));
  if (ui._link) {
    out.push(Skeletons.Box.X({
      className: `${pfx}__link-row`,
      kids: [
        Skeletons.Box.X({
          className: `${pfx}__link-box`,
          kids: [
            Skeletons.Image.Svg({ active: 0, ico: "apps-link-simple", className: `${pfx}__link-svg` }),
            Skeletons.Note({ className: `${pfx}__link-url`, content: ui._link.url }),
            Skeletons.Box.X({
              className: `${pfx}__copy`,
              service: "org-setup-copy-link",
              uiHandler: [ui],
              tooltips: { content: ui._copied ? loc("COPIED", "Copied") : loc("COPY_LINK", "Copy link") },
              kids: [Skeletons.Image.Svg({ active: 0, ico: "copylink", className: `${pfx}__link-svg` })],
            }),
          ],
        }),
        Skeletons.Box.X({
          className: `${pfx}__revoke`,
          service: "org-setup-revoke-link",
          uiHandler: [ui],
          kids: [
            Skeletons.Image.Svg({ active: 0, ico: "app-prohibit", className: `${pfx}__revoke-svg` }),
            Skeletons.Note({ active: 0, content: loc("REVOKE", "Revoke") }),
          ],
        }),
      ],
    }));
    if (ui._copied) out.push(Skeletons.Note({ className: `${pfx}__hint`, content: loc("COPIED", "Copied") }));
  }
  return out;
}

// ── Frame ─────────────────────────────────────────────────────────────────
function progress(pfx, step) {
  const kids = [];
  for (let i = 0; i < STEPS; i++) {
    kids.push(Skeletons.Box.X({ active: 0, className: `${pfx}__progress-step${i <= step ? " active" : ""}` }));
  }
  return Skeletons.Box.X({ className: `${pfx}__progress`, kids });
}

// Steps 1-2 end on Continue alone (Figma 900:149766, 900:149870). Step 3
// ends on Send Invitation + "Skip this step" (900:150257); on the Public link
// tab Get link is the action, so only "Skip this step" closes (998:85923).
function footer(ui, pfx) {
  const step = ui._step;
  const primary =
    step < 2
      ? { label: loc("CONTINUE", "Continue"), service: "org-setup-next" }
      : ui._tab === "link"
      ? null
      : { label: loc("SEND_INVITATION", "Send Invitation"), service: "org-setup-send" };
  return Skeletons.Box.Y({
    className: `${pfx}__footer`,
    kids: [
      primary
        ? Skeletons.Box.X({
            className: `${pfx}__primary${ui._busy ? ` ${pfx}__primary--busy` : ""}`,
            service: primary.service,
            uiHandler: [ui],
            kids: [Skeletons.Note({ active: 0, content: ui._busy ? loc("PLEASE_WAIT", "Please wait...") : primary.label })],
          })
        : null,
      step === 2
        ? Skeletons.Note({
            className: `${pfx}__secondary`,
            content: loc("SKIP_THIS_STEP", "Skip this step"),
            service: "org-setup-skip",
            uiHandler: [ui],
          })
        : null,
      // "New organization": nothing exists yet, so it can still be left.
      ui._create && !ui._orgDom && step === 0
        ? Skeletons.Note({
            className: `${pfx}__secondary`,
            content: loc("CANCEL", "Cancel"),
            service: "org-setup-cancel-create",
            uiHandler: [ui],
          })
        : null,
    ].filter(Boolean),
  });
}

module.exports = function (ui) {
  const pfx = ui.fig.family;
  const step = ui._step;
  const title = step === 2 ? loc("INVITE_MEMBERS", "Invite members") : loc("SET_UP_YOUR_ORGANIZATION", "Set up your organization");
  const sub = [
    loc("ORG_SETUP_SUB_0", "This becomes your organization's home in Drumee."),
    loc("ORG_SETUP_SUB_1", "Your organization structure"),
    loc("ORG_SETUP_SUB_2", "Invite members to department and workspace in organization."),
  ][step];
  const body = step === 0 ? step0(ui, pfx) : step === 1 ? step1(ui, pfx) : step2(ui, pfx);
  // Figma: logo / progress / content / button 48px apart; inside content the
  // heading (title, subtitle -- and on step 3 the org card) then the blocks
  // 24px apart.
  return Skeletons.Box.Y({
    className: `${pfx}__main`,
    debug: __filename,
    kids: [
      Skeletons.Box.Y({
        className: `${pfx}__card`,
        kids: [
          Skeletons.Element({ className: `${pfx}__logo`, content: LOGO_SVG, active: 0 }),
          progress(pfx, step),
          Skeletons.Box.Y({
            className: `${pfx}__content`,
            kids: [
              Skeletons.Box.Y({
                className: `${pfx}__head`,
                kids: [
                  Skeletons.Note({ className: `${pfx}__title`, content: title }),
                  Skeletons.Note({ className: `${pfx}__sub`, content: sub }),
                  step === 2 ? orgCard(ui, pfx) : null,
                ].filter(Boolean),
              }),
              ...body.filter(Boolean),
              ui._error ? Skeletons.Note({ className: `${pfx}__error`, content: ui._error }) : null,
            ].filter(Boolean),
          }),
          footer(ui, pfx),
        ].filter(Boolean),
      }),
    ],
  });
};

module.exports.pickerRows = pickerRows;
