// Canonical wire keys must match the loby DB enum check constraints in
// schemas/procedures/save_onboarding_*.sql — keep these arrays in sync.
const INDUSTRY_OPTS = [
  ['tech_software',       'ONBOARDING_IND_TECH'],
  ['creative_marketing',  'ONBOARDING_IND_CREATIVE'],
  ['consulting_agency',   'ONBOARDING_IND_CONSULTING'],
  ['legal_compliance',    'ONBOARDING_IND_LEGAL'],
  ['finance_accounting',  'ONBOARDING_IND_FINANCE'],
  ['healthcare',          'ONBOARDING_IND_HEALTHCARE'],
  ['education',           'ONBOARDING_IND_EDUCATION'],
  ['real_estate',         'ONBOARDING_IND_REAL_ESTATE'],
  ['ecommerce_retail',    'ONBOARDING_IND_ECOMMERCE'],
  ['media_content',       'ONBOARDING_IND_MEDIA'],
  ['operations',          'ONBOARDING_IND_OPERATIONS'],
  ['other',               'ONBOARDING_IND_OTHER'],
];

const ROLE_OPTS = [
  ['founder_ceo',           'ONBOARDING_ROLE_FOUNDER'],
  ['manager_team_lead',     'ONBOARDING_ROLE_MANAGER'],
  ['executive_associate',   'ONBOARDING_ROLE_EXECUTIVE'],
  ['freelancer_consultant', 'ONBOARDING_ROLE_FREELANCER'],
  ['other',                 'ONBOARDING_ROLE_OTHER'],
];

const TEAM_SIZE_OPTS = [
  ['just_me', 'ONBOARDING_TEAM_JUST_ME'],
  ['2_10',    'ONBOARDING_TEAM_2_10'],
  ['10_50',   'ONBOARDING_TEAM_10_50'],
  ['50_plus', 'ONBOARDING_TEAM_50_PLUS'],
];

const TOOL_OPTS = [
  ['google_drive', 'ONBOARDING_TOOL_GOOGLE_DRIVE'],
  ['notion',       'ONBOARDING_TOOL_NOTION'],
  ['slack',        'ONBOARDING_TOOL_SLACK'],
  ['dropbox',      'ONBOARDING_TOOL_DROPBOX'],
  ['clickup',      'ONBOARDING_TOOL_CLICKUP'],
  ['trello',       'ONBOARDING_TOOL_TRELLO'],
  ['jira',         'ONBOARDING_TOOL_JIRA'],
  ['other',        'ONBOARDING_TOOL_OTHER'],
];

const CHALLENGE_OPTS = [
  ['files_scattered', 'ONBOARDING_CHAL_FILES_SCATTERED'],
  ['disconnected',    'ONBOARDING_CHAL_DISCONNECTED'],
  ['security',        'ONBOARDING_CHAL_SECURITY'],
  ['costs',           'ONBOARDING_CHAL_COSTS'],
  ['permissions',     'ONBOARDING_CHAL_PERMISSIONS'],
  ['visibility',      'ONBOARDING_CHAL_VISIBILITY'],
];

const GOAL_DEFS = [
  { key: 'manage_projects',   localeKey: 'ONBOARDING_GOAL_MANAGE',    icon: 'folder' },
  { key: 'work_with_clients', localeKey: 'ONBOARDING_GOAL_CLIENTS',   icon: 'users' },
  { key: 'store_sensitive',   localeKey: 'ONBOARDING_GOAL_STORE',     icon: 'lock' },
  { key: 'build_workflows',   localeKey: 'ONBOARDING_GOAL_WORKFLOWS', icon: 'settings' },
  { key: 'personal_files',    localeKey: 'ONBOARDING_GOAL_PERSONAL',  icon: 'file' },
];

