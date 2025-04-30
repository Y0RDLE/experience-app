// parsers/parseReviewNoteText.js
import { load } from 'cheerio';

export function parseReviewNoteText(html) {
  const $ = load(html);

  // helper: dt 텍스트 포함하는 <dt> 찾아서 다음 <dd> 반환
  const fetchDd = (keyword) => {
    const dt = $('dt').filter((i, el) => $(el).text().includes(keyword)).first();
    if (!dt.length) return '';
    return dt.next('dd').text().trim();
  };

  const company       = $('h1.campaign-title').text().trim();
  const regionFull    = fetchDd('방문 주소');
  const region        = regionFull.split(/\s+/).slice(0,2).join(' ');
  const providedItems = fetchDd('제공서비스/물품');
  const experiencePeriod   = $('th').filter((i, el) => $(el).text().includes('체험단 신청기간')).next('td').text().trim();
  const announcementDate    = $('th').filter((i, el) => $(el).text().includes('리뷰어 발표')).next('td').text().trim();
  const competitionRatio    = (fetchDd('실시간 지원 현황').match(/지원\s*\d+\s*\/\s*모집\s*\d+/) || [''])[0];

  return { company, regionFull, region, providedItems, experiencePeriod, announcementDate, competitionRatio };
}
