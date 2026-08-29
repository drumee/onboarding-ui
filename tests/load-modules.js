// Executes every skeleton module. `@babel/core transformFileSync` only PARSES —
// it accepts a const read before its initializer, which is how a temporal-dead-
// zone bug (require placed below the table that uses it) reached the browser
// once already. Running the module body is the only thing that catches it.
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');
const Module = require('module');

const root = path.resolve(__dirname, '..');
const orig = Module._extensions['.js'];
Module._extensions['.js'] = function (mod, filename) {
  if (filename.includes('node_modules')) return orig(mod, filename);
  const out = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename,
    presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' } }]],
    babelrc: false, configFile: false,
  });
  mod._compile(out.code, filename);
};

// Framework globals. Throwing proxies, so a module-load-time read fails loudly
// instead of silently returning undefined.
for (const g of ['Skeletons', 'LOCALE', '_a', '_K', '_', 'Visitor', 'bootstrap',
                 'SERVICE', 'LetcBox', 'Organization']) {
  if (!(g in global)) {
    global[g] = new Proxy({}, {
      get(t, k) { throw new Error(`module-load-time read of ${g}.${String(k)}`); },
    });
  }
}

const mods = [
  'app/skeleton/toolkit/icons.js',
  'app/skeleton/toolkit/logo.js',
  'app/skeleton/toolkit/form.js',
  'app/skeleton/toolkit/header.js',
  'app/skeleton/toolkit/footer.js',
  'app/skeleton/toolkit/button.js',
  'app/skeleton/toolkit/index.js',
  'app/skeleton/index.js',
];
for (const m of mods) {
  require(path.join(root, m));
  console.log('loaded ok:', m);
}
console.log('ALL MODULES EXECUTE CLEANLY');
