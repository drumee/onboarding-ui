const { locale } = require("../../locale")

/**
 * Step 0: "What should we call you?" — first name input
 */
export function name_form(ui) {
  const pfx = `${ui.fig.family}`;
  const loc = locale();
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
                placeholder: loc.name_placeholder || 'Alex',
                uiHandler: [ui],
                state: 0,
                radio: ui._id
              }),
            ]
          })
        ]
      })
    ]
  })
}

/**
 * Step 1: "What kind of work do you do?" — 2-col industry grid
 */
export function industry_form(ui) {
  const pfx = `${ui.fig.family}`;
  const loc = locale();
  let selected = ui._data.industry || '';

  let kids = [];
  let row = [];
  const items = loc.industries || [];
  for (let i = 0; i < items.length; i++) {
    row.push(
      Skeletons.Note({
        className: `${pfx}__option-chip`,
        name: items[i],
        sys_pn: `industry-${i}`,
        partHandler: [ui],
        service: 'select-option',
        uiHandler: [ui],
        state: selected === items[i] ? 1 : 0,
        dataset: {
          state: selected === items[i] ? 1 : 0,
          value: items[i],
          field: 'industry',
        },
        content: items[i],
      })
    );
    if (row.length === 2 || i === items.length - 1) {
      kids.push(Skeletons.Box.X({
        className: `${pfx}__option-row`,
        kids: [...row],
      }));
      row = [];
    }
  }

  return Skeletons.Box.Y({
    className: `${pfx}__form-section`,
    kids: [
      Skeletons.Box.Y({
        className: `${pfx}__option-grid`,
        kids,
      })
    ]
  })
}

/**
 * Step 2: "What's your role?" — 2-col role grid + Tell me later
 */
export function role_form(ui) {
  const pfx = `${ui.fig.family}`;
  const loc = locale();
  let selected = ui._data.role || '';

  let kids = [];
  let row = [];
  const items = loc.roles || [];
  for (let i = 0; i < items.length; i++) {
    row.push(
      Skeletons.Note({
        className: `${pfx}__option-chip`,
        name: items[i],
        sys_pn: `role-${i}`,
        partHandler: [ui],
        service: 'select-option',
        uiHandler: [ui],
        state: selected === items[i] ? 1 : 0,
        dataset: {
          state: selected === items[i] ? 1 : 0,
          value: items[i],
          field: 'role',
        },
        content: items[i],
      })
    );
    if (row.length === 2 || i === items.length - 1) {
      kids.push(Skeletons.Box.X({
        className: `${pfx}__option-row`,
        kids: [...row],
      }));
      row = [];
    }
  }

  return Skeletons.Box.Y({
    className: `${pfx}__form-section`,
    kids: [
      Skeletons.Box.Y({
        className: `${pfx}__option-grid`,
        kids,
      })
    ]
  })
}

/**
 * Step 3: "How many people do you work with?" — 2-col team size grid
 */
export function team_size_form(ui) {
  const pfx = `${ui.fig.family}`;
  const loc = locale();
  let selected = ui._data.team_size || '';

  let kids = [];
  let row = [];
  const items = loc.team_sizes || [];
  for (let i = 0; i < items.length; i++) {
    row.push(
      Skeletons.Note({
        className: `${pfx}__option-chip`,
        name: items[i],
        sys_pn: `team-size-${i}`,
        partHandler: [ui],
        service: 'select-option',
        uiHandler: [ui],
        state: selected === items[i] ? 1 : 0,
        dataset: {
          state: selected === items[i] ? 1 : 0,
          value: items[i],
          field: 'team_size',
        },
        content: items[i],
      })
    );
    if (row.length === 2 || i === items.length - 1) {
      kids.push(Skeletons.Box.X({
        className: `${pfx}__option-row`,
        kids: [...row],
      }));
      row = [];
    }
  }

  return Skeletons.Box.Y({
    className: `${pfx}__form-section`,
    kids: [
      Skeletons.Box.Y({
        className: `${pfx}__option-grid`,
        kids,
      })
    ]
  })
}

/**
 * Step 4: "Help us tailor your workspace" — tool chips + challenge checkboxes
 */
