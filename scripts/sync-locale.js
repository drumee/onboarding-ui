#!/usr/bin/env node

/**
 * Sync onboarding-ui locale keys to drumee.in locale management system
 *
 * Usage: node scripts/sync-locale.js
 *
 * Reads all locale JSON files from app/locale/ and uploads them
 * to https://drumee.in/-/svc/ using the locale.get/locale.add/locale.update API.
 * Category: "ui"
 *
 * - If key does NOT exist: creates it with all languages via locale.add
 * - If key EXISTS: updates each language via locale.update
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://drumee.in/-/svc';
const CATEGORY = 'ui';
const LANGUAGES = ['en', 'fr', 'es', 'km', 'ru', 'zh'];
const LOCALE_DIR = path.resolve(__dirname, '../app/locale');

// Auth from browser session
const COOKIE = 'regsid=SaHdSLr6HX0pKZlUJG50h2C0jc';
const SOCKET_ID = 'OV7Pw+akQpxyArK9mh5Mbg==';
const DEVICE_ID = 'ddi_OV7Pw4akQpxyArK9mh5Mbg44';

const HEADERS = {
  'Content-Type': 'application/json',
  'Accept': '*/*',
  'Cookie': COOKIE,
  'Origin': 'https://drumee.in',
  'Referer': 'https://drumee.in/-/',
  'x-param-device': 'desktop',
  'x-param-device-id': DEVICE_ID,
  'x-param-keysel': 'regsid',
  'x-param-lang': 'en',
  'x-param-page-language': 'en',
};

