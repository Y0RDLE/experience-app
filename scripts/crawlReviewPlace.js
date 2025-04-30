// server/parsers/parseReviewNoteText.js
import { load } from 'cheerio'

export function parseReviewNoteText(html) {
  const $ = load(html)

  // 1) 상단 4개 필드(업체명, 지역, 제공내역, 기타 사항) 가져오기
  const fields = {}
  $('div.space-y-4.md\\:space-y-0.md\\:flex.md\\:items-start').each((i, el) => {
    const label = $(el).find('div.text-lg.font-bold').text().trim().replace(/\n/g,'')
    const value = $(el).find('div.w-full > div').text().trim().replace(/\n/g,' ')
    if (label === '업체명')        fields.company       = value
    else if (label === '지역')    fields.region        = value
    else if (label === '제공내역') fields.providedItems = value
    else if (label === '기타 사항')fields.additionalInfo= value
  })

  // 2) 중앙 그리드에서 기간·경쟁률·발표일 뽑아오기
  let experiencePeriod = ''
  let announcementDate = ''
  let competitionRatio = ''
  $('div.grid.grid-cols-12').each((_, el) => {
    const key   = $(el).find('div.col-span-5').text().trim()
    const val   = $(el).find('div.col-span-7').text().trim()
    if (key.includes('신청기간')) experiencePeriod = val
    if (key.includes('발표'))     announcementDate = val.split(/\s/)[0]   // “5/8 (목)” → “5/8”
    if (key.includes('실시간 지원 현황')) {
      const m = val.match(/지원\s*(\d+)\s*\/\s*모집\s*(\d+)/)
      if (m) competitionRatio = `지원 ${m[1]} / 모집 ${m[2]}`
    }
  })

  // 3) 날짜 포맷 통일 (MM/DD → YYYY-MM-DD)
  const fixDate = s => {
    const m = s.match(/(\d{1,2})[\/\.](\d{1,2})/)
    if (m) {
      const [ , mo, da ] = m
      const yy = new Date().getFullYear()
      return `${yy}-${mo.padStart(2,'0')}-${da.padStart(2,'0')}`
    }
    return s
  }

  return {
    company:          fields.company || '',
    region:           fields.region  || '',
    providedItems:    fields.providedItems || '',
    additionalInfo:   fields.additionalInfo  || '',
    experiencePeriod: experiencePeriod.split('~').map(fixDate).join(' ~ '),
    announcementDate: fixDate(announcementDate),
    competitionRatio: competitionRatio || '',
    // naverPlaceUrl 는 라우터에서 채워 줍니다.
  }
}
