// server/parsers/parseReviewNoteText.js
// 리뷰노트: HTML/텍스트 복붙 모두 대응 + 제공내역/경쟁률/지역 강화 + 노이즈 제거
import { load } from 'cheerio';

/* -------------------- 유틸 -------------------- */
const norm = (s) => String(s || '')
  .replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const toISO = (s) => {
  if (!s) return '';
  const m = String(s).match(/(\d{2,4})[.\-\/]\s?(\d{1,2})[.\-\/]?\s?(\d{1,2})/);
  if (m) {
    let y = m[1]; if (y.length === 2) y = String(2000 + parseInt(y, 10));
    return `${y}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }
  const m2 = String(s).match(/(\d{1,2})[./](\d{1,2})/);
  if (m2) {
    const y = new Date().getFullYear();
    return `${y}-${m2[1].padStart(2, '0')}-${m2[2].padStart(2, '0')}`;
  }
  return '';
};

// "서울/중랑구" "서울 중랑구" → "서울 중랑"
const formatRegion = (str) => {
  if (!str) return '';
  let s = String(str).replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
  const parts = s.split(/\s+/);
  const prov = (parts[0] || '').replace(/(특별시|광역시|도)$/,'');
  const dist = (parts[1] || '').replace(/(시|군|구)$/,'');
  return [prov, dist].filter(Boolean).join(' ');
};

// "지원 68 / 모집 10" | "지원 68   모집 10" | 줄바꿈 포함까지 커버 → "68:10"
const formatCompetition = (txt) => {
  if (!txt) return '';
  const t = String(txt);
  let m = t.match(/지원\s*(\d+)\s*[/:\-]?\s*모집\s*(\d+)/i);
  if (!m) m = t.match(/지원\s*(\d+)[\s\S]*?모집\s*(\d+)/i); // 줄바꿈 사이도 허용
  if (!m) m = t.match(/(\d+)\s*[/]\s*(\d+)/);
  return m ? `${m[1]}:${m[2]}` : '';
};

/* -------- URL만 깔끔히 뽑기: 괄호/따옴표/마침표 꼬리 제거 (개선版) -------- */
const pickNaverPlace = (txt = '') => {
  const src = String(txt);

  // 괄호·따옴표·꺾쇠 이전까지만 허용 → ")에서", "'에서" 같은 꼬리 자동 차단
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

  // 끝에 붙은 구두점 제거
  hit = hit.replace(/[.,;:!?…]+$/g, '');

  // 여분 닫힘괄호가 남았으면 안전하게 제거
  while (hit.endsWith(')') && (hit.match(/\(/g)?.length || 0) < (hit.match(/\)/g)?.length || 0)) {
    hit = hit.slice(0, -1);
  }

  return hit;
};

/* -------------------- 공통: 텍스트 라인 도우미 -------------------- */
const splitLines = (text) => String(text || '')
  .split(/\r?\n/)
  .map(s => norm(s))
  .filter(Boolean);

// 라벨 다음 의미있는 한 줄 반환 (빈줄/광고/내비 문구 스킵)
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

/* -------- 업체명 노이즈 제거: "네이버 검색" 등 무시 -------- */
const BAD_COMPANY_TOKENS = /(네이버\s*검색|검색\s*버튼|Naver\s*Search)/i;
const cleanCompany = (s) => {
  if (!s) return '';
  // [서울/중랑구] 같은 프리픽스 제거
  let t = String(s).replace(/^\s*(?:\[[^\]]+\]\s*)+/g, '').trim();
  // 괄호 주석 중 "네이버 검색" 포함시 제거
  t = t.replace(/\s*\((?:.*?)네이버\s*검색(?:.*?)\)\s*$/i, '').trim();
  // 끝에 붙은 "- 네이버 검색" 같은 꼬리 제거
  t = t.replace(/\s*-\s*네이버\s*검색\s*$/i, '').trim();
  if (BAD_COMPANY_TOKENS.test(t)) return '';
  if (/^(블로그|인스타|유튜브)$/i.test(t)) return '';
  return t;
};

/* -------------------- 텍스트(노란창) 파서 -------------------- */
function parseTextReviewNote(text) {
  const body = String(text || '');
  const lines = splitLines(body);

  // 업체명: [서울/중랑구] 다음 텍스트 또는 제공내역 라인 근처 (네이버 검색 노이즈 무시)
  let company = '';
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    if (/^\[.*?\]/.test(lines[i])) {
      const after = cleanCompany(lines[i]);
      if (after) { company = after; break; }
      const next = cleanCompany(nextMeaningful(lines, i));
      if (next) { company = next; break; }
    }
  }
  if (!company) {
    const idx = lines.findIndex(l => /제공서비스\/물품|제공\s*내역|제공\s*품목/i.test(l));
    if (idx > 0) {
      for (let j = idx - 1; j >= Math.max(0, idx - 5); j--) {
        const s = cleanCompany(lines[j]);
        if (s && !/제공|방문|키워드|체험단/i.test(s)) { company = s; break; }
      }
    }
  }

  // 지역: "방문 주소" 같은 줄에서 뒷부분 또는 다음 의미있는 줄
  let regionFull = '';
  {
    const i = lines.findIndex(l => /방문\s*주소/i.test(l));
    if (i !== -1) {
      const after = lines[i].replace(/.*방문\s*주소\s*/i, '').trim();
      regionFull = after || nextMeaningful(lines, i) || '';
    }
  }
  const region = formatRegion(regionFull);

  // 제공내역: "제공서비스/물품" 이후 섹션 경계 전까지 수집
  let providedItems = '';
  {
    const idx = lines.findIndex(l => /제공서비스\/물품|제공\s*내역|제공\s*품목/i.test(l));
    if (idx !== -1) {
      const breakers = /(방문\s*정보|키워드\s*정보|체험단\s*미션|체험단\s*일정|실시간\s*지원\s*현황|문의\s*사항|공정위|체험단\s*신청기간|리뷰어\s*발표)/i;
      const bag = [];
      for (let k = idx + 1; k < Math.min(lines.length, idx + 10); k++) {
        const L = lines[k];
        if (!L) continue;
        if (breakers.test(L)) break;
        // 가격/보상/세트성 키워드 완화
        if (/(만원|원|세트|메뉴|코스|리필|특선|2인|3인|코스요리|바우처|이용권|식사권)/.test(L)) bag.push(L);
        if (bag.length === 0) bag.push(L); // 한 줄만 있는 케이스 허용
      }
      providedItems = bag.join(', ');
    }
  }

  // 경쟁률
  let competitionRatio = '';
  {
    const i = lines.findIndex(l => /실시간\s*지원\s*현황/i.test(l));
    if (i !== -1) {
      competitionRatio = formatCompetition(lines[i]);
      if (!competitionRatio) {
        const scope = [lines[i+1] || '', lines[i+2] || ''].join('\n');
        competitionRatio = formatCompetition(scope);
      }
    }
    if (!competitionRatio) competitionRatio = formatCompetition(body);
  }

  // 일정
  const takeAfter = (re) => {
    const i = lines.findIndex(l => re.test(l));
    if (i === -1) return '';
    const cur = lines[i].replace(re, '').trim();
    return cur || nextMeaningful(lines, i) || '';
  };
  const annBlock = takeAfter(/리뷰어\s*발표/i);
  const expBlock = takeAfter(/(체험기간|체험&리뷰)/i);

  const pickFirstDate = (s) => {
    const m = String(s).match(/(\d{2,4}[.\-\/]\d{1,2}[.\-\/]\d{1,2}|\d{1,2}[./]\d{1,2})/);
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
      const all = expBlock.match(/(\d{2,4}[.\-\/]\d{1,2}[.\-\/]\d{1,2}|\d{1,2}[./]\d{1,2})/g) || [];
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

  // 업체명 (네이버 검색 노이즈 제거 및 [지역] 프리픽스 제거)
  let company =
    cleanCompany(norm($('h1.campaign-title').first().text())) ||
    cleanCompany(norm($('h2,h3').first().text()));

  // 지역: dd/td 없으면 "방문 주소" 라벨 + 다음 텍스트도 커버
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

  // 제공내역: dd/td → 실패 시 텍스트 파서 방식 보강
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
        if (/(만원|원|세트|메뉴|코스|리필|특선|2인|3인|코스요리|바우처|이용권|식사권)/.test(L)) bag.push(L);
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
    const m = annRaw.match(/(\d{2,4}[.\-\/]\d{1,2}[.\-\/]\d{1,2}|\d{1,2}[./]\d{1,2})/);
    if (m) announcementDate = toISO(m[1]);
  }

  let experienceStart = '', experienceEnd = '';
  if (expRaw) {
    const parts = expRaw.split(/\s*(?:~|–|—|-|to)\s*/i);
    if (parts.length >= 2) {
      const s = parts[0].match(/(\d{2,4}[.\-\/]\d{1,2}[.\-\/]\d{1,2}|\d{1,2}[./]\d{1,2})/);
      const e = parts[1].match(/(\d{2,4}[.\-\/]\d{1,2}[.\-\/]\d{1,2}|\d{1,2}[./]\d{1,2})/);
      if (s) experienceStart = toISO(s[1]);
      if (e) experienceEnd   = toISO(e[1]);
    } else {
      const all = expRaw.match(/(\d{2,4}[.\-\/]\d{1,2}[.\-\/]\d{1,2}|\d{1,2}[./]\d{1,2})/g) || [];
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
