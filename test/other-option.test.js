const assert = require('assert');
const { OTHER_KEY, isOtherComplete, buildToolsPayload } = require('../app/lib/other-option');

// isOtherComplete — gating for required single-select steps
assert.strictEqual(isOtherComplete('', ''), false, 'no selection');
assert.strictEqual(isOtherComplete('tech_software', ''), true, 'concrete value, no text needed');
assert.strictEqual(isOtherComplete('other', ''), false, 'other, empty text -> blocked');
assert.strictEqual(isOtherComplete('other', '   '), false, 'other, whitespace -> blocked');
assert.strictEqual(isOtherComplete('other', 'Robotics'), true, 'other, real text -> ok');

// OTHER_KEY constant
assert.strictEqual(OTHER_KEY, 'other', 'OTHER_KEY constant');

// buildToolsPayload — custom string replaces the bare "other" marker
assert.deepStrictEqual(buildToolsPayload(['notion', 'slack'], ''), ['notion', 'slack'], 'no other selected');
assert.deepStrictEqual(buildToolsPayload(['notion', 'other'], 'Airtable'), ['notion', 'Airtable'], 'other replaced by text');
assert.deepStrictEqual(buildToolsPayload(['other'], ''), [], 'other with empty text dropped');
assert.deepStrictEqual(buildToolsPayload(['other'], '   '), [], 'other with whitespace-only text dropped');
assert.deepStrictEqual(buildToolsPayload(['other'], '  Airtable '), ['Airtable'], 'trimmed');
assert.deepStrictEqual(buildToolsPayload([], 'x'), [], 'other not selected -> text ignored');

console.log('other-option.test.js: all assertions passed');
