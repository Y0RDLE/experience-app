// src/server/parsers/parseGANGNAMText.js
// 강남맛집 복붙 파서 최신형 (업체 다음 줄을 제공내역으로 추출)
export function parseGANGNAMText(text) {
  const clean = (s) => s?.replace(/\s+/g, ' ').trim() || '';
  // 텍스트를 줄 단위로 나누고 빈 줄 제거
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. 업체명과 기본 지역
  const compLineIdx = lines.findIndex(l => /^\[[^\]]+\]/.test(l));
  const compMatch = lines[compLineIdx]?.match(/^\[([^\]]+)\]\s*(.+)$/) || [];
  const defaultRegion = clean(compMatch[1] || '');
  const company = clean(compMatch[2] || '');

  // 2. 제공내역: 업체명 줄 다음 줄
  const providedItems = clean(lines[compLineIdx + 1] || '');

  // 3. 전체 주소 (예: 강원특별자치도 횡성군 둔내면 삽교리 1506-1)
  const fullAddressMatch = text.match(/\b(경기|서울|인천|부산|대전|대구|광주|울산|강원특별자치도)[^\n]+/);
  const regionFull = clean(fullAddressMatch?.[0] || '');

  // 4. 지역 축약 (시·도 + 시·군·구)
  let region = defaultRegion;
  if (regionFull) {
    const parts = regionFull.split(/\s+/);
    if (parts.length >= 2) {
      const prov = parts[0].replace(/(특별자치도|특별자치|광역시|도)$/, '');
      const dist = parts[1].replace(/(시|군|구)$/, '');
      region = `${prov} ${dist}`;
    }
  }

  // 5. 경쟁률: '신청자 144/2' → '144:2'
  let competitionRatio = clean(text.match(/신청자\s*(\d+[\/:]\s*\d+)/)?.[1] || '');
  competitionRatio = competitionRatio.replace('/', ':');

  // 6. 리뷰 등록기간 (체험기간)
  const reviewRegMatch = text.match(/리뷰 등록기간\s*([0-9]{2}\.[0-9]{2})\s*[~\-]\s*([0-9]{2}\.[0-9]{2})/);
  const experiencePeriod = reviewRegMatch
    ? `${clean(reviewRegMatch[1])} ~ ${clean(reviewRegMatch[2])}`
    : '';

  // 7. 발표일: '리뷰어 발표 06.16'
  const announceMatch = text.match(/리뷰어 발표\s*([0-9]{2}\.[0-9]{2}|[0-9]+월\s*[0-9]+일)/);
  const announcementDate = clean(announceMatch?.[1] || '');

  return {
    company,
    region,
    regionFull,
    providedItems,
    competitionRatio,
    experiencePeriod,
    announcementDate,
    text
  };
}
