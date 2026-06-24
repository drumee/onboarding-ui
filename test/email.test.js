const assert = require('assert');
const { isValidEmail, normalizeEmail } = require('../app/lib/email');

// isValidEmail
assert.strictEqual(isValidEmail('name@company.com'), true, 'plain valid');
assert.strictEqual(isValidEmail('a.b+tag@sub.example.io'), true, 'plus + subdomain');
assert.strictEqual(isValidEmail('no-at-sign.com'), false, 'missing @');
assert.strictEqual(isValidEmail('foo@bar'), false, 'missing TLD dot');
assert.strictEqual(isValidEmail('has space@x.com'), false, 'whitespace');
assert.strictEqual(isValidEmail(''), false, 'empty');

// normalizeEmail
assert.strictEqual(normalizeEmail('  Name@Company.COM '), 'name@company.com', 'trim + lower');

console.log('email.test.js: all assertions passed');
