// Pure, framework-free classification of a Drumee service response.
//
// WHY THIS EXISTS
// ---------------
// postService does not reject when a call fails, for any view that defines an
// `onServerComplain` hook — and the onboarding view defines one. In
// @drumee/ui-essentials/socket/utils.js:
//
//   * HTTP 200 carrying an `error` field  -> onServerComplain(payload), then
//                                            RESOLVES with payload
//   * non-200 / network failure           -> onServerComplain(err), then
//                                            RESOLVES with undefined
//
// So `.then(ok).catch(fail)` puts every outcome down the `ok` path and never
// reaches `.catch` at all. Failure has to be decided from the resolved value
// plus whatever the complaint hook recorded, which is what this module does.

const DEFAULT_FALLBACK = 'We could not save your answer. Please try again.';

/**
 * Best-effort human-readable message out of any of the shapes the framework
 * hands back: a string, an error payload, a fetch Response, or nothing.
 */
function errorText(e, fallback) {
  const fb = fallback || DEFAULT_FALLBACK;
  if (!e) return fb;
  if (typeof e === 'string') return e;
  if (typeof e.error === 'string' && e.error) return e.error;
  if (e.error && typeof e.error.message === 'string' && e.error.message) return e.error.message;
  if (typeof e.message === 'string' && e.message) return e.message;
  if (e.status) return `${fb} (${e.status})`;
  return fb;
}

/**
 * Decide whether a service call actually succeeded.
 *
 * @param {*} res       value the postService promise resolved with
 * @param {*} complaint whatever onServerComplain recorded during the call
 *                      (null when it was not invoked)
 * @param {string} fallback message to use when the failure is unnamed
 * @returns {{ok: boolean, data?: *, error?: string}}
 */
function classifyResponse(res, complaint, fallback) {
  // A complaint is definitive: the framework only invokes that hook on a real
  // failure, and it fires even when the promise then resolves normally.
  if (complaint) return { ok: false, error: errorText(complaint, fallback) };
  // Transport failure: the hook swallowed the throw and returned nothing.
  if (res == null) return { ok: false, error: errorText(null, fallback) };
  // Application-level failure surfaced in the payload.
  if (res.error || res.success === false) {
    return { ok: false, error: errorText(res, fallback) };
  }
  return { ok: true, data: res };
}

module.exports = { classifyResponse, errorText, DEFAULT_FALLBACK };
