// Smoke test for tests/render.js: the real skeleton renders to HTML that the
// layout tests can measure.
const assert = require('node:assert');
const { renderStep } = require('./render');

const industry = renderStep(1);
assert.strictEqual((industry.match(/onboarding-app__option-chip/g) || []).length, 12,
  'industry renders its 12 chips');
assert.ok(industry.includes('data-flow="y"'), 'boxes carry data-flow like ui-core renders them');
assert.ok(industry.includes('Tech / Software'), 'labels come from the locale fixture');

for (let s = 0; s <= 7; s++) {
  assert.ok(renderStep(s).includes('onboarding-app__primary-btn'), `step ${s} renders a primary button`);
}

assert.ok(renderStep(2, { labels: { ONBOARDING_ROLE_OTHER: 'Zzz' } }).includes('Zzz'),
  'labels can be overridden per render');
assert.ok(renderStep(1, { saveError: 'Boom' }).includes('Boom'), 'the save-error banner renders');

console.log('render.test.js: all assertions passed');
