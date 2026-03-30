const { locale } = require("../../locale")

/**
 * Step 1: Sign In form - username/email + password
 * Based on signin module: SERVICE.yp.signin with { vars: { username, password } }
 */
export function sign_in_form(ui, opt) {
  const pfx = `${ui.fig.family}__sign-in`;
  const loc = locale();
  let data = ui._saved_data[ui._step] || {}

  return Skeletons.Box.Y({
    className: `${pfx}-main`,
    kids: [
      Skeletons.Entry({
        className: `${pfx}-input`,
        name: _a.username,
        sys_pn: _a.username,
        value: data.username || ui.mget(_a.username) || '',
        formItem: _a.username,
        innerClass: _a.username,
        mode: _a.interactive,
        service: _a.input,
        placeholder: loc.email_placeholder,
        uiHandler: [ui],
        state: 0,
        radio: ui._id
      }),
      Skeletons.Entry({
        className: `${pfx}-input`,
        name: _a.password,
        sys_pn: _a.password,
        value: '',
        formItem: _a.password,
        innerClass: _a.password,
        mode: _a.interactive,
        service: _a.input,
        placeholder: loc.password_placeholder,
        uiHandler: [ui],
        state: 0,
        radio: ui._id,
        type: _a.password
      }),
      Skeletons.Note({
        className: `${pfx}-message`,
        content: "",
        sys_pn: _a.message
      })
    ]
  })
}

/**
 * Step 2: Team Type selection - Personal / Startup / Enterprise
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
      Skeletons.Note({
        className: `${pfx}-card`,
        content: `<div class="${pfx}-icon">${tt.icon}</div><div class="${pfx}-label">${tt.label}</div><div class="${pfx}-desc">${tt.desc}</div>`,
        name: tt.key,
        sys_pn: `team-type-${tt.key}`,
        service: 'select-team-type',
        uiHandler: [ui],
        state: isSelected ? 1 : 0,
        dataset: {
          state: isSelected ? 1 : 0,
          value: tt.key,
        }
      })
    )
  }

  return Skeletons.Box.X({
    className: `${pfx}-main`,
    sys_pn: 'team-type-container',
    partHandler: [ui],
    kids
  })
}

/**
 * Step 3: Invite Team - email input + share link
 */
export function invite_team_form(ui, opt) {
  const pfx = `${ui.fig.family}__invite`;
  const loc = locale();
  let shareLink = ui._shareLink || 'acme-agency.drumee.com/invite/xyz';

  return Skeletons.Box.Y({
    className: `${pfx}-main`,
    kids: [
      Skeletons.Box.X({
        className: `${pfx}-input-row`,
        kids: [
          Skeletons.Entry({
            className: `${pfx}-input`,
            name: 'invite_email',
            value: '',
            formItem: 'invite_email',
            innerClass: 'invite_email',
            mode: _a.interactive,
            service: _a.input,
            placeholder: loc.invite_placeholder,
            uiHandler: [ui],
            state: 0,
            radio: ui._id
          }),
          Skeletons.Element({
            className: `${pfx}-add-btn`,
            content: loc.add,
            service: 'add-invite'
          })
        ]
      }),
      Skeletons.Element({
        className: `${pfx}-share-link`,
        content: `${loc.share_link_prefix} <strong>${shareLink}</strong>`,
      })
    ]
  })
}

/**
 * Step 4: Welcome to Drumee - folder color guide
 */
export function welcome_form(ui, opt) {
  const pfx = `${ui.fig.family}__welcome`;
  const loc = locale();

  let colorKids = [];
  for (let fc of loc.folder_colors) {
    colorKids.push(
      Skeletons.Element({
        className: `${pfx}-folder-item ${fc.color}`,
        content: `<div class="${pfx}-folder-header"><span class="${pfx}-folder-emoji">${fc.emoji}</span> <span class="${pfx}-folder-name ${fc.color}">${fc.name}</span></div><div class="${pfx}-folder-desc">${fc.desc}</div>`,
      })
    )
  }

  return Skeletons.Box.Y({
    className: `${pfx}-main`,
    kids: colorKids
  })
}

/**
 * Step 5: See Drumee in action - demo folder view with animated chat
 */
