// Pure, framework-free wizard-resume logic.
//
// The server has always been able to return a user's saved answers
// (onboarding.get_response), but the client never asked: only the step INDEX
// was persisted, in localStorage. A reload therefore restored the position and
// none of the content, so the user landed mid-wizard with every field blank
// and, since selections gate the Continue button, often could not move.

const { isOtherComplete } = require('./other-option');

// Index of the final "done" screen. 7 since the invite step was removed — the
// flow is name(0) industry(1) role(2) team(3) tools(4) challenges(5) goals(6),
// and the design's progress bar shows exactly seven segments (Figma 155:47398
// renders all 7 filled on the last question screen).
//
// A step index stored by an earlier build is clamped here rather than trusted:
// an 8 from the invite-era build reads as the done screen, which is correct —
// that user had answered every question. The clamp below still refuses to skip
// a mandatory gap either way.
const MAX_STEP = 7;
// The steps mark_onboarding_complete validates. Resume must never place the
// user past the first of these with no stored answer, or they would be unable
// to satisfy completion without manually walking backwards.
const MANDATORY_STEPS = [0, 1, 2, 3];

/**
 * Coerce a JSON column into an array. Returns null (not []) when the value is
 * absent, so callers can tell "not answered" from "answered: none".
 */
function toList(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch (e) {
      return [];
    }
  }
  return null;
}

/**
 * Map a stored onboarding_responses row onto the client's `_data` shape.
 * Only three field names differ: intent -> goal, challenge_note ->
 * challenge_text, current_tools -> tools.
 *
 * @returns {{data: object, found: boolean}} `found` is false when the row
 *          carried nothing worth restoring, so the caller can skip a re-render.
 */
function hydrate(row) {
  const data = {};
  let found = false;
  if (!row) return { data, found };

  const take = (key, value) => {
    if (value == null || value === '') return;
    data[key] = value;
    found = true;
  };

  take('firstname', row.firstname);
  take('industry', row.industry);
  take('industry_other', row.industry_other);
  take('role', row.role);
  take('role_other', row.role_other);
  take('team_size', row.team_size);
  take('goal', row.intent);
  take('challenge_text', row.challenge_note);
  take('tools_other', row.tools_other);
  take('organisation_name', row.organisation_name);

  const tools = toList(row.current_tools != null ? row.current_tools : row.tools);
  if (tools) {
    data.tools = tools;
    found = true;
  }
  const challenges = toList(row.challenges);
  if (challenges) {
    data.challenges = challenges;
    found = true;
  }
  return { data, found };
}

/**
 * Whether a mandatory step has a usable stored answer. Mirrors the gating in
 * main.js checkForm() and, for steps 1-2, the "Other needs text" rule.
 */
function isStepAnswered(data, step) {
  const d = data || {};
  switch (step) {
    case 0: return !!(d.firstname && String(d.firstname).trim());
    case 1: return isOtherComplete(d.industry, d.industry_other);
    case 2: return isOtherComplete(d.role, d.role_other);
    case 3: return !!d.team_size;
    default: return true;
  }
}

/**
 * The first mandatory step with no stored answer, or -1 when all are answered.
 *
 * Used to recover from a mark_onboarding_complete refusal ("Step N is
 * incomplete"): the done screen has no Back button, so without this the user
 * is simply stuck there. Sending them to the offending step is the only exit
 * that also fixes the cause.
 */
function firstIncompleteStep(data) {
  for (const s of MANDATORY_STEPS) {
    if (!isStepAnswered(data, s)) return s;
  }
  return -1;
}

/**
 * Which step to show on resume: the stored index, clamped into range, and
 * pulled back to the first mandatory step that has no answer.
 */
function resumeStep(storedStep, data) {
  let stored = parseInt(storedStep, 10);
  if (isNaN(stored) || stored < 0) stored = 0;
  if (stored > MAX_STEP) stored = MAX_STEP;

  for (const s of MANDATORY_STEPS) {
    if (!isStepAnswered(data, s)) return Math.min(stored, s);
  }
  return stored;
}

module.exports = {
  hydrate, isStepAnswered, firstIncompleteStep, resumeStep, toList,
  MAX_STEP, MANDATORY_STEPS,
};
