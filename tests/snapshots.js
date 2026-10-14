// Not a test: writes one PNG per step per viewport so a person can eyeball
// the layout. Usage: node tests/snapshots.js <out-dir>
const fs = require('node:fs');
const path = require('node:path');
const { page, withBrowser, show } = require('./harness');
const { renderStep } = require('./render');

const OUT = process.argv[2];
if (!OUT) { console.error('usage: node tests/snapshots.js <out-dir>'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = {
  phone: { width: 375, height: 812 },
  landscape: { width: 812, height: 375 },
  tablet: { width: 768, height: 1024 },
  laptop: { width: 1280, height: 800 },
  desktop: { width: 1440, height: 900 },
};

(async () => {
  await withBrowser(async (browser) => {
    for (const [name, vp] of Object.entries(VIEWPORTS)) {
      for (let s = 0; s <= 7; s++) {
        const p = await show(browser, page(renderStep(s, {
          data: { industry: 'healthcare', team_size: '2_10', goal: 'manage_projects' },
        })), vp);
        await p.screenshot({ path: path.join(OUT, `${name}-step${s}.png`) });
        await p.close();
      }
    }
  });
  console.log('wrote', fs.readdirSync(OUT).length, 'screenshots to', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
