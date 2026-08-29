const assert = require('node:assert');
const { resumeStep, MAX_STEP, firstIncompleteStep } = require('../app/lib/resume');

// A complete set of mandatory answers, so the clamp is the only thing under test.
const answered = {
  firstname: 'Alex', industry: 'healthcare', role: 'founder_ceo', team_size: '2_10',
};

// 8 question screens (name..invite) with the done screen at index 8.
assert.strictEqual(MAX_STEP, 8, 'MAX_STEP is the done-screen index');
assert.strictEqual(resumeStep('8', answered), 8, 'the done screen is reachable');
assert.strictEqual(resumeStep('99', answered), 8, 'garbage clamps to done');
assert.strictEqual(resumeStep('-1', answered), 0, 'negative clamps to the first step');
assert.strictEqual(resumeStep('7', answered), 7, 'the invite step is reachable');

// The clamp must never jump a mandatory gap.
assert.strictEqual(resumeStep('8', { firstname: 'Alex' }), 1, 'stops at the first unanswered mandatory step');
assert.strictEqual(firstIncompleteStep({ firstname: 'Alex' }), 1);
assert.strictEqual(firstIncompleteStep(answered), -1, 'all mandatory answered');

console.log('resume.test.js: all assertions passed');
