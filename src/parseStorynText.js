// parseStorynText.js
export function parseStorynText(text) {
    const clean = (s) => s?.replace(/\s+/g, ' ').trim();
  
    // og:title 메타 태그에서 제목 정보 추출 (예: "[서울 강남] 준 이자카야 신사본점")
    const titleMatch = text.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']\s*\/?>/i);
    let company = '';
    let region = '';
    if (titleMatch) {
      const title = clean(titleMatch[1]);
      // "[서울 강남] 준 이자카야 신사본점" 형식이면
      const parts = title.match(/^\[([^\]]+)\]\s*(.+)$/);
      if (parts) {
        region = clean(parts[1]);  // 예: "서울 강남"
        company = clean(parts[2]); // 예: "준 이자카야 신사본점"
      } else {
        company = title;
      }
    }
  
    // og:description 메타 태그: 보통 제공 내역(또는 간략 설명)
    const descriptionMatch = text.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']\s*\/?>/i);
    const providedItems = descriptionMatch ? clean(descriptionMatch[1]) : '';
  
    // 체험기간: 예를 들어 "체험기간 4/12 ~ 4/25" 와 같이 표기되어 있다면
    const expPeriodMatch = text.match(/체험기간\s*[:\-]?\s*([\d\/]+)\s*~\s*([\d\/]+)/);
    let experiencePeriod = '';
    if (expPeriodMatch) {
      experiencePeriod = `${clean(expPeriodMatch[1])} ~ ${clean(expPeriodMatch[2])}`;
    }
  
    // 리뷰어 발표: "리뷰어 발표 4/11" 등으로 표기되는 경우
    const annMatch = text.match(/리뷰어 발표\s*[:\-]?\s*([\d\/]+)/);
    const announcementDate = annMatch ? clean(annMatch[1]) : '';
  
    // 지원 / 모집: "지원 114 / 모집 8" 등
    const compMatch = text.match(/지원\s*([\d]+)\s*\/\s*모집\s*([\d]+)/);
    const competitionRatio = compMatch ? `${compMatch[1]}:${compMatch[2]}` : '';
  
    // regionFull: 전체 주소(예: "서울 강남구 도산대로11길 31-6 (신사동) 1층 ...")가 포함되어 있을 경우
    // 만약 "방문 주소" 라는 문자열이 있으면 가져오기
    const addressMatch = text.match(/방문\s*주소\s*[:\-]?\s*([\S ]+?)<\//i);
    const regionFull = addressMatch ? clean(addressMatch[1]) : '';
  
    return {
      company,
      region,
      providedItems,
      experiencePeriod,
      announcementDate,
      competitionRatio,
      regionFull,
      text, // 필요시 원본 HTML 보존
    };
  }
  