// ✅ parseStorynText.js - 스토리앤미디어 복붙 대응 최종본

export function parseStorynText(text) {
    const clean = (s) => s?.replace(/\s+/g, ' ').trim();
  
    // 업체명 + 지역 추출
    const titleMatch = text.match(/\[([^)\]]+)\]\s*(.+)/);
    const region = clean(titleMatch?.[1] || '');
    const company = clean(titleMatch?.[2] || '');
  
    // 제공내역
    const providedMatch = text.match(/제공내역\s*\n([\s\S]+?)\n\n/);
    const providedItems = clean(providedMatch?.[1] || '');
  
    // 전체 주소
    const addrMatch = text.match(/([가-힣\s\d\-(),]+)\s*키워드/);
    const regionFull = clean(addrMatch?.[1] || '');
  
    // 체험기간
    const expMatch = text.match(/콘텐츠 등록기간\s*(\d{2}[./]\d{2})\([^)]+\)\s*[~\-]\s*(\d{2}[./]\d{2})\([^)]+\)/);
    const experiencePeriod = expMatch ? `${expMatch[1]} ~ ${expMatch[2]}` : '';
  
    // 리뷰 마감일
    const deadlineMatch = text.match(/콘텐츠 등록기간\s*\d{2}[./]\d{2}\([^)]+\)\s*[~\-]\s*(\d{2}[./]\d{2})\([^)]+\)/);
    const reviewDeadline = deadlineMatch ? clean(deadlineMatch[1]) : '';
  
    // 발표일
    const annMatch = text.match(/리뷰어 발표\s*(\d{2}[./]\d{2})\([^)]+\)/);
    const announcementDate = annMatch ? clean(annMatch[1]) : '';
  
    // 경쟁률
    const compMatch = text.match(/신청\s*(\d+)\s*\/\s*모집\s*(\d+)/);
    const competitionRatio = compMatch ? `${compMatch[1]}:${compMatch[2]}` : '';
  
    return {
      company,
      region,
      regionFull,
      providedItems,
      experiencePeriod,
      announcementDate,
      reviewDeadline,
      competitionRatio,
      text,
    };
  }