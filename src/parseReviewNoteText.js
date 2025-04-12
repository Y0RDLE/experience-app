// ✅ 리뷰노트 전용 텍스트 기반 파서 (복붙 대응 최종본)

export function parseReviewNoteText(text) {
  const clean = (s) => s?.replace(/\s+/g, ' ').trim();

  const companyMatch = text.match(/\[.*?\]\s*(.*?)\n/);
  const providedMatch = text.match(/제공서비스\/물품\s*\n(.+?)\n/);
  const addressMatch = text.match(/방문 주소\s*\n([\s\S]+?)(?:\n방문 및 예약 안내|\n$)/);

  // 전체 주소 저장용과 시군구 단위 주소 추출
  const regionFull = clean(addressMatch?.[1] || '');
  const regionShort =
    regionFull.match(/^([가-힣]+)\s+([가-힣]+)/)
      ? `${RegExp.$1} ${RegExp.$2}`.replace(/(시|군)$/i, '').trim()
      : regionFull;

  const dateBlock = text.match(/체험단 신청기간([\s\S]*?)리뷰 마감/)?.[1] || text;
  const applyDates = dateBlock.match(/신청기간\s*([\d]{1,2}[\/.][\d]{1,2})(?:\s*\([^)]*\))?\s*[~\-]\s*([\d]{1,2}[\/.][\d]{1,2})(?:\s*\([^)]*\))?/);
  const annDate = dateBlock.match(/리뷰어 발표\s*([\d]{1,2}[\/.][\d]{1,2})(?:\s*\([^)]*\))?/);
  const expPeriod = dateBlock.match(/체험기간\s*([\d]{1,2}[\/.][\d]{1,2})(?:\s*\([^)]*\))?\s*[~\-]\s*([\d]{1,2}[\/.][\d]{1,2})(?:\s*\([^)]*\))?/);
  const deadline = dateBlock.match(/리뷰 마감\s*([\d]{1,2}[\/.][\d]{1,2})(?:\s*\([^)]*\))?/);

  const keywordSection = text.match(/키워드 정보([\s\S]*?)체험단 미션/);
  const keywordMatch = keywordSection ? keywordSection[1].match(/[가-힣a-zA-Z0-9+#]{2,}/g) : null;

  const missionMatch = text.match(/체험단 미션([\s\S]*?)공정위 표기/);
  const missionText = missionMatch ? missionMatch[1].replace(/\n+/g, ' ').trim() : '';

  const compMatch = text.match(/지원\s*(\d+)\s*\/\s*모집\s*(\d+)/);
  const competitionRatio = compMatch ? `${compMatch[1]}:${compMatch[2]}` : '';

  return {
    company: clean(companyMatch?.[1]),
    region: regionShort,
    regionFull: regionFull,
    providedItems: clean(providedMatch?.[1]),
    applyStart: applyDates ? applyDates[1] : '',
    applyEnd: applyDates ? applyDates[2] : '',
    announcementDate: annDate ? clean(annDate[1]) : '',
    experiencePeriod: expPeriod ? `${expPeriod[1]} ~ ${expPeriod[2]}` : '',
    reviewDeadline: deadline ? clean(deadline[1]) : '',
    keywords: keywordMatch ? keywordMatch.join(', ') : '',
    mission: missionText,
    competitionRatio,
    text: text // 원본 보관용
  };
}