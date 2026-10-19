// The option grids are one CSS grid each (not pre-chunked rows), so the
// column count is CSS's to change per breakpoint.
const assert = require('node:assert');
const { page, withBrowser, show, boxes, gridCols } = require('./harness');
const { renderStep } = require('./render');

const DESKTOP = { width: 1440, height: 900 };
const CASES = [['industry', 1, 3], ['role', 2, 2], ['team_size', 3, 2]];

(async () => {
  await withBrowser(async (browser) => {
    for (const [grid, step, n] of CASES) {
      const p = await show(browser, page(renderStep(step)), DESKTOP);
      assert.strictEqual(await gridCols(p, grid), n, `${grid}: ${n} columns on desktop`);
      const cells = await boxes(p, `.onboarding-app__option-grid[data-grid="${grid}"] > .onboarding-app__option-chip`);
      assert.ok(cells.length > 0, `${grid}: chips are direct children of the grid`);
      assert.ok(cells.every((c) => Math.abs(c.w - cells[0].w) < 0.5),
        `${grid}: every chip is one column wide, a lone trailing chip included`);
      assert.strictEqual(await p.$('.onboarding-app__option-row'), null, `${grid}: no row wrappers`);
      assert.strictEqual(await p.$('.onboarding-app__option-grid[data-field]'), null,
        `${grid}: the grid box must not carry data-field (_selectOption would stamp it)`);
      await p.close();
    }
  });
  console.log('grid.test.js: all assertions passed');
})().catch((e) => { console.error(e); process.exit(1); });
