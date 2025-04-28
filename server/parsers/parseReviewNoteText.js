import { load } from 'cheerio';

/**
 * 리뷰노트형 체험단 텍스트(HTML)를 파싱하여
 * { company, region, regionFull, providedItems, competitionRatio,
 *   announcementDate, experiencePeriod, naverPlaceUrl }
 * 형태로 반환합니다.
 *
 * @param {string} html 페이지 전체 HTML 문자열
 * @returns {object}
 */
export function parseReviewNoteText(html) {
  const $ = load(html);

  // 회사명 (제목)
  const company = $('h1.campaign-title, .campaign-title').first().text().trim();

  // 제공내역
  const providedItems = $('dt:contains("제공내역")')
    .next('dd').text().trim();

  // 방문주소
  const fullAddress = $('dt:contains("방문주소")')
    .next('dd').text().trim();

  // region: 주소 앞 두 단계
  let region = '';
  if (fullAddress) {
    const parts = fullAddress.split(/\s+/);
    if (parts.length >= 2) {
      const prov = parts[0].replace(/(특별시|광역시|도)$/, '');
      const dist = parts[1].replace(/(시|군|구)$/, '');
      region = `${prov} ${dist}`;
    }
  }

  // 경쟁률
  const competitionRatio = $('dt:contains("신청한 리뷰어")')
    .next('dd').text().trim();

  // 발표일
  const announcementRaw = $('dt:contains("리뷰발표"), dt:contains("리뷰어발표")')
    .next('dd').text().trim();
  const announcementDate = announcementRaw.match(/\d{1,2}[.\/]\d{1,2}/)?.[0] || '';

  // 리뷰 등록기간
  const expRaw = $('dt:contains("리뷰 등록기간")')
    .next('dd').text().trim();
  const expMatch = expRaw.match(/(\d{1,2}[.\/]\d{1,2})\s*[~\-–]\s*(\d{1,2}[.\/]\d{1,2})/);
  const experiencePeriod = expMatch ? `${expMatch[1]} ~ ${expMatch[2]}` : '';

  // 네이버 플레이스 URL
  const naverPlaceUrl = $('a[href*="map.naver.com"], a[href*="naver.me"]')
    .first().attr('href') || '';

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
