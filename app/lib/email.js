// Pure, framework-free email helpers for the onboarding wizard.
// Regex intentionally matches the address-book widget and loby's EMAIL_RE.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value);
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

module.exports = { isValidEmail, normalizeEmail, EMAIL_RE };
