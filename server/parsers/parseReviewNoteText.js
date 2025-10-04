// server/parsers/parseReviewNoteText.js
// 리뷰노트: 텍스트/HTML 복붙 모두 대응 + 일정/경쟁률 강화 + 회사명 노이즈(네이버 검색/주최자 대행사) 차단
import { load } from 'cheerio';

/* -------------------- 유틸 -------------------- */
const norm = (s) => String(s || '')
  .replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const pad2 = (n) => String(n).padStart(2, '0');

// YYYY-MM-DD 안전 변환기 (다양한 포맷 → ISO)
// - 25년 10월 23일
// - 2025년 10월 23일
// - 25.10.23 / 2025.10.23
// - 10/23 (연도 없음 → 올해)
// - 10월 23일 (연도 없음 → 올해)
const toISO = (s) => {
  if (!s) return '';
  const src = String(s)
    .replace(/\((?:월|화|수|목|금|토|일)\)/g, '')      // 요일 제거
    .replace(/[년\.\-\/]/g, (m) => m === '년' ? '년' : m) // 형태 유지
    .replace(/\s+/g, ' ')
    .trim();

  // 1) YYYY년 M월 D일 또는 YY년 M월 D일
  {
    const m = src.match(/(\d{2,4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (m) {
      let y = m[1];
      if (y.length === 2) y = String(2000 + parseInt(y, 10)); // 00~99 → 2000~2099
      const mo = pad2(m[2]);
      const da = pad2(m[3]);
      return `${y}-${mo}-${da}`;
    }
  }

  // 2) YYYY.M.D / YYYY-M-D / YYYY/M/D  또는  YY.M.D 등
  {
    const m = src.match(/(\d{2,4})[.\-\/]\s*(\d{1,2})[.\-\/]\s*(\d{1,2})/);
    if (m) {
      let y = m[1];
      if (y.length === 2) y = String(2000 + parseInt(y, 10));
      return `${y}-${pad2(m[2])}-${pad2(m[3])}`;
    }
  }

  // 3) M.D (연도 없음 → 올해)
  {
    const m = src.match(/(^|\s)(\d{1,2})[./\-](\d{1,2})(\s|$)/);
    if (m) {
      const y = new Date().getFullYear();
      return `${y}-${pad2(m[2])}-${pad2(m[3])}`;
    }
  }

  // 4) M월 D일 (연도 없음 → 올해)
  {
    const m = src.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (m) {
      const y = new Date().getFullYear();
      return `${y}-${pad2(m[1])}-${pad2(m[2])}`;
    }
  }

  return '';
};

// "서울/중랑구" "서울 중랑구" → "서울 중랑"
const formatRegion = (str) => {
  if (!str) return '';
  let s = String(str).replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
  const parts = s.split(/\s+/);
  const prov = (parts[0] || '').replace(/(특별시|광역시|도|특별자치도)$/,'');
  const dist = (parts[1] || '').replace(/(시|군|구)$/,'').replace(/]$/,'');
  return [prov, dist].filter(Boolean).join(' ');
};

// "지원 68 / 모집 10" | 줄바꿈 포함 → "68:10"
const formatCompetition = (txt) => {
  if (!txt) return '';
  const t = String(txt);
  let m = t.match(/지원[^\d]*([\d,]+)\s*[/:\-]?\s*모집[^\d]*([\d,]+)/i);
  if (!m) m = t.match(/지원[^\d]*([\d,]+)[\s\S]*?모집[^\d]*([\d,]+)/i);
  if (!m) m = t.match(/(\d{1,3}(?:,\d{3})*)\s*[/]\s*(\d{1,3}(?:,\d{3})*)/);
  if (!m) return '';
  return `${m[1].replace(/,/g,'')}:${m[2].replace(/,/g,'')}`;
};

/* -------- URL만 깔끔히 뽑기: 괄호/따옴표/마침표 꼬리 제거 -------- */
const pickNaverPlace = (txt = '') => {
  const src = String(txt);
  const RXES = [
    /(https?:\/\/naver\.me\/[^\s<>"'()]+)/i,
    /(https?:\/\/(?:m\.)?place\.naver\.com\/[^\s<>"'()]+)/i,
    /(https?:\/\/map\.naver\.com\/[^\s<>"'()]+)/i,
  ];
  let hit = '';
  for (const rx of RXES) {
    const m = src.match(rx);
    if (m && m[1]) { hit = m[1]; break; }
  }
  if (!hit) return '';
  hit = hit.replace(/[.,;:!?…]+$/g, '');
  while (hit.endsWith(')') && (hit.match(/\(/g)?.length || 0) < (hit.match(/\)/g)?.length || 0)) {
    hit = hit.slice(0, -1);
  }
  return hit;
};

/* -------------------- 공통: 텍스트 라인 도우미 -------------------- */
const splitLines = (text) => String(text || '')
  .split(/\r?\n/)
  .map((s) => norm(s))
  .filter(Boolean);

const nextMeaningful = (lines, fromIdx) => {
  const bad = /(NAVER\s*©|카카오|이미지|Image|지도|길찾기|복사|클립|배너)/i;
  for (let i = fromIdx + 1; i < Math.min(lines.length, fromIdx + 6); i++) {
    const L = lines[i];
    if (!L) continue;
    if (bad.test(L)) continue;
    return L;
  }
  return '';
};

/* -------- 업체명 클린업: "네이버 검색"/"사장님" 제거 + 대행사 차단 -------- */
const BAD_COMPANY_TOKENS = /(네이버\s*검색|네이버검색|검색\s*버튼|Naver\s*Search)/i;
const HONORIFIC_SUFFIX = /\s*(?:사장|대표|원장|점장)\s*님?(?:\s*[가-힣]{2,4})?\s*$/i;
const AGENCY_WORDS = /(대행사|마케팅|브랜딩|애드|미디어|PR|에이전시|본부|지부|센터|광고)/i;

const cleanCompany = (s) => {
  if (!s) return '';
  let t = String(s)
    .replace(/^\s*(?:\[[^\]]+\]\s*)+/g, '')     // [지역] 프리픽스 제거
    .replace(/^주최자\s*[:\-]?\s*/i, '')        // "주최자:" 프리픽스 제거
    .trim();

  // 문장 끝/괄호 안의 "네이버 검색" 제거 (붙어서 들어오는 케이스 포함)
  t = t.replace(/\s*\((?:.*?)네이버\s*검색(?:.*?)\)\s*$/i, '').trim();
  t = t.replace(/네이버\s*검색\s*$/i, '').trim();
  t = t.replace(/네이버검색\s*$/i, '').trim();
  t = t.replace(/\s*-\s*네이버\s*검색\s*$/i, '').trim();

  // 직함 꼬리 컷
  t = t.replace(HONORIFIC_SUFFIX, '').trim();

  // 노이즈 전체 차단
  if (BAD_COMPANY_TOKENS.test(t)) return '';
  if (AGENCY_WORDS.test(t)) return '';
  if (/^(블로그|인스타|유튜브)$/i.test(t)) return '';

  return t;
};

/* -------------------- 텍스트(노란창) 파서 -------------------- */
function parseTextReviewNote(text) {
  const body = String(text || '');
  const lines = splitLines(body);

  // 1) 회사명: 상단 [지역] 라인 우선. 실패 시에도 "주최자" 블록은 절대 사용하지 않음(대행사 오인 방지)
  let company = '';
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    if (/^\[.*?\]/.test(lines[i])) {
      const after = cleanCompany(lines[i]);
      if (after) { company = after; break; }
      const next = cleanCompany(nextMeaningful(lines, i));
      if (next) { company = next; break; }
    }
  }
  // 보강: 상단부에서 라벨성 문구가 아니고 대행사 키워드 없는 짧은 텍스트를 후보로
  if (!company) {
    for (let i = 0; i < Math.min(lines.length, 12); i++) {
      const s = cleanCompany(lines[i]);
      if (!s) continue;
      if (/(제공|방문|키워드|체험단|신청|발표|일정|현황|주소)/.test(s)) continue;
      if (s.length > 2 && s.length <= 40) { company = s; break; }
    }
  }

  // 2) 지역: "방문 주소" 라벨 라인/다음 라인
  let regionFull = '';
  {
    const i = lines.findIndex((l) => /방문\s*주소/i.test(l));
    if (i !== -1) {
      const after = lines[i].replace(/.*방문\s*주소\s*/i, '').trim();
      regionFull = after || nextMeaningful(lines, i) || '';
    }
  }
  const region = formatRegion(regionFull);

  // 3) 제공내역: "제공서비스/물품" 이후 섹션 경계 전까지 수집
  let providedItems = '';
  {
    const idx = lines.findIndex((l) => /제공서비스\/물품|제공\s*내역|제공\s*품목/i.test(l));
    if (idx !== -1) {
      const breakers = /(방문\s*정보|키워드\s*정보|체험단\s*미션|체험단\s*일정|실시간\s*지원\s*현황|문의\s*사항|공정위|체험단\s*신청기간|리뷰어\s*발표)/i;
      const bag = [];
      for (let k = idx + 1; k < Math.min(lines.length, idx + 10); k++) {
        const L = lines[k];
        if (!L) continue;
        if (breakers.test(L)) break;
        if (/(만원|원|세트|메뉴|코스|리필|특선|2인|3인|코스요리|바우처|이용권|식사권|숙박|이용료|체험권)/.test(L)) bag.push(L);
        if (bag.length === 0) bag.push(L);
      }
      providedItems = bag.join(', ');
    }
  }

  // 4) 경쟁률: "실시간 지원 현황" 블록(다음줄까지) → 실패 시 전체에서 재탐색
  let competitionRatio = '';
  {
    const i = lines.findIndex((l) => /실시간\s*지원\s*현황/i.test(l));
    if (i !== -1) {
      competitionRatio = formatCompetition(lines[i]);
      if (!competitionRatio) {
        const scope = [lines[i+1] || '', lines[i+2] || ''].join('\n');
        competitionRatio = formatCompetition(scope);
      }
    }
    if (!competitionRatio) competitionRatio = formatCompetition(body);
  }

  // 5) 일정: "리뷰어 발표", "체험기간/체험&리뷰" (같은 줄 or 다음 줄)
  const takeAfter = (re) => {
    const i = lines.findIndex((l) => re.test(l));
    if (i === -1) return '';
    const cur = lines[i].replace(re, '').trim();
    return cur || nextMeaningful(lines, i) || '';
  };

  const annBlock = takeAfter(/리뷰어\s*발표/i);
  const expBlock = takeAfter(/(체험기간|체험&리뷰)/i);

  const pickFirstDate = (s) => {
    // 우선순위: 년월일 → 구분자(.,-/) 전체 → 월/일 → 한글 월/일
    const rx1 = /(\d{2,4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일)/;
    const rx2 = /(\d{2,4}[.\-\/]\s*\d{1,2}[.\-\/]\s*\d{1,2})/;
    const rx3 = /(\d{1,2}[./\-]\d{1,2})/;
    const rx4 = /(\d{1,2}\s*월\s*\d{1,2}\s*일)/;
    const m = String(s).match(rx1) || String(s).match(rx2) || String(s).match(rx3) || String(s).match(rx4);
    return m ? m[1] : '';
  };

  const announcementDate = toISO(pickFirstDate(annBlock));

  let experienceStart = '', experienceEnd = '';
  if (expBlock) {
    const parts = expBlock.split(/\s*(?:~|–|—|-|to)\s*/i);
    if (parts.length >= 2) {
      experienceStart = toISO(pickFirstDate(parts[0]));
      experienceEnd   = toISO(pickFirstDate(parts[1]));
    } else {
      const all = (expBlock.match(/(\d{2,4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일|\d{2,4}[.\-\/]\d{1,2}[.\-\/]\d{1,2}|\d{1,2}[./\-]\d{1,2}|\d{1,2}\s*월\s*\d{1,2}\s*일)/g) || []);
      if (all.length >= 2) { experienceStart = toISO(all[0]); experienceEnd = toISO(all[1]); }
    }
  }

  const naverPlaceUrl = pickNaverPlace(body);

  return {
    siteName: '리뷰노트',
    company,
    regionFull,
    region,
    providedItems,
    announcementDate,
    experienceStart,
    experienceEnd,
    competitionRatio,
    naverPlaceUrl,
  };
}

/* -------------------- HTML 파서 -------------------- */
function parseHtmlReviewNote(html) {
  const $ = load(String(html || ''));

  const dd = (kw) => {
    const dt = $('dt').filter((i, el) => $(el).text().includes(kw)).first();
    if (!dt.length) return '';
    return norm(dt.next('dd').text());
  };
  const td = (kw) => {
    const th = $('th').filter((i, el) => $(el).text().includes(kw)).first();
    if (!th.length) return '';
    return norm(th.next('td').text());
  };

  // 회사명: 타이틀에서만 뽑고, "주최자" 블록은 절대 사용하지 않음
  let company =
    cleanCompany(norm($('h1.campaign-title').first().text())) ||
    cleanCompany(norm($('h2,h3').first().text()));

  // 지역
  let regionFull = dd('방문 주소') || td('방문 주소');
  if (!regionFull) {
    const bodyText = $('body').text();
    const lines = splitLines(bodyText);
    const i = lines.findIndex(l => /방문\s*주소/i.test(l));
    if (i !== -1) {
      const after = lines[i].replace(/.*방문\s*주소\s*/i, '').trim();
      regionFull = after || nextMeaningful(lines, i) || '';
    }
  }
  const region = formatRegion(regionFull);

  // 제공내역
  let providedItems =
    dd('제공서비스/물품') || dd('제공내역') || td('제공서비스/물품') || td('제공내역');
  if (!providedItems) {
    const bodyText = $('body').text();
    const lines = splitLines(bodyText);
    const idx = lines.findIndex(l => /제공서비스\/물품|제공\s*내역|제공\s*품목/i.test(l));
    if (idx !== -1) {
      const breakers = /(방문\s*정보|키워드\s*정보|체험단\s*미션|체험단\s*일정|실시간\s*지원\s*현황|문의\s*사항|공정위|체험단\s*신청기간|리뷰어\s*발표)/i;
      const bag = [];
      for (let k = idx + 1; k < Math.min(lines.length, idx + 10); k++) {
        const L = lines[k];
        if (!L) continue;
        if (breakers.test(L)) break;
        if (/(만원|원|세트|메뉴|코스|리필|특선|2인|3인|코스요리|바우처|이용권|식사권|숙박|이용료|체험권)/.test(L)) bag.push(L);
        if (bag.length === 0) bag.push(L);
      }
      providedItems = bag.join(', ');
    }
  }

  // 일정
  const annRaw = td('리뷰어 발표') || dd('리뷰어 발표');
  const expRaw = td('체험기간') || td('체험&리뷰') || dd('체험기간') || dd('체험&리뷰');

  let announcementDate = '';
  if (annRaw) {
    const m =
      annRaw.match(/(\d{2,4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일)/) ||
      annRaw.match(/(\d{2,4}[.\-\/]\s*\d{1,2}[.\-\/]\s*\d{1,2})/) ||
      annRaw.match(/(\d{1,2}[./\-]\d{1,2})/) ||
      annRaw.match(/(\d{1,2}\s*월\s*\d{1,2}\s*일)/);
    if (m) announcementDate = toISO(m[1]);
  }

  let experienceStart = '', experienceEnd = '';
  if (expRaw) {
    const parts = expRaw.split(/\s*(?:~|–|—|-|to)\s*/i);
    if (parts.length >= 2) {
      const s =
        parts[0].match(/(\d{2,4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일|\d{2,4}[.\-\/]\s*\d{1,2}[.\-\/]\s*\d{1,2}|\d{1,2}[./\-]\d{1,2}|\d{1,2}\s*월\s*\d{1,2}\s*일)/);
      const e =
        parts[1].match(/(\d{2,4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일|\d{2,4}[.\-\/]\s*\d{1,2}[.\-\/]\s*\d{1,2}|\d{1,2}[./\-]\d{1,2}|\d{1,2}\s*월\s*\d{1,2}\s*일)/);
      if (s) experienceStart = toISO(s[1]);
      if (e) experienceEnd   = toISO(e[1]);
    } else {
      const all = expRaw.match(/(\d{2,4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일|\d{2,4}[.\-\/]\s*\d{1,2}[.\-\/]\s*\d{1,2}|\d{1,2}[./\-]\d{1,2}|\d{1,2}\s*월\s*\d{1,2}\s*일)/g) || [];
      if (all.length >= 2) { experienceStart = toISO(all[0]); experienceEnd = toISO(all[1]); }
    }
  }

  // 경쟁률
  const bodyText = $('body').text();
  let competitionRatio =
    formatCompetition(dd('실시간 지원 현황') || td('실시간 지원 현황') || '');
  if (!competitionRatio) competitionRatio = formatCompetition(bodyText);

  const naverPlaceUrl = pickNaverPlace(bodyText);

  return {
    siteName: '리뷰노트',
    company,
    regionFull,
    region,
    providedItems,
    announcementDate,
    experienceStart,
    experienceEnd,
    competitionRatio,
    naverPlaceUrl,
  };
}

/* -------------------- 엔트리 -------------------- */
export function parseReviewNoteText(raw) {
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(String(raw || ''));
  return isHtml ? parseHtmlReviewNote(raw) : parseTextReviewNote(raw);
}
export default parseReviewNoteText;