// ─── Read all locale files ───────────────────────────────────────────
function readLocaleFiles() {
  const locales = {};
  for (const lang of LANGUAGES) {
    const filePath = path.join(LOCALE_DIR, `${lang}.json`);
    if (fs.existsSync(filePath)) {
      locales[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  }
  return locales;
}

// ─── Build key map from locale files ─────────────────────────────────
function buildKeyMap(locales) {
  const en = locales.en || {};
  const keyMap = {};

  const addKey = (key, enValue, langExtractor) => {
    keyMap[key] = {};
    for (const lang of LANGUAGES) {
      if (lang === 'en') {
        keyMap[key][lang] = String(enValue);
      } else {
        const val = langExtractor ? langExtractor(locales[lang], lang) : '';
        keyMap[key][lang] = String(val || '');
      }
    }
  };

  // Step labels
  const stepLabelKeys = [
    'STEP_SELECT_TEAM_TYPE',
    'STEP_INVITE_YOUR_TEAM',
    'STEP_IDENTITY_VERIFICATION',
    'STEP_HOW_DRUMEE_WORKS',
  ];
  for (let i = 0; i < (en.steps || []).length; i++) {
    addKey(stepLabelKeys[i], en.steps[i].label, (loc) => {
      return (loc.steps && loc.steps[i]) ? loc.steps[i].label : '';
    });
  }

  // Step titles
  const stepTitleKeys = [
    'ONBOARDING_HOW_WILL_YOU_USE',
    'ONBOARDING_INVITE_YOUR_TEAM',
    'ONBOARDING_ALL_SET_TITLE',
    'ONBOARDING_SEE_IN_ACTION',
  ];
  for (let i = 0; i < (en.steps || []).length; i++) {
    addKey(stepTitleKeys[i], en.steps[i].title, (loc) => {
      return (loc.steps && loc.steps[i]) ? loc.steps[i].title : '';
    });
  }

  // Step tips
  const stepTipsKeys = [
    'ONBOARDING_SELECT_TEAM_TYPE_TIPS',
    'ONBOARDING_INVITE_TEAM_TIPS',
    'ONBOARDING_ALL_SET_TIPS',
    'ONBOARDING_SEE_ACTION_TIPS',
  ];
  for (let i = 0; i < (en.steps || []).length; i++) {
    addKey(stepTipsKeys[i], en.steps[i].tips, (loc) => {
      return (loc.steps && loc.steps[i]) ? loc.steps[i].tips : '';
    });
  }

  // Simple string keys
  const simpleKeys = {
    'CONTINUE': 'continue',
    'ONBOARDING_BACK': 'back',
    'ONBOARDING_SKIP': 'skip',
    'SKIP_FOR_NOW': 'skip_for_now',
    'TAKE_QUICK_TOUR': 'take_quick_tour',
    'SKIP_TO_WORKSPACE': 'skip_to_workspace',
    'ONBOARDING_NEXT_SEE_LIVE': 'next_see_live',
    'ENTER_WORKSPACE': 'enter_workspace',
    'ONBOARDING_ADD': 'add',
    'ADD_ANOTHER': 'add_another',
    'ONBOARDING_SEND': 'send',
    'ONBOARDING_INVITE_PLACEHOLDER': 'invite_placeholder',
    'TEAMMATE_EMAIL': 'teammate_email_label',
    'COPY_SHAREABLE_LINK': 'copy_shareable_link',
    'SHARE_LINK_DESC': 'share_link_desc',
    'ONBOARDING_SHARE_LINK_PREFIX': 'share_link_prefix',
    'ONBOARDING_ASK_GUIDE_PLACEHOLDER': 'ask_guide_placeholder',
    'ALL_SET_TITLE': 'all_set_title',
    'ALL_SET_DESC': 'all_set_desc',
    'FEATURE_SMART_FOLDERS': 'feature_smart_folders',
    'FEATURE_SMART_FOLDERS_DESC': 'feature_smart_folders_desc',
    'FEATURE_QUICK_ACCESS': 'feature_quick_access',
    'FEATURE_QUICK_ACCESS_DESC': 'feature_quick_access_desc',
  };

  for (const [localeKey, jsonKey] of Object.entries(simpleKeys)) {
    if (en[jsonKey] !== undefined) {
      addKey(localeKey, en[jsonKey], (loc) => loc[jsonKey] || '');
    }
  }

  // Team types
  for (let i = 0; i < (en.team_types || []).length; i++) {
    const tt = en.team_types[i];
    addKey(`ONBOARDING_TEAM_TYPE_${tt.key.toUpperCase()}_LABEL`, tt.label, (loc) => {
      return (loc.team_types && loc.team_types[i]) ? loc.team_types[i].label : '';
    });
    addKey(`ONBOARDING_TEAM_TYPE_${tt.key.toUpperCase()}_DESC`, tt.desc, (loc) => {
      return (loc.team_types && loc.team_types[i]) ? loc.team_types[i].desc : '';
    });
  }

  // Folder colors
  for (let i = 0; i < (en.folder_colors || []).length; i++) {
    const fc = en.folder_colors[i];
    addKey(`ONBOARDING_FOLDER_${fc.color.toUpperCase()}_NAME`, fc.name, (loc) => {
      return (loc.folder_colors && loc.folder_colors[i]) ? loc.folder_colors[i].name : '';
    });
    addKey(`ONBOARDING_FOLDER_${fc.color.toUpperCase()}_DESC`, fc.desc, (loc) => {
      return (loc.folder_colors && loc.folder_colors[i]) ? loc.folder_colors[i].desc : '';
    });
  }

  // Purpose options
  for (let i = 0; i < (en.purpose || []).length; i++) {
    addKey(`ONBOARDING_PURPOSE_${i}`, en.purpose[i], (loc) => {
      return (loc.purpose && loc.purpose[i]) || '';
    });
  }

  // Demo folder
  if (en.demo_folder) {
    const df = en.demo_folder;
    const demoSimple = {
      'ONBOARDING_DEMO_FOLDER_NAME': 'name',
      'ONBOARDING_DEMO_FOLDER_BADGE': 'badge',
      'ONBOARDING_DEMO_FOLDER_FILES_LABEL': 'files_label',
      'ONBOARDING_DEMO_FOLDER_CHAT_LABEL': 'chat_label',
      'ONBOARDING_DEMO_FOLDER_CHAT_CONTEXT': 'chat_context',
    };
    for (const [k, field] of Object.entries(demoSimple)) {
      addKey(k, df[field], (loc) => {
        return (loc.demo_folder && loc.demo_folder[field]) || '';
      });
    }
    for (let i = 0; i < (df.files || []).length; i++) {
      addKey(`ONBOARDING_DEMO_FILE_${i}_NAME`, df.files[i].name, (loc) => {
        return (loc.demo_folder && loc.demo_folder.files && loc.demo_folder.files[i]) ? loc.demo_folder.files[i].name : '';
      });
      addKey(`ONBOARDING_DEMO_FILE_${i}_SIZE`, df.files[i].size, (loc) => {
        return (loc.demo_folder && loc.demo_folder.files && loc.demo_folder.files[i]) ? loc.demo_folder.files[i].size : '';
      });
    }
    for (let i = 0; i < (df.messages || []).length; i++) {
      addKey(`ONBOARDING_DEMO_MESSAGE_${i}`, df.messages[i], (loc) => {
        return (loc.demo_folder && loc.demo_folder.messages && loc.demo_folder.messages[i]) || '';
      });
    }
  }

  return keyMap;
}

// ─── API helpers ─────────────────────────────────────────────────────
async function apiPost(service, body) {
  const url = `${BASE_URL}/${service}`;
  const payload = { socket_id: SOCKET_ID, device_id: DEVICE_ID, ...body };
  const res = await fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (json.error) {
    throw new Error(`${json.error}: ${json.reason || ''}`);
  }
  return json.data !== undefined ? json.data : json;
}

async function getExistingKey(key) {
  try {
    const data = await apiPost('locale.get', { key, category: CATEGORY });
    if (data && Array.isArray(data) && data.length > 0) return data;
    return null;
  } catch {
    return null;
  }
}

async function addLocaleKey(keyCode, values) {
  const payload = { key_code: keyCode, ...values };
  return apiPost('locale.add', { values: payload, category: CATEGORY });
}

async function updateLocaleEntry(id, value) {
  return apiPost('locale.update', { id, value });
}

async function updateLocaleEntryByCode(code, lang, value) {
  return apiPost('locale.update', { code, lang, value, category: CATEGORY });
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log('Reading locale files...');
  const locales = readLocaleFiles();

  console.log('Building key map...');
  const keyMap = buildKeyMap(locales);
  const keys = Object.keys(keyMap);
  console.log(`Found ${keys.length} keys to sync.\n`);

  let created = 0, updated = 0, unchanged = 0, errors = 0;

  for (const key of keys) {
    const values = keyMap[key];
    process.stdout.write(`  ${key} ... `);

    try {
      const existing = await getExistingKey(key);

      if (!existing) {
        // Key doesn't exist - create it
        await addLocaleKey(key, values);
        console.log('CREATED');
        created++;
      } else {
        // Key exists - check each language and update if different
        let langUpdated = 0;
        for (const entry of existing) {
          const lang = entry.lng;
          const newValue = values[lang];
          if (newValue !== undefined && newValue !== '' && newValue !== entry.des) {
            await updateLocaleEntry(entry.id, newValue);
            langUpdated++;
          }
        }
        // Check for missing languages (exist in our data but not on server)
        const existingLangs = new Set(existing.map(e => e.lng));
        for (const lang of LANGUAGES) {
          if (!existingLangs.has(lang) && values[lang]) {
            await updateLocaleEntryByCode(key, lang, values[lang]);
            langUpdated++;
          }
        }
        if (langUpdated > 0) {
          console.log(`UPDATED (${langUpdated} lang${langUpdated > 1 ? 's' : ''})`);
          updated++;
        } else {
          console.log('UNCHANGED');
          unchanged++;
        }
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      errors++;
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total keys: ${keys.length}`);
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Errors: ${errors}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
