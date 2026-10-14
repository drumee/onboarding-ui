// Lets Node require() the app's skeleton files, which mix `export` with
// `require`. Shared by load-modules.js and render.js. Idempotent.
const babel = require('@babel/core');
const fs = require('fs');
const Module = require('module');

const orig = Module._extensions['.js'];
if (!orig.__obBabel) {
  const hook = function (mod, filename) {
    if (filename.includes('node_modules')) return orig(mod, filename);
    const out = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
      filename,
      presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' } }]],
      babelrc: false, configFile: false,
    });
    mod._compile(out.code, filename);
  };
  hook.__obBabel = true;
  Module._extensions['.js'] = hook;
}
