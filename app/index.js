
// async function preloadKinds() {
//   Kind.registerAddons({
//     'sandbox_user' : import('./user/index.js'),
//   });
// }

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
    console.log(`Startging kind=${kind}`);
    await Kind.waitFor('widget_kpi')
    uiRouter.ensurePart(_a.body).then((p) => {
      p.feed({ kind });
    })
  })

}
document.addEventListener('drumee:router:ready', start);
