const assert = require('node:assert');
const { resumeStep, MAX_STEP, firstIncompleteStep } = require('../app/lib/resume');

// A complete set of mandatory answers, so the clamp is the only thing under test.
const answered = {
  firstname: 'Alex', industry: 'healthcare', role: 'founder_ceo', team_size: '2_10',
};

assert.strictEqual(MAX_STEP, 7, 'MAX_STEP must be the done-screen index (7 steps: 0-6)');
assert.strictEqual(resumeStep('7', answered), 7, 'the done screen is reachable');
assert.strictEqual(resumeStep('8', answered), 7, 'a stale index from the 8-step build clamps to done');
assert.strictEqual(resumeStep('99', answered), 7, 'garbage clamps to done');
assert.strictEqual(resumeStep('-1', answered), 0, 'negative clamps to the first step');

// The clamp must still never jump a mandatory gap.
assert.strictEqual(resumeStep('7', { firstname: 'Alex' }), 1, 'stops at the first unanswered mandatory step');
assert.strictEqual(firstIncompleteStep({ firstname: 'Alex' }), 1);

console.log('resume.test.js: all assertions passed');
