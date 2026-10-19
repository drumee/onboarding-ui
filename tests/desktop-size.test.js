// Desktop draws the wizard at 85% of the Figma size (spec 2026-10-13).
const assert = require('node:assert');
const { page, withBrowser, show, box, fontSize } = require('./harness');
const { renderStep } = require('./render');

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: got ${a}, want ${b}±${tol}`);

(async () => {
  await withBrowser(async (browser) => {
    for (const vp of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }]) {
      const tag = `${vp.width}x${vp.height}`;

      // Role: a standard-width step with a title, chips and Continue.
      let p = await show(browser, page(renderStep(2)), vp);
      assert.strictEqual(await fontSize(p, '.onboarding-app__title'), 27, `${tag} title 27px`);
      assert.strictEqual(await fontSize(p, '.onboarding-app__primary-btn'), 14, `${tag} button text 14px`);
      near((await box(p, '.onboarding-app__primary-btn')).h, 40, 0.5, `${tag} button height`);
      assert.strictEqual(await fontSize(p, '.onboarding-app__option-chip'), 12, `${tag} chip text 12px`);
      near((await box(p, '.onboarding-app__card')).w, 442, 0.5, `${tag} card width`);
      near((await box(p, '.onboarding-app__logo')).w, 162.3, 0.5, `${tag} logo box width`);
      near((await box(p, '.onboarding-app__progress-step')).h, 5, 0.1, `${tag} progress bar height`);
      await p.close();

      // Name: the text input.
      p = await show(browser, page(renderStep(0)), vp);
      assert.strictEqual(await fontSize(p, '.onboarding-app__input-field input'), 12, `${tag} input text 12px`);
      await p.close();

      // Goals: glyph box.
      p = await show(browser, page(renderStep(6)), vp);
      near((await box(p, '.onboarding-app__goal-icon')).w, 18, 0.1, `${tag} goal icon box`);
      await p.close();

      // Done.
      p = await show(browser, page(renderStep(7, {
        data: { industry: 'healthcare', team_size: '2_10', goal: 'manage_projects' },
      })), vp);
      assert.strictEqual(await fontSize(p, '.onboarding-app__done-title'), 27, `${tag} done title 27px`);
      near((await box(p, '.onboarding-app__done-icon')).w, 60, 0.1, `${tag} done badge`);
      await p.close();
    }
  });
  console.log('desktop-size.test.js: all assertions passed');
})().catch((e) => { console.error(e); process.exit(1); });
