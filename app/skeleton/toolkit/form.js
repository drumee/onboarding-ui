// Shared guard against LOCALE echoing an unset key back — see lib/locale-text.js
// for what that costs when it is missed (a red "ALREADY_IN_LIST" on the invite
// step, where a sentence belonged).
const { loc } = require('../../lib/locale-text');
const {
  STAR_FOUR_SVG,
  DONE_CHECK_SVG,
  APP_FOLDER_SVG,
  APP_HANDSHAKE_SVG,
  APP_LOCK_SVG,
  APP_PUZZLE_SVG,
  APPS_NETWORK_SVG,
} = require('./icons');

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

// [wire key, locale key, label exactly as Figma 155:47287 draws it].
//
// The locale keys are NOT the old ONBOARDING_CHAL_FILES_SCATTERED / _DISCONNECTED
// / _SECURITY / _COSTS / _PERMISSIONS / _VISIBILITY. Those hold 1.0's longer
// wording ("Files are scattered across tools", "No visibility on who views or
// edits what") on deployed endpoints, and a populated row beats the fallback —
// so reading them would keep printing the old copy over the new design. These
// names are new, so loc() falls back to the design text until the rows land.
// Same move as GOAL_DEFS above and ONBOARDING_USERNAME_PLACEHOLDER below.
//
// The wire keys are untouched: save_onboarding_challenges' enum still sees
// files_scattered / disconnected / security / costs / permissions / visibility.
const CHALLENGE_OPTS = [
  ['files_scattered', 'ONBOARDING_CHAL_SCATTERING',          'Files scattering across tools'],
  ['disconnected',    'ONBOARDING_CHAL_CHAT_FILES',          'Chat & files are disconnected'],
  ['security',        'ONBOARDING_CHAL_DATA_SECURITY',       'Data security & ownership'],
  ['costs',           'ONBOARDING_CHAL_TOOL_COSTS',          'High tool costs'],
  ['permissions',     'ONBOARDING_CHAL_ACCESS_PERMISSIONS',  'Access & permissions'],
  ['visibility',      'ONBOARDING_CHAL_FILE_ACTIVITY',       'No visibility into file activity'],
];

// `key` is the wire value checked by save_onboarding_goal's enum constraint —
// do not rename. `text` is the label exactly as Figma 155:47398 draws it.
//
// The locale keys are NOT the old ONBOARDING_GOAL_MANAGE / _CLIENTS / _STORE /
// _WORKFLOWS / _PERSONAL. Those carry 1.0's wording ("Store sensitive data —
// fully under your control" and friends) on every deployed endpoint, and since
// a populated row beats the fallback, reading them would keep printing the old
// copy over the new design until each endpoint is patched. These names are new,
// so loc() falls back to the design text until the rows land — the same move
// ONBOARDING_USERNAME_PLACEHOLDER makes below, for the same reason. They also
// now mirror the wire keys, which the old short names did not.
const GOAL_DEFS = [
  { key: 'manage_projects',   localeKey: 'ONBOARDING_GOAL_MANAGE_PROJECTS',  text: 'Manage projects & teams',      icon: 'folder' },
  { key: 'work_with_clients', localeKey: 'ONBOARDING_GOAL_WORK_CLIENTS',     text: 'Work with clients',            icon: 'handshake' },
  { key: 'store_sensitive',   localeKey: 'ONBOARDING_GOAL_SECURE_DATA',      text: 'Secure sensitive data',        icon: 'lock' },
  { key: 'build_workflows',   localeKey: 'ONBOARDING_GOAL_BUILD_WORKFLOWS',  text: 'Build workflows on your data', icon: 'puzzle' },
  { key: 'personal_files',    localeKey: 'ONBOARDING_GOAL_PERSONAL_FILES',   text: 'Manage personal files',        icon: 'network' },
];

const GOAL_ICONS = {
  folder:    APP_FOLDER_SVG,
  handshake: APP_HANDSHAKE_SVG,
  lock:      APP_LOCK_SVG,
  puzzle:    APP_PUZZLE_SVG,
  network:   APPS_NETWORK_SVG,
};

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
// INLINE_TITLE_STEPS there.
function tailor_title(ui) {
  const pfx = ui.fig.family;
  return Skeletons.Box.X({
    className: `${pfx}__tools-title`,
    kids: [
      Skeletons.Element({
        className: `${pfx}__tools-star`,
        content: STAR_FOUR_SVG,
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

  let challengeKids = CHALLENGE_OPTS.map(([key, localeKey, text], i) => {
    let label = loc(localeKey, text);
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
    let label = loc(g.localeKey, g.text);
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
    if (g) badges.push(loc(g.localeKey, g.text));
  }

  let badgeKids = badges.map(b => {
    return Skeletons.Element({ className: `${pfx}__summary-badge`, content: b, active: 0 });
  });

  return Skeletons.Box.Y({
    className: `${pfx}__done-section`,
    kids: [
      // Badge and headline are one centred block, 16px apart, with 40px down to
      // the summary — the design groups them (Figma 155:47493) rather than
      // spacing all four children equally.
      Skeletons.Box.Y({
        className: `${pfx}__done-head`,
        kids: [
          Skeletons.Element({
            className: `${pfx}__done-icon`,
            content: DONE_CHECK_SVG,
            active: 0,
          }),
          Skeletons.Note({
            className: `${pfx}__done-title`,
            // New key: deployed endpoints hold 1.0's "You are all set" under
            // ONBOARDING_ALL_SET, and a populated row beats the fallback.
            content: loc('ONBOARDING_ALL_SET_V2', "You're all set, {0}")
              .replace('{0}', userName),
          }),
        ],
      }),
      Skeletons.Box.X({
        className: `${pfx}__summary-badges`,
        kids: badgeKids,
      }),
      // The one answer this screen collects. Both keys are new, so loc() shows
      // the design copy until the locale rows land.
      Skeletons.Box.Y({
        className: `${pfx}__org-section`,
        kids: [
          Skeletons.Note({
            className: `${pfx}__org-label`,
            content: loc('ONBOARDING_ORG_NAME_LABEL', 'Your organization name'),
            active: 0,
          }),
          Skeletons.Entry({
            className: `${pfx}__org-input`,
            name: 'organisation_name',
            value: ui._data.organisation_name || '',
            formItem: 'organisation_name',
            innerClass: 'organisation_name',
            mode: _a.interactive,
            service: _a.input,
            placeholder: loc('ONBOARDING_ORG_NAME_PLACEHOLDER', 'Type the name...'),
            uiHandler: [ui],
            state: 0,
            radio: ui._id,
          }),
        ],
      }),
    ]
  });
}
