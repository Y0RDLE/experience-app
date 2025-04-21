// ✅ 리뷰노트 전용 텍스트 기반 파서 (복붙 대응 최종본, regionShort 수정)
export function parseReviewNoteText(text) {
  const clean = s => s?.replace(/\s+/g, ' ').trim();

  const companyMatch = text.match(/\[.*?\]\s*(.*?)\n/);
  const providedMatch = text.match(/제공서비스\/물품\s*\n(.+?)\n/);
  const addressMatch = text.match(/방문 주소\s*\n([\s\S]+?)(?:\n방문 및 예약 안내|\n$)/);

  // 전체 주소
  const regionFull = clean(addressMatch?.[1] || '');

  // 시·도 + 시·군·구 두 단계만, '시'|'군'|'구' 접미사는 제거
  let regionShort = regionFull;
  if (regionFull) {
    const parts = regionFull.split(/\s+/);
    if (parts.length >= 2) {
      const province = parts[0].replace(/(특별시|광역시|도)$/, '');
      const district = parts[1].replace(/(시|군|구)$/, '');
      regionShort = `${province} ${district}`;
    }
  }

  const dateBlock = text.match(/체험단 신청기간([\s\S]*?)리뷰 마감/)?.[1] || text;
  const applyDates = dateBlock.match(
    /신청기간\s*([\d]{1,2}[\/.][\d]{1,2})\s*[~\-]\s*([\d]{1,2}[\/.][\d]{1,2})/
  );
  const annDate = dateBlock.match(/리뷰어 발표\s*([\d]{1,2}[\/.][\d]{1,2})/);
  const expPeriod = dateBlock.match(
    /체험기간\s*([\d]{1,2}[\/.][\d]{1,2})\s*[~\-]\s*([\d]{1,2}[\/.][\d]{1,2})/
  );
  const deadline = dateBlock.match(/리뷰 마감\s*([\d]{1,2}[\/.][\d]{1,2})/);

  const keywordSection = text.match(/키워드 정보([\s\S]*?)체험단 미션/);
  const keywordMatch = keywordSection
    ? keywordSection[1].match(/[가-힣a-zA-Z0-9+#]{2,}/g)
    : null;

  const missionMatch = text.match(/체험단 미션([\s\S]*?)공정위 표기/);
  const missionText = missionMatch
    ? missionMatch[1].replace(/\n+/g, ' ').trim()
    : '';

  const compMatch = text.match(/지원\s*(\d+)\s*\/\s*모집\s*(\d+)/);
  const competitionRatio = compMatch
    ? `${compMatch[1]}:${compMatch[2]}`
    : '';

  return {
    company: clean(companyMatch?.[1]),
    region: regionShort,
    regionFull: regionFull,
    providedItems: clean(providedMatch?.[1]),
    applyStart: applyDates ? applyDates[1] : '',
    applyEnd: applyDates ? applyDates[2] : '',
    announcementDate: annDate ? clean(annDate[1]) : '',
    experiencePeriod: expPeriod
      ? `${expPeriod[1]} ~ ${expPeriod[2]}`
      : '',
    reviewDeadline: deadline ? clean(deadline[1]) : '',
    keywords: keywordMatch ? keywordMatch.join(', ') : '',
    mission: missionText,
    competitionRatio,
    text, // 원본 보관용
  };
}
