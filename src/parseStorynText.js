export function parseStorynText(text) {
    const clean = (s) => s?.replace(/\s+/g, ' ').trim();
  
    // 👉 HTML 태그 제거 (텍스트 분석용)
    const plainText = text.replace(/<[^>]+>/g, ' ');
  
    // og:title → 업체명 + 지역
    const titleMatch = text.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']\s*\/?>/i);
    let company = '', region = '';
    if (titleMatch) {
      const title = clean(titleMatch[1]);
      const parts = title.match(/^\[([^\]]+)\]\s*(.+)$/);
      if (parts) {
        region = clean(parts[1]);
        company = clean(parts[2]);
      } else {
        company = title;
      }
    }
  
    // og:description → 제공내역
    const descMatch = text.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']\s*\/?>/i);
    const providedItems = descMatch ? clean(descMatch[1]) : '';
  
    // 체험기간 (HTML 태그 제거된 plainText에서 검색)
    const expMatch = plainText.match(/체험기간\s*[:\-]?\s*([\d\/.]+)\s*~\s*([\d\/.]+)/);
    const experiencePeriod = expMatch ? `${clean(expMatch[1])} ~ ${clean(expMatch[2])}` : '';
  
    // 리뷰어 발표
    const annMatch = plainText.match(/리뷰어 발표\s*[:\-]?\s*([\d\/.]+)/);
    const announcementDate = annMatch ? clean(annMatch[1]) : '';
  
    // 경쟁률
    const compMatch = plainText.match(/지원\s*(\d+)\s*\/\s*모집\s*(\d+)/);
    const competitionRatio = compMatch ? `${compMatch[1]}:${compMatch[2]}` : '';
  
    // 전체 주소
    const addressMatch = plainText.match(/방문\s*주소\s*[:\-]?\s*([^\n]+?)(\\s|$)/);
    const regionFull = addressMatch ? clean(addressMatch[1]) : '';
  
    return {
      company,
      region,
      providedItems,
      experiencePeriod,
      announcementDate,
      competitionRatio,
      regionFull,
      text, // 원본 HTML
    };
  }
  