const GOAL_ICONS = {
  folder: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 6H8L9.5 4H18" stroke="currentColor" stroke-width="1.5"/></svg>`,
  users: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/><circle cx="14" cy="7" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M1 17C1 14.2 3.2 12 6 12H8C10.8 12 13 14.2 13 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M13 12C15 12 17 13.8 17 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  lock: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 9V6C7 4.3 8.3 3 10 3C11.7 3 13 4.3 13 6V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  settings: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M10 1V3M10 17V19M1 10H3M17 10H19M3.5 3.5L5 5M15 15L16.5 16.5M16.5 3.5L15 5M5 15L3.5 16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  file: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 2H12L16 6V18H5C3.9 18 3 17.1 3 16V4C3 2.9 3.9 2 5 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 2V6H16" stroke="currentColor" stroke-width="1.5"/></svg>`,
};

// A localised string, or the fallback.
//
// `LOCALE[key] || fallback` is not enough: for a key with no row in yp.languages
// LOCALE hands back the KEY NAME, which is truthy — so the plain `||` renders
// the literal "ONBOARDING_NAME_PLACEHOLDER" in the input instead of any human
// text. main.js hits the same trap with ONBOARDING_INVITES_SENT and guards it
// the same way.
function loc(key, fallback) {
  const v = LOCALE[key];
  if (!v || v === key) return fallback;
  return v;
}

// The free-text input revealed when an "Other" option is active. Reuses the
// __input-field styling; name is "<field>_other" so getData() surfaces it.
function other_input(ui, field) {
  const pfx = ui.fig.family;
  const otherField = `${field}_other`;
  return Skeletons.Entry({
    className: `${pfx}__input-field ${pfx}__other-input`,
    name: otherField,
    value: ui._data[otherField] || '',
    formItem: otherField,
    innerClass: otherField,
    mode: _a.interactive,
    service: _a.input,
    placeholder: LOCALE.ONBOARDING_OTHER_PLACEHOLDER || 'Please specify…',
    uiHandler: [ui],
    state: 0,
    radio: ui._id,
  });
}

// Contents of the "<field>-other" part for single-select steps (industry,
// role): the reveal input when "other" is selected, else empty. Returned as an
// array so main.js can re-feed just this region in place.
export function other_region(ui, field) {
  return (ui._data[field] || '') === 'other' ? [other_input(ui, field)] : [];
}

// Contents of the "tools-other" part for the multi-select tools step: revealed
// when the "other" chip is toggled on.
export function tools_other_region(ui) {
  return (ui._data.tools || []).includes('other') ? [other_input(ui, 'tools')] : [];
}

// Contents of the "save-error" part, present on every step (see
// skeleton/index.js). Renders the inline banner shown when a step failed to
// persist. Returned as an array so main.js can re-feed just this region in
// place — a failed save must not rebuild the form and discard what the user
// typed. Empty when there is nothing to report, so it costs nothing normally.
export function error_region(ui) {
  if (!ui._saveError) return [];
  const pfx = ui.fig.family;
  return [
    Skeletons.Box.X({
      className: `${pfx}__save-error`,
      kids: [
        Skeletons.Element({
          className: `${pfx}__save-error-icon`,
          content: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.5V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.9" fill="currentColor"/></svg>`,
          active: 0,
        }),
        Skeletons.Element({
          className: `${pfx}__save-error-text`,
          content: ui._saveError,
          active: 0,
        }),
      ]
    }),
  ];
}

function buildOptionGrid(ui, opts, field, perRow = 2) {
  const pfx = ui.fig.family;
  let selected = ui._data[field] || '';
  let kids = [];
  let row = [];
  for (let i = 0; i < opts.length; i++) {
    let [key, localeKey] = opts[i];
    let label = LOCALE[localeKey] || key;
    let isOn = selected === key;
    row.push(
      Skeletons.Note({
        className: `${pfx}__option-chip`,
        name: label,
        sys_pn: `${field}-${i}`,
        partHandler: [ui],
        // Toggling single-select: click to choose, click the chosen one again to
        // clear it. Shared by industry, role and team size (and the goals step,
        // which builds its rows separately).
        service: 'toggle-option',
        uiHandler: [ui],
        state: isOn ? 1 : 0,
        dataset: { state: isOn ? 1 : 0, value: key, field },
        content: label,
      })
    );
    if (row.length === perRow || i === opts.length - 1) {
      kids.push(Skeletons.Box.X({ className: `${pfx}__option-row`, kids: [...row] }));
      row = [];
    }
  }
  let gridClass = `${pfx}__option-grid${perRow !== 2 ? ` cols-${perRow}` : ''}`;
  return Skeletons.Box.Y({
    className: `${pfx}__form-section`,
    kids: [
      Skeletons.Box.Y({ className: gridClass, kids }),
      Skeletons.Box.Y({
        className: `${pfx}__other-region`,
        sys_pn: `${field}-other`,
        kids: other_region(ui, field),
      }),
    ]
  });
}

