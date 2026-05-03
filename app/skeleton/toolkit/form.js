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

function buildOptionGrid(ui, opts, field) {
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
        service: 'select-option',
        uiHandler: [ui],
        state: isOn ? 1 : 0,
        dataset: { state: isOn ? 1 : 0, value: key, field },
        content: label,
      })
    );
    if (row.length === 2 || i === opts.length - 1) {
      kids.push(Skeletons.Box.X({ className: `${pfx}__option-row`, kids: [...row] }));
      row = [];
    }
  }
  return Skeletons.Box.Y({
    className: `${pfx}__form-section`,
    kids: [Skeletons.Box.Y({ className: `${pfx}__option-grid`, kids })]
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
                placeholder: LOCALE.ONBOARDING_NAME_PLACEHOLDER || 'Alex',
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

export function industry_form(ui) { return buildOptionGrid(ui, INDUSTRY_OPTS, 'industry'); }
export function role_form(ui) { return buildOptionGrid(ui, ROLE_OPTS, 'role'); }
export function team_size_form(ui) { return buildOptionGrid(ui, TEAM_SIZE_OPTS, 'team_size'); }

export function tools_form(ui) {
  const pfx = ui.fig.family;
  let selectedTools = ui._data.tools || [];
  let selectedChallenges = ui._data.challenges || [];

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
      Skeletons.Box.X({
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
      }),
      Skeletons.Note({
        className: `${pfx}__section-label`,
        content: LOCALE.ONBOARDING_TOOLS_QUESTION || 'What tools are you using?',
      }),
      Skeletons.Box.X({
        className: `${pfx}__tool-chips-wrap`,
        kids: toolChips,
      }),
      Skeletons.Note({
        className: `${pfx}__section-label`,
        content: LOCALE.ONBOARDING_CHALLENGES_QUESTION || 'What challenges are you facing with your current setup?',
      }),
      Skeletons.Box.Y({
        className: `${pfx}__challenge-list`,
        kids: challengeKids,
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
      service: 'select-option',
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
    content: LOCALE.ONBOARDING_INVITE_INFO || 'Invitees receive an email to join your workspace.',
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
        className: `${pfx}__invite-role-btn`,
        content: 'Admin',
        service: 'toggle-role',
        uiHandler: [ui],
      }),
      Skeletons.Note({
        className: `${pfx}__invite-add-btn`,
        content: LOCALE.ONBOARDING_ADD || '+ Add',
        service: 'add-invite',
        uiHandler: [ui],
      }),
    ]
  });

  let invitedKids = (ui._data.invites || []).map((inv, i) => {
    return Skeletons.Box.X({
      className: `${pfx}__invited-row`,
      kids: [
        Skeletons.Element({
          className: `${pfx}__invited-email`,
          content: inv.email || inv,
          active: 0,
        }),
        Skeletons.Element({
          className: `${pfx}__invited-remove`,
          content: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
          service: 'remove-invite',
          dataset: { index: i },
          active: 0,
        }),
      ]
    });
  });

  let kids = [infoBanner, inputRow];
  if (invitedKids.length) {
    kids.push(Skeletons.Box.Y({ className: `${pfx}__invited-list`, kids: invitedKids }));
  }

  return Skeletons.Box.Y({ className: `${pfx}__form-section`, kids });
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
