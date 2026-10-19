import SubTitleParser from './_sub_harness/parser.js'

function refSeconds(hhmmss) {
  const [h, m, s] = hhmmss.split(':').map(Number)
  return h*3600 + m*60 + s
}

function t(name, vtt) {
  return new Promise((resolve) => {
    SubTitleParser.parse(vtt, ({list}) => {
      console.log('===', name, '===')
      const cues = (list||[]).flatMap(g => g.list)
      cues.forEach((c,i)=>console.log(`  cue${i}: start=${c.start} end=${c.end} text=${JSON.stringify((c.text||[]).join('|'))}`))
      resolve()
    })
  })
}

await t('basic', `WEBVTT

00:00:01.000 --> 00:00:03.500
Hello world
`)

await t('with cue settings', `WEBVTT

00:00:01.000 --> 00:00:03.500 align:middle position:50%
Hello world
`)

await t('hours 3-digit', `WEBVTT

100:00:00.000 --> 100:00:02.000
long hour
`)

await t('SRT comma ms', `1
00:00:01,500 --> 00:00:03,750
srt line
`)
