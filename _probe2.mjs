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

// Correct DISCONTINUITY
show('DISCONTINUITY correct', () => {
  const txt = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:10
#EXT-X-DISCONTINUITY-SEQUENCE:5
#EXTINF:2,
seg0.ts
#EXT-X-DISCONTINUITY
#EXTINF:2,
seg1.ts
#EXT-X-ENDLIST`
  const p = M3U8Parser.parse(txt, 'http://host/dir/m.m3u8')
  p.segments.forEach((s,i)=>console.log(`  seg${i} sn=${s.sn} cc=${s.cc}`))
  console.log('  startCC=', p.startCC, 'endCC=', p.endCC)
})

// DATERANGE
show('DATERANGE', () => {
  const txt = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:1
#EXT-X-DATERANGE:ID="ad1",CLASS="com.apple.hls.interstitial",START-DATE="2020-01-01T00:00:00Z",DURATION=10,X-ASSET-URI="ad.ts"
#EXTINF:2,
seg0.ts
#EXT-X-ENDLIST`
  const p = M3U8Parser.parse(txt, 'http://host/dir/m.m3u8')
  console.log('  dateRanges=', JSON.stringify(Object.keys(p.dateRanges)))
})

// BYTERANGE: chained where prev ends at a larger value, confirm normal case
show('BYTERANGE chained prev end = 99', () => {
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
  p.segments.forEach((s,i)=>console.log(`  seg${i} byteRange=${JSON.stringify(s.byteRange)}`))
})

// BYTERANGE: first-ever no-offset (no prev) -> should not be [NaN,NaN]
show('BYTERANGE no-offset first segment (no prev)', () => {
  const txt = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:1
#EXTINF:2,
#EXT-X-BYTERANGE:100
seg0.ts
#EXT-X-ENDLIST`
  const p = M3U8Parser.parse(txt, 'http://host/dir/m.m3u8')
  p.segments.forEach((s,i)=>console.log(`  seg${i} byteRange=${JSON.stringify(s.byteRange)}`))
})

// KEY URI with query gets absolute
show('KEY URI resolution', () => {
  const txt = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:1
#EXT-X-KEY:METHOD=AES-128,URI="key.bin?t=1"
#EXTINF:2,
seg0.ts
#EXT-X-ENDLIST`
  const p = M3U8Parser.parse(txt, 'http://host/dir/m.m3u8')
  console.log('  key.url =', p.segments[0].key.url)
})

// SKIP
show('SKIP / SKIPPED-SEGMENTS', () => {
  const txt = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:100
#EXT-X-SERVER-CONTROL:CAN-BLOCK-RELOAD=YES,PART-HOLD-BACK=3
#EXT-X-SKIP:SKIPPED-SEGMENTS:5
#EXTINF:2,
seg105.ts
#EXT-X-ENDLIST`
  try {
    const p = M3U8Parser.parse(txt, 'http://host/dir/m.m3u8')
    console.log('  startSN=', p.startSN, 'endSN=', p.endSN, 'skipped=', p.skippedSegments)
  } catch(e){ console.log('  throw', e.message) }
})
