// Differential oracle: xgplayer getAbsoluteUrl vs WHATWG new URL(ref, base)
const REGEXP_TAG = /^#(EXT[^:]*)(?::(.*))?$/
const REGEXP_ATTR = /([^=]+)=(?:"([^"]*)"|([^",]*))(?:,|$)/g
const REGEXP_ABSOLUTE_URL = /^(?:[a-zA-Z0-9+\-.]+:)?\/\//
const REGEXP_URL_PAIR = /^((?:[a-zA-Z0-9+\-.]+:)?\/\/[^/?#]*)?([^?#]*\/)?/

function getAbsoluteUrl(url, parentUrl) {
  if (!parentUrl || !url || REGEXP_ABSOLUTE_URL.test(url)) return url
  const pairs = REGEXP_URL_PAIR.exec(parentUrl)
  if (!pairs) return url
  if (url[0] === '/') return pairs[1] + url
  return pairs[1] + pairs[2] + url
}

// WHATWG oracle
function whatwg(ref, base) {
  try { return new URL(ref, base).href } catch (e) { return 'ERR:' + e.message }
}

const cases = [
  // [ref, base]
  ['seg1.ts', 'http://host/dir/manifest.m3u8?token=abc'],
  ['seg1.ts', 'http://host/dir/manifest.m3u8?token=abc#frag'],
  ['seg1.ts', 'http://host/dir/manifest.m3u8'],
  ['seg1.ts', 'http://host/manifest.m3u8?token=abc'],
  ['seg1.ts', 'http://host/manifest.m3u8'],
  ['seg1.ts', 'http://host/dir/'],
  ['../seg.ts', 'http://host/a/b/manifest.m3u8?t=1'],
  ['../../seg.ts', 'http://host/a/b/c/manifest.m3u8'],
  ['/abs/seg.ts', 'http://host/dir/manifest.m3u8?token=abc'],
  ['seg.ts?x=1', 'http://host/dir/manifest.m3u8?token=abc'],
  ['seg.ts#frag', 'http://host/dir/manifest.m3u8?token=abc'],
  ['//cdn.com/seg.ts', 'http://host/dir/manifest.m3u8'],
  ['seg1.ts', 'https://host:8443/dir/manifest.m3u8?a=1&b=2'],
  ['seg1.ts', 'http://host/dir//manifest.m3u8'],
  ['seg1.ts', 'http://host/a%20b/manifest.m3u8?x=1'],
  ['seg%201.ts', 'http://host/dir/manifest.m3u8?x=1'],
]

console.log('ref | base | xgplayer | WHATWG | MATCH?')
for (const [ref, base] of cases) {
  const mine = getAbsoluteUrl(ref, base)
  const wa = whatwg(ref, base)
  const match = mine === wa ? 'OK' : '*** DIFF ***'
  console.log(`${match}\n  ref=${ref}\n  base=${base}\n  mine=${mine}\n  wa=${wa}\n`)
}
