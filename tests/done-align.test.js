// The done screen is one centred column: logo, check badge, title TEXT,
// answer badges and the button share a vertical centre line at every width.
// The title is a Note, which ui-core renders as a row flexbox, so its text is
// a flex item and text-align on the Note alone leaves it hugging the left.
const assert = require('node:assert');
const { page, withBrowser, show } = require('./harness');
const { renderStep } = require('./render');

const ITEMS = ['logo', 'done-icon', 'done-title .note-content', 'summary-badges', 'primary-btn'];
const DATA = { firstname: 'cxzczxzxcrr', industry: 'tech_software', team_size: 'just_me' };

(async () => {
  await withBrowser(async (browser) => {
    for (const vp of [{ width: 375, height: 812 }, { width: 715, height: 490 }, { width: 1440, height: 900 }]) {
      const p = await show(browser, page(renderStep(7, { data: DATA })), vp);
      const cx = await p.evaluate((items) => items.map((k) => {
        const r = document.querySelector(`.onboarding-app__${k}`).getBoundingClientRect();
        return [k, r.x + r.width / 2];
      }), ITEMS);
      const ref = cx[0][1];
      for (const [k, c] of cx) {
        assert.ok(Math.abs(c - ref) <= 1, `${vp.width}px: ${k} centre ${c.toFixed(1)} != logo centre ${ref.toFixed(1)}`);
      }
      await p.close();
    }
  });
  console.log('done-align.test.js: all assertions passed');
})().catch((e) => { console.error(e); process.exit(1); });
