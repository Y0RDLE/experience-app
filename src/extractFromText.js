export function extractFromText(text) {
  console.log('📄 extractFromText 텍스트 일부:', text.slice(0, 300));

  const lowered = text.toLowerCase();
  const isReviewNote =
    lowered.includes('reviewnote') ||
    lowered.includes('리뷰노트') ||
    lowered.includes('대한민국 최초 무료체험단');

  const isGangnam =
    lowered.includes('강남맛집') ||
    lowered.includes('939au0g4vj8sq');

  const getValue = (label, customRegex) => {
    const regex = customRegex || new RegExp(`${label}\\s*[:\\-]?\\s*([^\\n]+)`);
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  let company = '';
  let region = '';
  let providedItems = '';
  let experiencePeriod = '';
  let announcementDate = '';
  let competitionRatio = '';
  let naverPlaceUrl = '';
  let fullAddress = '';

  const titleMatch = text.match(/\[(.+?)\]\s*(.+?)(\n|$)/);
  region = titleMatch ? titleMatch[1].trim() : '';
  company = titleMatch ? titleMatch[2].trim() : '';

  if (isReviewNote) {
    providedItems = getValue('체험권', /(점심|저녁)?특선 체험권\s*\d+(,?\d+)?원 상당/);
    const matchDate = text.match(/리뷰 등록기간\s*([0-9.]+)\s*~\s*([0-9.]+)/);
    if (matchDate) experiencePeriod = `${matchDate[1]} ~ ${matchDate[2]}`;
    const announceMatch = text.match(/리뷰어 발표\s*([0-9.]+|[0-9]+월\s*[0-9]+일)/);
    announcementDate = announceMatch ? announceMatch[1].trim() : '';
    const competitionMatch = text.match(/신청자\s*(\d+\s*\/\s*\d+)/);
    competitionRatio = competitionMatch ? competitionMatch[1].trim() : '';
  }

  if (isGangnam) {
    // 강남맛집은 제공내역이 맨 앞에 있음
    const firstLine = text.split('\n').find(line => line.includes('체험권') && line.includes('원'));
    providedItems = firstLine ? firstLine.trim() : '';
    const matchDate = text.match(/리뷰 등록기간\s*([0-9.]+)\s*~\s*([0-9.]+)/);
    if (matchDate) experiencePeriod = `${matchDate[1]} ~ ${matchDate[2]}`;
    const announceMatch = text.match(/리뷰어 발표\s*([0-9.]+|[0-9]+월\s*[0-9]+일)/);
    announcementDate = announceMatch ? announceMatch[1].trim() : '';
    const competitionMatch = text.match(/신청자\s*(\d+\s*\/\s*\d+)/);
    competitionRatio = competitionMatch ? competitionMatch[1].trim() : '';
  }

  const naverMatch = text.match(/https?:\/\/map\.naver\.com\/v5\/search\/[^\s)"]+/);
  naverPlaceUrl = naverMatch ? naverMatch[0].trim() : '';

  const addrMatch = text.match(/\n(경기|서울|인천|부산|대전|대구|광주|울산)[^\n]+/);
  fullAddress = addrMatch ? addrMatch[0].trim() : '';

  return {
    company,
    region,
    providedItems,
    experiencePeriod,
    announcementDate,
    competitionRatio,
    naverPlaceUrl,
    fullAddress,
  };
}
