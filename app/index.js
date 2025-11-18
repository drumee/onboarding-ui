
/**
 * Load Drumee rendering engine (LETC)
 * Work from electron
 * @param {*} e 
 */
async function start(e) {
  document.removeEventListener('drumee:ready', start);
  let el = document.getElementById("loader-spinner");
  el && el.remove();
  let kind = 'onboarding';
  console.log(`Loading onboarding, kind=${kind}`);
  Kind.registerAddons(require("./seeds"));
  Kind.waitFor(kind).then(async (k) => {
    console.log(`Startging kind=${kind}!`);
    uiRouter.ensurePart(_a.body).then((p) => {
      p.feed({ kind });
    })
  })
}

if (document.readyState == 'complete') {
  start()
} else {
  if (location.hash) {
    document.addEventListener('drumee:plugins:ready', start);
  } else {
    document.addEventListener('drumee:router:ready', start);
  }
}
