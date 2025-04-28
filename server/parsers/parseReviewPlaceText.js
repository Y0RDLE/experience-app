// server/parsers/parseReviewPlaceText.js
import { load } from 'cheerio';

/**
 * HTML 전체 문자열을 받아서 리뷰플레이스 캠페인 정보를 추출합니다.
 * @param {string} html
 * @returns {object}
 */
export function parseReviewPlaceText(html) {
  const $ = load(html);

  // 제목에서 [지역] 제거 후 업체명
  const rawTitle = $('h1').first().text().trim() || '';
  const regionMatch = rawTitle.match(/\[([^\]]+)\]/);
  const defaultRegion = regionMatch
    ? regionMatch[1].split('/').slice(0, 2).join(' ')
    : '';
  const afterRegion = rawTitle.replace(/\[[^\]]+\]\s*/, '');
  const companyMatch = afterRegion.match(/^(.+?)에서\b/);
  const company = companyMatch
    ? companyMatch[1]
    : afterRegion.split(/\s+/)[0] || '';

  // 제공내역, 주소, 경쟁률
  const providedItems   = $('dt:contains("제공내역")').next('dd').text().trim();
  const fullAddress     = $('dt:contains("방문주소")').next('dd').text().trim();
  const competitionRatio = $('dt:contains("신청한 리뷰어")').next('dd').text().trim();

  // 발표일
  const announcementRaw   = $('dt:contains("발표")').next('dd').text().trim();
  const announcementDate = announcementRaw.match(/\d{1,2}[./]\d{1,2}/)?.[0] || '';

  // 체험(등록)기간
  const expRaw   = $('dt:contains("등록기간"), dt:contains("리뷰 등록기간")')
                     .next('dd').text().trim();
  const expMatch = expRaw.match(/(\d{1,2}[./]\d{1,2})\s*[~\-–]\s*(\d{1,2}[./]\d{1,2})/);
  const experiencePeriod = expMatch ? `${expMatch[1]} ~ ${expMatch[2]}` : '';

  // 네이버 플레이스 URL
  const naverPlaceUrl = $('a[href*="map.naver.com"], a[href*="naver.me"]')
                          .first().attr('href') || '';

  // regionShort: 주소 기준 두 단계
  let region = defaultRegion;
  if (fullAddress) {
    const parts = fullAddress.split(/\s+/);
    if (parts.length >= 2) {
      const prov = parts[0].replace(/(특별시|광역시|도)$/, '');
      const dist = parts[1].replace(/(시|군|구)$/, '');
      region = `${prov} ${dist}`;
    }
  }

  return {
    company,
    region,
    regionFull: fullAddress,
    providedItems,
    competitionRatio,
    announcementDate,
    experiencePeriod,
    naverPlaceUrl
  };
}
