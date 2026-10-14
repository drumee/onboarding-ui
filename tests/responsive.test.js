// Tablet / phone / landscape behaviour (spec 2026-10-13), plus the Review
// Focus cases from the plan: long labels, landscape reachability, a long
// save error, the "Other" reveal, and a long done screen.
const assert = require('node:assert');
const { page, withBrowser, show, box, boxes, fontSize, gridCols, overflowX } = require('./harness');
const { renderStep } = require('./render');

const PHONE = { width: 375, height: 812 };
const LANDSCAPE = { width: 812, height: 375 };
const TABLET = { width: 768, height: 1024 };
const DESKTOP = { width: 1440, height: 900 };

const TAPPABLE = [
  '.onboarding-app__option-chip', '.onboarding-app__tool-chip',
  '.onboarding-app__challenge-option', '.onboarding-app__goal-option',
  '.onboarding-app__primary-btn', '.onboarding-app__secondary-btn',
  '.onboarding-app__back-btn',
].join(',');

async function check(browser, html, vp, tag, extra) {
  const p = await show(browser, html, vp);
  try {
    assert.deepStrictEqual(await overflowX(p), [], `${tag}: no horizontal overflow`);
    const btn = await box(p, '.onboarding-app__primary-btn');
    assert.ok(btn && btn.bottom <= vp.height + 0.5,
      `${tag}: primary button on screen (bottom ${btn && btn.bottom} > ${vp.height})`);
    if (extra) await extra(p);
  } finally {
    await p.close();
  }
}

(async () => {
  await withBrowser(async (browser) => {
    // Every step at every viewport: no sideways scroll, Continue reachable.
    for (const [name, vp] of Object.entries({ PHONE, LANDSCAPE, TABLET, DESKTOP })) {
      for (let s = 0; s <= 7; s++) {
        await check(browser, page(renderStep(s)), vp, `${name} step ${s}`, async (p) => {
          if (name !== 'PHONE') return;
          for (const b of await boxes(p, TAPPABLE)) {
            assert.ok(b.h >= 43.5, `PHONE step ${s}: tap target ${b.h.toFixed(1)}px tall, want >= 44`);
          }
        });
      }
    }

    // Grid columns per breakpoint: [grid, step, desktop, tablet, phone].
    for (const [grid, step, d, t, ph] of [
      ['industry', 1, 3, 2, 1], ['role', 2, 2, 2, 1], ['team_size', 3, 2, 2, 2],
    ]) {
      for (const [vp, n, tag] of [[DESKTOP, d, 'DESKTOP'], [TABLET, t, 'TABLET'], [PHONE, ph, 'PHONE']]) {
        const p = await show(browser, page(renderStep(step)), vp);
        assert.strictEqual(await gridCols(p, grid), n, `${tag} ${grid}: ${n} columns`);
        await p.close();
      }
    }

    // Tablet card width.
    {
      const p = await show(browser, page(renderStep(2)), TABLET);
      assert.ok((await box(p, '.onboarding-app__card')).w <= 560.5, 'TABLET card <= 560px');
      await p.close();
    }

    // Phone sizes: full-bleed with 16px gutters, 22px title, 16px inputs.
    {
      const p = await show(browser, page(renderStep(0)), PHONE);
      const card = await box(p, '.onboarding-app__card');
      assert.ok(Math.abs(card.x - 16) < 0.5 && Math.abs(card.w - 343) < 0.5,
        `PHONE card spans the width inside 16px gutters (x ${card.x}, w ${card.w})`);
      assert.strictEqual(await fontSize(p, '.onboarding-app__title'), 22, 'PHONE title 22px');
      assert.strictEqual(await fontSize(p, '.onboarding-app__input-field input'), 16,
        'PHONE input 16px (iOS zooms below 16)');
      await p.close();
    }

    // Review Focus 1: a long, translated-length label wraps instead of
    // overflowing, and the grid keeps every chip one column wide.
    const LONG = { ONBOARDING_ROLE_FREELANCER: 'Freelancer / Independent Consultant & Strategic Advisor' };
    for (const [vp, tag] of [[PHONE, 'PHONE'], [TABLET, 'TABLET'], [DESKTOP, 'DESKTOP']]) {
      await check(browser, page(renderStep(2, { labels: LONG })), vp, `${tag} long label`, async (p) => {
        const cells = await boxes(p, '.onboarding-app__option-grid[data-grid="role"] > .onboarding-app__option-chip');
        assert.ok(cells.every((c) => Math.abs(c.w - cells[0].w) < 0.5), `${tag} long label: equal columns`);
      });
    }

    // Review Focus 2 is the LANDSCAPE sweep above (812x375, every step).

    // Review Focus 3: a long save error with an unbroken token.
    await check(browser, page(renderStep(1, {
      saveError: 'Step 2 (industry) is incomplete. ' + 'x'.repeat(120),
    })), PHONE, 'PHONE long save error');

    // Review Focus 4: the "Other" reveal input on phone.
    await check(browser, page(renderStep(1, { data: { industry: 'other', industry_other: 'Aerospace' } })),
      PHONE, 'PHONE other reveal', async (p) => {
        assert.strictEqual(await fontSize(p, '.onboarding-app__other-input input'), 16, 'other input 16px');
      });

    // Review Focus 5: done screen with a long name and three badges.
    await check(browser, page(renderStep(7, {
      data: {
        firstname: 'Bartholomew-Alexandria', industry: 'finance_accounting',
        team_size: '50_plus', goal: 'build_workflows',
      },
    })), PHONE, 'PHONE long done screen');
  });
  console.log('responsive.test.js: all assertions passed');
})().catch((e) => { console.error(e); process.exit(1); });