export function name_form(ui) {
  const pfx = ui.fig.family;
  let val = ui._data.firstname || Visitor.get('firstname') || '';
  return Skeletons.Box.Y({
    className: `${pfx}__form-section`,
    kids: [
      Skeletons.Box.Y({
        className: `${pfx}__input-group`,
        kids: [
          Skeletons.Box.X({
            className: `${pfx}__input-row`,
            kids: [
              Skeletons.Entry({
                className: `${pfx}__input-field`,
                name: 'firstname',
                value: val,
                formItem: 'firstname',
                innerClass: 'firstname',
                mode: _a.interactive,
                service: _a.input,
                // Not ONBOARDING_NAME_PLACEHOLDER: that key holds an example
                // first name ('Alex') on every deployed endpoint, so reading it
                // would keep rendering 'Alex' until each one is patched. This
                // key is new, so loc() falls back to the English prompt until
                // the locale rows land.
                placeholder: loc('ONBOARDING_USERNAME_PLACEHOLDER', 'Enter your username'),
                uiHandler: [ui],
                state: 0,
                radio: ui._id
              }),
            ]
          })
        ]
      })
    ]
  });
}

export function industry_form(ui) { return buildOptionGrid(ui, INDUSTRY_OPTS, 'industry', 3); }
export function role_form(ui) { return buildOptionGrid(ui, ROLE_OPTS, 'role'); }
export function team_size_form(ui) { return buildOptionGrid(ui, TEAM_SIZE_OPTS, 'team_size'); }

// Heading shared by the two "Help us tailor your workspace" steps (tools and
// challenges). Both screens carry it inline instead of using the standard
// header title, which is why header.js suppresses its own title on both — see
// STEP_TITLE_KEYS there.
function tailor_title(ui) {
  const pfx = ui.fig.family;
  return Skeletons.Box.X({
    className: `${pfx}__tools-title`,
    kids: [
      Skeletons.Element({
        className: `${pfx}__tools-star`,
        content: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 1L13.5 8.5H21L15 13L17 21L11 16.5L5 21L7 13L1 8.5H8.5L11 1Z" fill="currentColor"/></svg>`,
        active: 0,
      }),
      Skeletons.Note({
        className: `${pfx}__tools-title-text`,
        content: LOCALE.ONBOARDING_HELP_TAILOR || 'Help us tailor your workspace',
        active: 0,
      }),
    ]
  });
}

// Step 5 (index 4). Tools only, on the standard-width card: the design gives
// the tools question and the challenges question a screen each rather than the
// two-column split this step used to render.
export function tools_form(ui) {
  const pfx = ui.fig.family;
  let selectedTools = ui._data.tools || [];

  let toolChips = TOOL_OPTS.map(([key, localeKey], i) => {
    let label = LOCALE[localeKey] || key;
    let isOn = selectedTools.includes(key);
    return Skeletons.Note({
      className: `${pfx}__tool-chip`,
      name: label,
      sys_pn: `tool-${i}`,
      partHandler: [ui],
      service: 'toggle-tool',
      uiHandler: [ui],
      state: isOn ? 1 : 0,
      dataset: { state: isOn ? 1 : 0, value: key },
      content: label,
    });
  });

  return Skeletons.Box.Y({
    className: `${pfx}__form-section`,
    kids: [
      tailor_title(ui),
      Skeletons.Box.Y({
        className: `${pfx}__question-block`,
        kids: [
          Skeletons.Note({
            className: `${pfx}__section-label`,
            content: LOCALE.ONBOARDING_TOOLS_QUESTION || 'What tools are you using?',
          }),
          Skeletons.Box.X({
            className: `${pfx}__tool-chips-wrap`,
            kids: toolChips,
          }),
          Skeletons.Box.Y({
            className: `${pfx}__other-region`,
            sys_pn: 'tools-other',
            kids: tools_other_region(ui),
          }),
        ]
      }),
    ]
  });
}

