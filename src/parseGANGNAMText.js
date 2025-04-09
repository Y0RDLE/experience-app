export function extractFromText(text) {
  console.log('📄 parseGANGNAMText 텍스트 일부:', text.slice(0, 300));

  const getValue = (label, customRegex) => {
    const regex = customRegex || new RegExp(`${label}\\s*[:\\-]?\\s*([^\\n]+)`);
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  return {
    company: getValue('[경기 성남] 가야한정식', /\[.+?\]\s*(.+?)(\n|$)/), // 제목 줄에서 업체명 추출
    region: getValue('[경기 성남]', /\[(.+?)\]/),                        // 지역만 추출
    providedItems: getValue('체험권', /(점심저녁특선 체험권.*?원 상당)/),
    experiencePeriod: getValue('리뷰 등록기간', /리뷰 등록기간\s*([0-9.]+\s*~\s*[0-9.]+)/),
    announcementDate: getValue('리뷰어 발표', /리뷰어 발표\s*([0-9.]+)/),
    competitionRatio: getValue('신청자', /신청자\s*(\d+\s*\/\s*\d+)/),
  };
}