export function see_action_form(ui, opt) {
  const pfx = `${ui.fig.family}__action`;
  const loc = locale();
  const demo = loc.demo_folder;

  const allMessages = [
    { type: 'bot', text: "👋 Hi! I'm your Drumee guide. This is a real folder — let me show you around." },
    { type: 'bot', text: "📁 On the left, you can see files inside this folder. Each file lives here, scoped to this folder only." },
    { type: 'bot', text: "💬 Over here on the right is the Chat panel. Every folder has its own chat — conversations are always in context with the files." },
    { type: 'user', text: "Cool, so chat is linked to this folder?" },
    { type: 'bot', text: "Exactly! Try typing in the chat input below — it's scoped to this folder only, not global." },
    { type: 'bot', text: "🔒 Now hover over a folder on the desk to see its sharing mode. Purple = private, Red = restricted, Pink = link share." },
    { type: 'bot', text: "✅ That's it! You're ready to use Drumee. Click 'Enter workspace' to begin." }
  ];

  let msgHtml = '';
  allMessages.forEach((msg, i) => {
    const delay = (i + 1) * 1.8;
    if (msg.type === 'bot') {
      msgHtml += `<div class="${pfx}-chat-msg ${pfx}-anim" style="animation-delay:${delay}s"><span class="${pfx}-chat-avatar">d</span><div class="${pfx}-chat-bubble">${msg.text}</div></div>`;
    } else {
      msgHtml += `<div class="${pfx}-user-msg ${pfx}-anim" style="animation-delay:${delay}s"><div class="${pfx}-user-bubble">${msg.text}</div></div>`;
    }
  });

  return Skeletons.Box.Y({
    className: `${pfx}-main`,
    kids: [
      Skeletons.Box.X({
        className: `${pfx}-folder-header`,
        kids: [
          Skeletons.Element({
            className: `${pfx}-folder-icon`,
            content: `<svg viewBox="0 0 22 18" fill="none" width="20" height="16"><path d="M1 5C1 4.4 1.4 4 2 4H8.5L10.5 6H20C20.6 6 21 6.4 21 7V15C21 15.6 20.6 16 20 16H2C1.4 16 1 15.6 1 15V5Z" fill="#EF4444" opacity=".8"/></svg>`,
          }),
          Skeletons.Element({
            className: `${pfx}-folder-name`,
            content: demo.name,
          }),
          Skeletons.Element({
            className: `${pfx}-folder-badge`,
            content: demo.badge,
          })
        ]
      }),
      Skeletons.Box.X({
        className: `${pfx}-content`,
        kids: [
          Skeletons.Box.Y({
            className: `${pfx}-files-panel`,
            kids: [
              Skeletons.Element({
                className: `${pfx}-panel-label`,
                content: demo.files_label,
              }),
              Skeletons.Element({
                className: `${pfx}-file-item hl`,
                content: `<div class="${pfx}-file-icon-wrap" style="background:rgba(239,68,68,.15)">📄</div><div class="${pfx}-file-info"><div class="${pfx}-file-name">Audit_Report_v3.pdf</div><div class="${pfx}-file-size">2.3 MB · 2h ago</div></div>`,
              }),
              Skeletons.Element({
                className: `${pfx}-file-item`,
                content: `<div class="${pfx}-file-icon-wrap" style="background:rgba(245,158,11,.15)">💾</div><div class="${pfx}-file-info"><div class="${pfx}-file-name">Contract_ABI.json</div><div class="${pfx}-file-size">48 KB · 1d ago</div></div>`,
              })
            ]
          }),
          Skeletons.Box.Y({
            className: `${pfx}-chat-panel`,
            kids: [
              Skeletons.Element({
                className: `${pfx}-chat-header-bar`,
                content: `💬 Chat <span class="${pfx}-chat-context-tag">folder context</span>`,
              }),
              Skeletons.Element({
                className: `${pfx}-chat-messages-wrap`,
                content: msgHtml,
              }),
              Skeletons.Element({
                className: `${pfx}-chat-input-bar`,
                content: `<input class="${pfx}-chat-text-input" placeholder="${loc.ask_guide_placeholder}" readonly/><span class="${pfx}-send-btn">${loc.send}</span>`,
              })
            ]
          })
        ]
      })
    ]
  })
}
