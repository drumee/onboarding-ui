// Shared logic for the "Other → type your own" custom option on the
// industry / role / tools onboarding steps.

const OTHER_KEY = 'other';

/**
 * Whether a single-select step whose value may be "other" is complete enough
 * to advance. A concrete (non-"other") value is complete on its own; "other"
 * additionally requires non-empty custom text.
 */
function isOtherComplete(value, otherText) {
  if (!value) return false;
  if (value !== OTHER_KEY) return true;
  return !!(otherText && otherText.trim());
}

/**
 * Build the tools array sent to save_onboarding_tools. When "other" is
 * selected with non-empty text, the trimmed string replaces the bare "other"
 * marker; an empty custom value drops "other" entirely.
 */
function buildToolsPayload(tools, otherText) {
  const list = Array.isArray(tools) ? tools : [];
  const custom = (otherText || '').trim();
  const out = list.filter((t) => t !== OTHER_KEY);
  if (list.includes(OTHER_KEY) && custom) out.push(custom);
  return out;
}

module.exports = { OTHER_KEY, isOtherComplete, buildToolsPayload };
