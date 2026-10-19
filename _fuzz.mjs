import { M3U8Parser } from './_parser_harness/index.js'

// Independent reference implementation of RFC 8216 media-playlist essentials
function refParse(text, parentUrl) {
  const lines = text.split(/[\r\n]/).map(x=>x.trim()).filter(Boolean)
  let sn = 0, cc = 0, startSN = 0, startCC = 0, total = 0
  let cur = null
  const segs = []
  let curKey = null, curIV = null
  for (const line of lines) {
    if (!line.startsWith('#')) {
      segs.push({ sn, cc, url: line, start: total, duration: cur ? cur.dur : 0, key: curKey })
      total += (cur ? cur.dur : 0)
      sn++; continue
    }
    if (line.startsWith('#EXTINF:')) {
      const dur = parseFloat(line.slice(8).split(',')[0])
      cur = { dur }
    } else if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
      sn = startSN = parseInt(line.slice(22))
    } else if (line.startsWith('#EXT-X-DISCONTINUITY-SEQUENCE:')) {
      cc = startCC = parseInt(line.slice(30))
    } else if (line === '#EXT-X-DISCONTINUITY') {
      cc++
    }
  }
  return { segs, startSN, startCC, total }
}

// Fuzz: random playlists
function rng(seed){ return () => (seed = (seed*1103515245+12345)&0x7fffffff)/0x7fffffff }

let mismatches = 0
for (let trial = 0; trial < 2000; trial++) {
  const r = rng(trial + 1)
  const nSeg = 2 + Math.floor(r()*8)
  let sn = 1 + Math.floor(r()*10)
  let cc = Math.floor(r()*3)
  let body = `#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXT-X-MEDIA-SEQUENCE:${sn}\n#EXT-X-DISCONTINUITY-SEQUENCE:${cc}\n`
  const expected = []
  let total = 0
  for (let s = 0; s < nSeg; s++) {
    if (r() < 0.2) { body += `#EXT-X-DISCONTINUITY\n`; cc++ }
    const dur = (1 + Math.floor(r()*9)) + '.' + Math.floor(r()*10)
    body += `#EXTINF:${dur},\n`
    body += `seg${s}.ts\n`
    expected.push({ sn, cc, dur: parseFloat(dur), start: total })
    total += parseFloat(dur)
    sn++
  }
  body += `#EXT-X-ENDLIST\n`

  let got
  try { got = M3U8Parser.parse(body, 'http://host/dir/m.m3u8') } catch(e){ console.log('THROW trial', trial, e.message); mismatches++; continue }
  if (got.segments.length !== expected.length) {
    console.log(`MISMATCH trial ${trial}: seg count got=${got.segments.length} exp=${expected.length}`)
    mismatches++; continue
  }
  for (let i=0;i<expected.length;i++){
    const g = got.segments[i], e = expected[i]
    if (g.sn !== e.sn || g.cc !== e.cc || Math.abs(g.duration - e.dur) > 1e-9 || Math.abs(g.start - e.start) > 1e-9) {
      console.log(`MISMATCH trial ${trial} seg${i}: got sn=${g.sn} cc=${g.cc} dur=${g.duration} start=${g.start} | exp sn=${e.sn} cc=${e.cc} dur=${e.dur} start=${e.start}`)
      mismatches++
      break
    }
  }
}
console.log(`\nDone. mismatches=${mismatches}/2000`)