export function tools_form(ui) {
  const pfx = `${ui.fig.family}`;
  const loc = locale();
  let selectedTools = ui._data.tools || [];
  let selectedChallenges = ui._data.challenges || [];

  // Tool chips (multi-select, wrapped flex)
  let toolChips = (loc.tools || []).map((t, i) => {
    let isOn = selectedTools.includes(t);
    return Skeletons.Note({
      className: `${pfx}__tool-chip`,
      name: t,
      sys_pn: `tool-${i}`,
      partHandler: [ui],
      service: 'toggle-tool',
      uiHandler: [ui],
      state: isOn ? 1 : 0,
      dataset: { state: isOn ? 1 : 0, value: t },
      content: t,
    });
  });

  // Challenge options (single col checkboxes)
  let challengeKids = (loc.challenges || []).map((c, i) => {
    let isOn = selectedChallenges.includes(c);
    return Skeletons.Note({
      className: `${pfx}__challenge-option`,
      name: c,
      sys_pn: `challenge-${i}`,
      partHandler: [ui],
      service: 'toggle-challenge',
      uiHandler: [ui],
      state: isOn ? 1 : 0,
      dataset: { state: isOn ? 1 : 0, value: c },
      content: c,
    });
  });

  // Free text area for challenges
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
          placeholder: loc.challenges_freetext || 'Tell me more about your challenge...',
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
      // Star title (rendered in form body, not header)
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
            content: loc.steps[4].title || 'Help us tailor your workspace',
            active: 0,
          }),
        ]
      }),
      // Tools section
      Skeletons.Note({
        className: `${pfx}__section-label`,
        content: loc.tools_question || 'What tools are you using?',
      }),
      Skeletons.Box.X({
        className: `${pfx}__tool-chips-wrap`,
        kids: toolChips,
      }),
      // Challenges section
      Skeletons.Note({
        className: `${pfx}__section-label`,
        content: loc.challenges_question || 'What challenges are you facing with your current setup?',
      }),
      Skeletons.Box.Y({
        className: `${pfx}__challenge-list`,
        kids: challengeKids,
      }),
    ]
  })
}

/**
 * Step 5: "What do you want to start with?" — single col radio with icons
 */
export function goals_form(ui) {
  const pfx = `${ui.fig.family}`;
  const loc = locale();
  let selected = ui._data.goal || '';

  const GOAL_ICONS = {
    folder: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 6H8L9.5 4H18" stroke="currentColor" stroke-width="1.5"/></svg>`,
    users: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/><circle cx="14" cy="7" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M1 17C1 14.2 3.2 12 6 12H8C10.8 12 13 14.2 13 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M13 12C15 12 17 13.8 17 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    lock: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 9V6C7 4.3 8.3 3 10 3C11.7 3 13 4.3 13 6V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    settings: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M10 1V3M10 17V19M1 10H3M17 10H19M3.5 3.5L5 5M15 15L16.5 16.5M16.5 3.5L15 5M5 15L3.5 16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    file: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 2H12L16 6V18H5C3.9 18 3 17.1 3 16V4C3 2.9 3.9 2 5 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 2V6H16" stroke="currentColor" stroke-width="1.5"/></svg>`,
  };

  let kids = (loc.goals || []).map((g, i) => {
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
          content: g.label,
          active: 0,
        }),
      ]
    });
  });

  return Skeletons.Box.Y({
    className: `${pfx}__form-section`,
    kids: [
      Skeletons.Box.Y({
        className: `${pfx}__goal-list`,
        kids,
      })
    ]
  })
}

/**
 * Step 6: "Invite your team members" — email + role dropdown + add
 */
export function invite_form(ui) {
  const pfx = `${ui.fig.family}`;
  const loc = locale();

  // Info banner
  let infoBanner = Skeletons.Note({
    className: `${pfx}__invite-info`,
    content: loc.invite_info || 'Invitees receive an email to join your workspace. Manage permissions anytime from settings.',
  });

  // Email input row with role + add button
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
        placeholder: loc.invite_placeholder || 'name@company.com',
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
        content: loc.add || '+ Add',
        service: 'add-invite',
        uiHandler: [ui],
      }),
    ]
  });

  // Invited list
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
    kids.push(Skeletons.Box.Y({
      className: `${pfx}__invited-list`,
      kids: invitedKids,
    }));
  }

  return Skeletons.Box.Y({
    className: `${pfx}__form-section`,
    kids,
  })
}

/**
 * Step 7 (done): "You're all set!" — summary badges
 */
export function done_form(ui) {
  const pfx = `${ui.fig.family}`;
  const loc = locale();
  let userName = ui._data.firstname || Visitor.get('firstname') || 'Alex';

  // Collect summary badges from user's choices
  let badges = [];
  if (ui._data.industry) badges.push(ui._data.industry);
  if (ui._data.team_size) badges.push(ui._data.team_size + ' member');
  if (ui._data.goal) {
    let g = (loc.goals || []).find(x => x.key === ui._data.goal);
    if (g) badges.push(g.label);
  }

  let badgeKids = badges.map(b => {
    return Skeletons.Element({
      className: `${pfx}__summary-badge`,
      content: b,
      active: 0,
    });
  });

  return Skeletons.Box.Y({
    className: `${pfx}__done-section`,
    kids: [
      // Check circle icon
      Skeletons.Element({
        className: `${pfx}__done-icon`,
        content: `<svg width="39" height="39" viewBox="0 0 39 39" fill="none"><circle cx="19.5" cy="19.5" r="17" stroke="#54B684" stroke-width="2"/><path d="M12 19.5L17 24.5L27 14.5" stroke="#54B684" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      }),
      // Title
      Skeletons.Note({
        className: `${pfx}__done-title`,
        content: (loc.all_set_title || "You're all set, {0}").replace('{0}', userName),
      }),
      // Tips
      Skeletons.Note({
        className: `${pfx}__done-tips`,
        content: loc.all_set_tips || 'Your workspace is configured and ready to go.',
      }),
      // Badges
      Skeletons.Box.X({
        className: `${pfx}__summary-badges`,
        kids: badgeKids,
      }),
    ]
  })
}
