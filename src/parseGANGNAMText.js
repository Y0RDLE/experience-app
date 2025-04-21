// parseGangnamText.js - 강남맛집 복붙 파서 최신형
export function parseGangnamText(text) {
  const clean = (s) => s?.replace(/\s+/g, ' ').trim() || '';

  // 회사 및 지역 정보(미사용 시 기본값으로 쓰기 위해 추출)
  const companyMatch = text.match(/\[([^\]]+)\]\s*(.+?)(\n|$)/);
  const defaultRegion = clean(companyMatch?.[1]);

  // 전체 주소: "강원특별자치도 홍천군 북방면 …"
  const fullAddressMatch = text.match(/(강원특별자치도|강원특별자치|경기|서울|인천|부산|대전|대구|광주|울산)[^\n]+/);
  const fullAddress = clean(fullAddressMatch?.[0]);

  // 시·도 및 시·군·구 두 단계만 뽑아냄 (특별시/광역시/도, 시/군/구 제거)
  let regionShort = defaultRegion;
  if (fullAddress) {
    const parts = fullAddress.split(/\s+/);
    if (parts.length >= 2) {
      const prov = parts[0].replace(/(특별자치도|특별자치|광역시|특별시|도)$/, '');
      const dist = parts[1].replace(/(시|군|구)$/, '');
      regionShort = `${prov} ${dist}`;
    }
  }

  // 이하 기존 파싱 로직 그대로
  const providedItemsMatch1 = text.match(/제공내역\s*\n([^\n]+?)(\n|$)/);
  const providedItemsMatch2 = text.match(/((?:\d+일\s+)?[^\n(]+?체험권\s*\([^)]*\))/);
  const providedItems = clean(providedItemsMatch1?.[1] || providedItemsMatch2?.[1]);

  let competitionRatio = clean((text.match(/신청자(?:\s*현황)?\s*(\d+\s*[\/:]\s*\d+)/)?.[1]) || '');
  competitionRatio = competitionRatio.replace('/', ':');

  const announcementDate = clean(text.match(/리뷰어 발표\s*([0-9.]+|[0-9]+월\s*[0-9]+일|[0-9]{2}\.[0-9]{2})/)?.[1] || '');

  const expMatch = text.match(/리뷰 등록기간\s*([0-9.]+)\s*[~\-]\s*([0-9.]+)/);
  const experiencePeriod = expMatch ? `${clean(expMatch[1])} ~ ${clean(expMatch[2])}` : '';

  const naverPlaceUrl = clean(text.match(/https?:\/\/map\.naver\.com\/v5\/search\/[^"]+/)?.[0] || '');

  return {
    company: clean(companyMatch?.[2] || ''),
    region: regionShort,
    providedItems,
    experiencePeriod,
    announcementDate,
    competitionRatio,
    naverPlaceUrl,
    regionFull: fullAddress,
    text,  // 원문 보존
  };
}
