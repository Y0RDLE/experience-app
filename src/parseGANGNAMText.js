// parseGangnamText.js
export function parseGangnamText(text) {
  const getValue = (label, fallbackRegex) => {
    const regex = fallbackRegex || new RegExp(`${label}\\s*[:\\-]?\\s*([^\\n]+)`);
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  // 회사 및 지역 정보: 예) "[강원 횡성] 한가 스테이"
  const companyMatch = text.match(/\[([^\]]+)\]\s*(.+?)(\n|$)/);
  const region = companyMatch ? companyMatch[1].trim() : '';
  const company = companyMatch ? companyMatch[2].trim() : '';

  // 제공내역: 이전 패턴은 강남맛집에서 "점심/저녁특선 체험권(…원 상당)"을 찾았으나,
  // 이번 공고는 "1일 독채 펜션 숙박 체험권 (2인 기준)" 형식이므로 새 패턴 사용
  const providedItemsMatch = text.match(/(\d+일\s+[^\n(]+체험권\s*\([^)]*\))/);
  const providedItems = providedItemsMatch ? providedItemsMatch[1].trim() : getValue('제공내역');

  // 경쟁률: "캠페인 정보신청자 139/2" 등에서 신청자 정보를 추출
  const competitionMatch = text.match(/신청자(?:\s*현황)?\s*(\d+\s*\/\s*\d+)/);
  const competitionRatio = competitionMatch ? competitionMatch[1].trim() : '';

  // 발표일: "리뷰어 발표 04.15" 등
  const announceMatch = text.match(/리뷰어 발표\s*([0-9.]+|[0-9]+월\s*[0-9]+일|[0-9]{2}\.[0-9]{2})/);
  const announcementDate = announceMatch ? announceMatch[1].trim() : '';

  // 리뷰 등록기간(경험 기간): "리뷰 등록기간 04.16 ~ 05.06" 형태
  const experiencePeriodMatch = text.match(/리뷰 등록기간\s*([0-9.]+)\s*[~\-]\s*([0-9.]+)/);
  const experiencePeriod = experiencePeriodMatch
    ? `${experiencePeriodMatch[1].trim()} ~ ${experiencePeriodMatch[2].trim()}`
    : '';

  // 네이버 플레이스 URL
  const naverMatch = text.match(/https?:\/\/map\.naver\.com\/v5\/search\/[^\s)"']+/);
  const naverPlaceUrl = naverMatch ? naverMatch[0].trim() : '';

  // 주소: 예) "강원특별자치도 횡성군 둔내면 삽교리 1506-1 1층"
  const addressMatch = text.match(/(강원특별자치도|경기|서울|인천|부산|대전|대구|광주|울산)[^\n]+/);
  const fullAddress = addressMatch ? addressMatch[0].trim() : '';

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