// Step 6 (index 5). The challenges multi-select plus its "tell me more" note,
// split out of the old combined tools step. Saves through save_challenges on
// its own Continue; the two answers no longer share a commit.
export function challenges_form(ui) {
  const pfx = ui.fig.family;
  let selectedChallenges = ui._data.challenges || [];

  let challengeKids = CHALLENGE_OPTS.map(([key, localeKey], i) => {
    let label = LOCALE[localeKey] || key;
    let isOn = selectedChallenges.includes(key);
    return Skeletons.Note({
      className: `${pfx}__challenge-option`,
      name: label,
      sys_pn: `challenge-${i}`,
      partHandler: [ui],
      service: 'toggle-challenge',
      uiHandler: [ui],
      state: isOn ? 1 : 0,
      dataset: { state: isOn ? 1 : 0, value: key },
      content: label,
    });
  });

  challengeKids.push(
    Skeletons.Box.X({
      className: `${pfx}__challenge-freetext`,
      kids: [
        Skeletons.Entry({
          className: `${pfx}__input-field`,
          name: 'challenge_text',
          value: ui._data.challenge_text || '',
          formItem: 'challenge_text',
          innerClass: 'challenge_text',
          mode: _a.interactive,
          service: _a.input,
          placeholder: LOCALE.ONBOARDING_CHALLENGE_FREETEXT || 'Tell me more about your challenge...',
          uiHandler: [ui],
          state: 0,
          radio: ui._id
        }),
      ]
    })
  );

  return Skeletons.Box.Y({
    className: `${pfx}__form-section`,
    kids: [
      tailor_title(ui),
      Skeletons.Box.Y({
        className: `${pfx}__question-block`,
        kids: [
          Skeletons.Note({
            className: `${pfx}__section-label`,
            content: LOCALE.ONBOARDING_CHALLENGES_QUESTION || 'What challenges are you facing with your current setup?',
          }),
          Skeletons.Box.Y({
            className: `${pfx}__challenge-list`,
            kids: challengeKids,
          }),
        ]
      }),
    ]
  });
}

export function goals_form(ui) {
  const pfx = ui.fig.family;
  let selected = ui._data.goal || '';

  let kids = GOAL_DEFS.map((g, i) => {
    let label = LOCALE[g.localeKey] || g.key;
    let isOn = selected === g.key;
    return Skeletons.Box.X({
      className: `${pfx}__goal-option`,
      name: g.key,
      sys_pn: `goal-${i}`,
      partHandler: [ui],
      // Same toggling single-select as the option grids above.
      service: 'toggle-option',
      uiHandler: [ui],
      state: isOn ? 1 : 0,
      dataset: { state: isOn ? 1 : 0, value: g.key, field: 'goal' },
      kids: [
        Skeletons.Element({
          className: `${pfx}__goal-icon`,
          content: GOAL_ICONS[g.icon] || '',
          active: 0,
        }),
        Skeletons.Element({
          className: `${pfx}__goal-label`,
          content: label,
          active: 0,
        }),
      ]
    });
  });

  return Skeletons.Box.Y({
    className: `${pfx}__form-section`,
    kids: [Skeletons.Box.Y({ className: `${pfx}__goal-list`, kids })]
  });
}

