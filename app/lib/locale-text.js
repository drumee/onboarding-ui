// A localised string, or a readable fallback.
//
// WHY THIS EXISTS
// ---------------
// `LOCALE.SOME_KEY || 'fallback'` is the obvious form and it is wrong. For a
// key with no row in the locale bundle, LOCALE hands back THE KEY NAME, which
// is truthy — so the `||` never fires and the interface prints the key:
//
//     ALREADY_IN_LIST
//
// in red, where "That email is already in the list" belonged. Seen on the
// invite step, whose ALREADY_IN_LIST has never existed in ui-team/locale/*.json.
//
// The guard has to test for the echo as well as for absence. main.js already
// did that by hand for ONBOARDING_INVITES_SENT; this is the same three lines,
// in one place, for everywhere else that reads a key.
//
// Framework-free on purpose — LOCALE is passed in by the caller's closure over
// the global, so this stays unit-testable.

function loc(key, fallback) {
  let v;
  try {
    v = typeof LOCALE !== 'undefined' ? LOCALE[key] : null;
  } catch (e) {
    return fallback;
  }
  if (!v || v === key) return fallback;
  return v;
}

/**
 * Same, for a template with a single {0} placeholder.
 * loct('ONBOARDING_INVITES_SENT', '{0} invite(s) sent', 3) -> "3 invite(s) sent"
 */
function loct(key, fallback, value) {
  return String(loc(key, fallback)).replace('{0}', String(value));
}

module.exports = { loc, loct };
