// 리뷰노트 전용 텍스트 기반 파서 (텍스트 원문 복붙 대응)

export function parseReviewNoteText(text) {
    const clean = (s) => s?.replace(/\s+/g, ' ').trim();
  
    const companyMatch = text.match(/\[.*?\]\s*(.*?)\n/);
    const providedMatch = text.match(/제공서비스\/물품\s*\n(.+?)\n/);
    const addressMatch = text.match(/방문 주소\s*\n(.+?)\n/);
  
    const annDateMatch = text.match(/리뷰어 발표\n(\d{1,2}\/\d{1,2})/);
    const periodMatch = text.match(/체험기간\n(\d{1,2}\/\d{1,2}).*?~.*?(\d{1,2}\/\d{1,2})/);
  
    const keywordSection = text.match(/키워드 정보[\s\S]*?체험단 미션/);
    const keywordMatch = keywordSection?.[0].match(/[가-힣a-zA-Z0-9+#]{2,}/g);
  
    const missionMatch = text.match(/체험단 미션[\s\S]*?공정위 표기/);
    const missionText = missionMatch?.[0]
      .replace(/체험단 미션|키워드|공정위.*|Image.*/g, '')
      .replace(/\n+/g, ' ')
      .trim();
  
    const compMatch = text.match(/지원\s*(\d+)\s*\/\s*모집\s*(\d+)/);
    const competitionRatio = compMatch ? `${compMatch[1]}:${compMatch[2]}` : '';
  
    return {
      company: clean(companyMatch?.[1]),
      region: clean(addressMatch?.[1]),
      providedItems: clean(providedMatch?.[1]),
      experiencePeriod: periodMatch ? `${periodMatch[1]} ~ ${periodMatch[2]}` : '',
      announcementDate: clean(annDateMatch?.[1]),
      keywords: keywordMatch?.join(', '),
      mission: missionText,
      competitionRatio,
    };
  }
  