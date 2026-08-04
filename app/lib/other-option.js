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
 * Build the tools payload for save_onboarding_tools.
 *
 * The custom "Other" text is returned SEPARATELY, in `tools_other`, and the
 * array keeps the canonical `other` marker — the same shape industry and role
 * have always used (industry/industry_other, role/role_other).
 *
 * Previously the free text was substituted INTO the array in place of the
 * marker, which left current_tools holding a mixture of canonical keys and
 * arbitrary user strings: nothing downstream could tell "picked Notion" from
 * "typed Notion", and the analytics export flattened both the same way.
 *
 * A bare "other" with empty/whitespace text is not a selection, so both the
 * marker and the text are dropped — matching isOtherComplete above.
 */
function buildToolsSelection(tools, otherText) {
  const list = Array.isArray(tools) ? tools : [];
  const custom = (otherText || '').trim();
  const picked = list.filter((t) => t !== OTHER_KEY);
  if (list.includes(OTHER_KEY) && custom) {
    return { tools: [...picked, OTHER_KEY], tools_other: custom };
  }
  return { tools: picked, tools_other: '' };
}

module.exports = { OTHER_KEY, isOtherComplete, buildToolsSelection };
