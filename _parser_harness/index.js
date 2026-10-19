import { parseMasterPlaylist } from './master.js'
import { parseMediaPlaylist } from './media.js'
import { getLines } from './utils.js'

export class M3U8Parser {
  static parse (text = '', parentUrl, useLowLatency) {
    if (!text.includes('#EXTM3U')) throw new Error('Invalid m3u8 file')

    const lines = getLines(text)

    if (M3U8Parser.isMediaPlaylist(text)) {
      return parseMediaPlaylist(lines, parentUrl, useLowLatency)
    }
    return parseMasterPlaylist(lines, parentUrl)
  }

  static isMediaPlaylist (text) {
    return text.includes('#EXTINF:') || text.includes('#EXT-X-TARGETDURATION:')
  }
}
