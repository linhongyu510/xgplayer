import { M3U8Parser } from './_parser_harness/index.js'

function show(name, fn) {
  try {
    console.log('=== ' + name + ' ===')
    fn()
  } catch (e) {
    console.log('  THROW:', e.message)
  }
  console.log('')
}

// 1. BYTERANGE chained: first explicit @0 (range [0,0]), next no-offset should start at 1
show('BYTERANGE chained from [0,0]', () => {
  const txt = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:1
#EXTINF:1,
#EXT-X-BYTERANGE:1@0
seg0.ts
#EXTINF:1,
#EXT-X-BYTERANGE:1
seg1.ts
#EXT-X-ENDLIST`
  const p = M3U8Parser.parse(txt, 'http://host/dir/m.m3u8')
  p.segments.forEach((s, i) => console.log(`  seg${i} sn=${s.sn} byteRange=${JSON.stringify(s.byteRange)}`))
})

// 2. BYTERANGE normal chain
show('BYTERANGE chained normal', () => {
  const txt = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:1
#EXTINF:2,
#EXT-X-BYTERANGE:100@0
seg0.ts
#EXTINF:3,
#EXT-X-BYTERANGE:50
seg1.ts
#EXT-X-ENDLIST`
  const p = M3U8Parser.parse(txt, 'http://host/dir/m.m3u8')
  p.segments.forEach((s, i) => console.log(`  seg${i} sn=${s.sn} byteRange=${JSON.stringify(s.byteRange)} (dur=${s.duration})`))
})

// 3. KEY IV parsing
show('KEY IV parsing', () => {
  const txt = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:1
#EXT-X-KEY:METHOD=AES-128,URI="/key.bin",IV=0x00000000000000000000000000000010
#EXTINF:2,
seg0.ts
#EXT-X-ENDLIST`
  const p = M3U8Parser.parse(txt, 'http://host/dir/m.m3u8')
  console.log('  seg0 key.iv =', Array.from(p.segments[0].key.iv).map(b=>b.toString(16)).join(' '))
})

// 4. DISCONTINUITY sequence
show('DISCONTINUITY', () => {
  const txt = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:10
#EXT-X-DISCONTINUITY-SEQUENCE:5
#EXTINF:2,
seg0.ts
#EXT-X-DISCONTINUATION
#EXTINF:2,
seg1.ts
#EXT-X-ENDLIST`
  const p = M3U8Parser.parse(txt, 'http://host/dir/m.m3u8')
  p.segments.forEach((s,i)=>console.log(`  seg${i} sn=${s.sn} cc=${s.cc}`))
  console.log('  startCC=', p.startCC, 'endCC=', p.endCC)
})

// 5. EXTINF title with comma
show('EXTINF title with comma', () => {
  const txt = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:1
#EXTINF:2.0,title,with,commas
seg0.ts
#EXT-X-ENDLIST`
  const p = M3U8Parser.parse(txt, 'http://host/dir/m.m3u8')
  console.log('  title =', JSON.stringify(p.segments[0].title))
})