export function invite_form(ui) {
  const pfx = ui.fig.family;

  let infoBanner = Skeletons.Note({
    className: `${pfx}__invite-info`,
    content: LOCALE.ONBOARDING_INVITE_INFO || 'Add team member as contact.',
  });

  let inputRow = Skeletons.Box.X({
    className: `${pfx}__invite-input-row`,
    kids: [
      Skeletons.Entry({
        className: `${pfx}__invite-email`,
        name: 'invite_email',
        value: '',
        formItem: 'invite_email',
        innerClass: 'invite_email',
        mode: _a.interactive,
        service: _a.input,
        placeholder: LOCALE.INVITE_PLACEHOLDER || 'name@company.com',
        uiHandler: [ui],
        state: 0,
        radio: ui._id
      }),
      Skeletons.Note({
        className: `${pfx}__invite-add-btn`,
        content: LOCALE.ONBOARDING_ADD || '+ Add',
        service: 'add-invite',
        uiHandler: [ui],
      }),
    ]
  });

  // The dynamic region (validation error + staged chips) lives in its own
  // "invite-list" part so add/remove can re-feed just this region in place
  // (see main.js _refreshInviteList) instead of re-feeding the whole step.
  return Skeletons.Box.Y({
    className: `${pfx}__form-section`,
    kids: [
      infoBanner,
      inputRow,
      Skeletons.Box.Y({
        className: `${pfx}__invite-list-region`,
        sys_pn: 'invite-list',
        kids: invite_list(ui),
      }),
    ]
  });
}

// Contents of the "invite-list" part: an optional inline validation error
// followed by the staged-invitee chips. Returned as an array so it can be fed
// directly into the part (Skeletons accepts an array of kids).
export function invite_list(ui) {
  const pfx = ui.fig.family;
  let kids = [];

  if (ui._inviteError) {
    kids.push(Skeletons.Element({
      className: `${pfx}__invite-error`,
      content: ui._inviteError,
      active: 0,
    }));
  }

  let invitedKids = (ui._data.invites || []).map((inv, i) => {
    return Skeletons.Box.X({
      className: `${pfx}__invited-row`,
      kids: [
        Skeletons.Element({
          className: `${pfx}__invited-email`,
          content: inv.email || inv,
          active: 0,
        }),
        Skeletons.Button.Svg({
          ico: "cross",
          className: `${pfx}__invited-remove`,
          service: 'remove-invite',
          dataset: { index: i },
          uiHandler: [ui],
        }),
      ]
    });
  });

  if (invitedKids.length) {
    kids.push(Skeletons.Box.Y({ className: `${pfx}__invited-list`, kids: invitedKids }));
  }

  return kids;
}

function _labelFor(opts, key) {
  if (!key) return null;
  let entry = opts.find(([k]) => k === key);
  if (!entry) return null;
  return LOCALE[entry[1]] || entry[0];
}

export function done_form(ui) {
  const pfx = ui.fig.family;
  let userName = ui._data.firstname || Visitor.get('firstname') || 'Alex';

  let badges = [];
  let industry = _labelFor(INDUSTRY_OPTS, ui._data.industry);
  if (industry) badges.push(industry);
  let teamSize = _labelFor(TEAM_SIZE_OPTS, ui._data.team_size);
  if (teamSize) badges.push(teamSize);
  if (ui._data.goal) {
    let g = GOAL_DEFS.find(x => x.key === ui._data.goal);
    if (g) badges.push(LOCALE[g.localeKey] || g.key);
  }

  let badgeKids = badges.map(b => {
    return Skeletons.Element({ className: `${pfx}__summary-badge`, content: b, active: 0 });
  });

  return Skeletons.Box.Y({
    className: `${pfx}__done-section`,
    kids: [
      Skeletons.Element({
        className: `${pfx}__done-icon`,
        content: `<svg width="39" height="39" viewBox="0 0 39 39" fill="none"><circle cx="19.5" cy="19.5" r="17" stroke="#54B684" stroke-width="2"/><path d="M12 19.5L17 24.5L27 14.5" stroke="#54B684" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      }),
      Skeletons.Note({
        className: `${pfx}__done-title`,
        content: (LOCALE.ONBOARDING_ALL_SET || "You are all set, {0}").replace('{0}', userName),
      }),
      Skeletons.Note({
        className: `${pfx}__done-tips`,
        content: LOCALE.ONBOARDING_ALL_SET_TIPS || 'Your workspace is configured and ready to go.',
      }),
      Skeletons.Box.X({
        className: `${pfx}__summary-badges`,
        kids: badgeKids,
      }),
    ]
  });
}
