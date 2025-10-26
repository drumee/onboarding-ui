/**
 * 
 * @param {*} name 
 * @param {*} s 
 * @param {*} l 
 * @returns 
 */
export function colorFromName(name, s, l) {
  if (s == null) {
    s = 40;
  }
  if (l == null) {
    l = 60;
  }
  let hash = 0;
  let i = 0;
  while (i < name.length) {
    hash = name.charCodeAt(i) + (hash << 5) - hash;
    i++;
  }
  const h = hash % 360;
  const r = `hsl(${h}, ${s}%, ${l}%)`;
  return r;
}

/**
 * 
 * @param {*} ui 
 * @param {*} type 
 * @returns 
 */
export function state(ui, type){
  if(ui.mget(_a.type) == type) return 1
  return 0
}
