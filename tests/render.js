// Renders the REAL app/skeleton modules to static HTML, so layout tests
// measure the markup the wizard actually produces rather than a hand-written
// copy of it. Skeletons is stubbed to emit what ui-core puts in the DOM for
// the parts the wizard uses: a .drumee-widget div with the descriptor's
// className, data-flow for Box.X / Box.Y (and Element, which ui-core renders as
// a row flexbox), data-* from `dataset`, Note's inner .note-content, and
// Entry's <input>.
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE = require('./fixtures/locale-en.json');

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function attrs(o, flow) {
  const cls = ['drumee-widget', o.className].filter(Boolean).join(' ');
  let a = ` class="${esc(cls)}"`;
  if (flow) a += ` data-flow="${flow}"`;
  for (const [k, v] of Object.entries(o.dataset || {})) a += ` data-${k}="${esc(v)}"`;
  return a;
}

function toHtml(node) {
  if (node == null || node === '') return '';
  if (Array.isArray(node)) return node.map(toHtml).join('');
  return node.__html;
}

const content = (o) => (o.content == null ? '' : o.content);
const box = (flow) => (o) => ({ __html: `<div${attrs(o, flow)}>${toHtml(o.kids || [])}</div>` });
const element = (o) => ({ __html: `<div${attrs(o, 'x')}>${content(o)}</div>` });
// ui-core's Note (letc/widgets/text) defaults to flow "wrap", which ui-styles
// renders as a row flexbox: its .note-content is a flex item, so text-align on
// the Note itself does not move the text.
const note = (o) => ({ __html: `<div${attrs(o, 'wrap')}><div class="note-content">${content(o)}</div></div>` });
const entry = (o) => ({
  __html: `<div${attrs(o)}><input name="${esc(o.name || '')}" value="${esc(o.value || '')}" placeholder="${esc(o.placeholder || '')}"></div>`,
});

function installGlobals(labels) {
  const map = { ...FIXTURE, ...(labels || {}) };
  global.Skeletons = { Box: { X: box('x'), Y: box('y') }, Element: element, Note: note, Entry: entry };
  // The real bundle echoes an unknown key back; loc() relies on that.
  global.LOCALE = new Proxy({}, { get: (t, k) => (k in map ? map[k] : String(k)) });
  global._a = new Proxy({}, { get: (t, k) => String(k) });
  global.Visitor = { get: () => '', language: () => 'en' };
}

function renderStep(step, { data = {}, saveError = null, labels = null } = {}) {
  installGlobals(labels);
  require('./babel-register');
  const skeleton = require(path.join(ROOT, 'app/skeleton'));
  const ui = {
    fig: { family: 'onboarding-app' },
    _step: step,
    _data: { firstname: 'Alex', ...data },
    _saveError: saveError,
    _id: 'test',
  };
  return `<div class="drumee-widget onboarding-app__ui" data-flow="y">${toHtml(skeleton(ui))}</div>`;
}

module.exports = { renderStep };
