const { locale } = require("../../locale")

/**
 * Step 2: Team Type selection - Personal / Startup / Enterprise
 * Cards with icon, title, description, and arrow chevron
 * Only 1 option can be selected at a time (radio behavior)
 */
export function team_type_form(ui, opt) {
  const pfx = `${ui.fig.family}__team-type`;
  const loc = locale();
  let data = ui._saved_data[ui._step] || {}
  let selected = data.team_type || ui._data.team_type || '';

  let kids = [];
  for (let tt of loc.team_types) {
    let isSelected = selected === tt.key;
    kids.push(
      Skeletons.Box.X({
        className: `${pfx}-card`,
        name: tt.key,
        sys_pn: `team-type-${tt.key}`,
        partHandler: [ui],
        service: 'select-team-type',
        uiHandler: [ui],
        state: isSelected ? 1 : 0,
        dataset: {
          state: isSelected ? 1 : 0,
          value: tt.key,
        },
        kids: [
          Skeletons.Element({
            className: `${pfx}-icon-wrap`,
            content: `<span class="${pfx}-icon-inner">${tt.icon}</span>`,
            active: 0,
          }),
          Skeletons.Box.Y({
            className: `${pfx}-info`,
            active: 0,
            kids: [
              Skeletons.Element({
                className: `${pfx}-label`,
                content: tt.label,
                active: 0,
              }),
              Skeletons.Element({
                className: `${pfx}-desc`,
                content: tt.desc,
                active: 0,
              }),
            ]
          }),
          Skeletons.Element({
            className: `${pfx}-arrow`,
            content: `<svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M1 1L7 7L1 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            active: 0,
          }),
        ]
      })
    )
  }

  return Skeletons.Box.Y({
    className: `${pfx}-main`,
    sys_pn: 'team-type-container',
    partHandler: [ui],
    kids
  })
}

/**
 * Step 3: Invite Team - multiple email inputs + add another + copy shareable link
 */
export function invite_team_form(ui, opt) {
  const pfx = `${ui.fig.family}__invite`;
  const loc = locale();
  let invites = (ui._data.invites || []);

  let emailKids = [];

  // Pre-populated email fields
  let placeholders = loc.invite_placeholders || ['alex@company.com', 'jordan@company.com'];
  for (let i = 0; i < Math.max(placeholders.length, invites.length); i++) {
    let val = invites[i] || '';
    let ph = placeholders[i] || loc.invite_placeholder || 'colleague@company.com';
    emailKids.push(
      Skeletons.Box.X({
        className: `${pfx}-input-row`,
        kids: [
          Skeletons.Button.Svg({
            ico: "mail",
            className: `${pfx}-input-ico`,
          }),
          Skeletons.Entry({
            className: `${pfx}-input`,
            name: `invite_email_${i}`,
            value: val,
            formItem: `invite_email_${i}`,
            innerClass: `invite_email_${i}`,
            mode: _a.interactive,
            service: _a.input,
            placeholder: ph,
            uiHandler: [ui],
            state: 0,
            radio: ui._id
          }),
        ]
      })
    )
  }

  // "Add another" button
  emailKids.push(
    Skeletons.Box.X({
      className: `${pfx}-add-row`,
      service: 'add-invite',
      uiHandler: [ui],
      kids: [
        Skeletons.Element({
          className: `${pfx}-add-icon`,
          active: 0,
          content: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 5V11M5 8H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
        }),
        Skeletons.Element({
          className: `${pfx}-add-text`,
          active: 0,
          content: LOCALE.ADD_ANOTHER || loc.add_another || "Add another",
        })
      ]
    })
  )

  // Copy shareable link card
  let shareLink = ui._shareLink || 'acme-agency.drumee.com/invite/xyz';
  let shareLinkCard = Skeletons.Box.X({
    className: `${pfx}-share-card`,
    kids: [
      Skeletons.Element({
        className: `${pfx}-share-icon`,
        content: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M8 12L12 8M7 9L5.5 10.5C4.1 11.9 4.1 14.1 5.5 15.5C6.9 16.9 9.1 16.9 10.5 15.5L12 14M13 11L14.5 9.5C15.9 8.1 15.9 5.9 14.5 4.5C13.1 3.1 10.9 3.1 9.5 4.5L8 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      }),
      Skeletons.Box.Y({
        className: `${pfx}-share-info`,
        kids: [
          Skeletons.Element({
            className: `${pfx}-share-title`,
            content: LOCALE.COPY_SHAREABLE_LINK || loc.copy_shareable_link || "Copy shareable link",
          }),
          Skeletons.Element({
            className: `${pfx}-share-desc`,
            content: LOCALE.SHARE_LINK_DESC || loc.share_link_desc || "Invite anyone with a private URL",
          }),
        ]
      }),
      Skeletons.Element({
        className: `${pfx}-copy-btn`,
        content: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="6" y="6" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M12 6V4C12 2.9 11.1 2 10 2H4C2.9 2 2 2.9 2 4V10C2 11.1 2.9 12 4 12H6" stroke="currentColor" stroke-width="1.5"/></svg>`,
        service: 'copy-share-link',
      }),
    ]
  })

  return Skeletons.Box.Y({
    className: `${pfx}-main`,
    kids: [
      Skeletons.Note({
        className: `${pfx}-section-label`,
        content: LOCALE.TEAMMATE_EMAIL || loc.teammate_email_label || "TEAMMATE EMAIL",
      }),
      Skeletons.Box.Y({
        className: `${pfx}-emails`,
        kids: emailKids,
      }),
      shareLinkCard,
    ]
  })
}

/**
 * Step 4: "You're all set!" - Confirmation with feature cards
 */
export function welcome_form(ui, opt) {
  const pfx = `${ui.fig.family}__welcome`;
  const loc = locale();
  let userName = ui._data.firstname || Visitor.get('firstname') || 'Alex';

  return Skeletons.Box.Y({
    className: `${pfx}-main`,
    kids: [
      // Hero image area
      Skeletons.Element({
        className: `${pfx}-hero`,
        content: `<div class="${pfx}-hero-bg"></div>`,
      }),
      // Success badge
      Skeletons.Element({
        className: `${pfx}-badge`,
        content: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" fill="#6c5ce7"/><path d="M11 16L14.5 19.5L21 13" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      }),
      // Title
      Skeletons.Note({
        className: `${pfx}-title`,
        content: (LOCALE.ALL_SET_TITLE || loc.all_set_title || "You're all set, {0}!").replace('{0}', userName),
      }),
      // Description
      Skeletons.Note({
        className: `${pfx}-desc`,
        content: LOCALE.ALL_SET_DESC || loc.all_set_desc || "Your personal DRUMEE workspace is ready. We've organized your tools and folders so you can start creating without the clutter.",
      }),
      // Feature cards
      Skeletons.Box.X({
        className: `${pfx}-features`,
        kids: [
          Skeletons.Box.Y({
            className: `${pfx}-feature-card`,
            kids: [
              Skeletons.Element({
                className: `${pfx}-feature-icon`,
                content: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M3 9H21M9 9V21" stroke="currentColor" stroke-width="1.5"/></svg>`,
              }),
              Skeletons.Element({
                className: `${pfx}-feature-title`,
                content: LOCALE.FEATURE_SMART_FOLDERS || loc.feature_smart_folders || "Smart Folders",
              }),
              Skeletons.Element({
                className: `${pfx}-feature-desc`,
                content: LOCALE.FEATURE_SMART_FOLDERS_DESC || loc.feature_smart_folders_desc || "Auto-organized assets",
              }),
            ]
          }),
          Skeletons.Box.Y({
            className: `${pfx}-feature-card`,
            kids: [
              Skeletons.Element({
                className: `${pfx}-feature-icon`,
                content: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
              }),
              Skeletons.Element({
                className: `${pfx}-feature-title`,
                content: LOCALE.FEATURE_QUICK_ACCESS || loc.feature_quick_access || "Quick Access",
              }),
              Skeletons.Element({
                className: `${pfx}-feature-desc`,
                content: LOCALE.FEATURE_QUICK_ACCESS_DESC || loc.feature_quick_access_desc || "Universal file search",
              }),
            ]
          }),
        ]
      }),
    ]
  })
}

/**
 * Step 5 (unused currently): See Drumee in action - demo folder view
 */
export function see_action_form(ui, opt) {
  const pfx = `${ui.fig.family}__action`;
  const loc = locale();

  return Skeletons.Box.Y({
    className: `${pfx}-main`,
    kids: [
      Skeletons.Element({
        className: `${pfx}-placeholder`,
        content: loc.action_placeholder || "Explore your workspace",
      })
    ]
  })
}
