
async function start(e) {
  document.removeEventListener('drumee:ready', start);
  let el = document.getElementById("loader-spinner");
  el && el.remove();
  let kind = 'onboarding';
  console.log(`Loading onboarding, kind=${kind}`);
  Kind.registerAddons(require("./seeds"));
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
