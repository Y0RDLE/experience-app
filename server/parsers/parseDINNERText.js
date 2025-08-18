// server/parsers/parseDINNERText.js
// 디너의여왕 전용 강화 파서 (대괄호 뒤 업체명 우선, 모집 다음 제공내역 수집, 유의사항 컷)
// named + default export 제공

function trim(s){ return (s||"").toString().replace(/\u00A0/g," ").trim(); }

function normalizeDateStr(dateStr){
  if(!dateStr) return "";
  const re = /(\d{2,4})[.\-\/년]\s?(\d{1,2})[.\-\/월]?\s?(\d{1,2})/;
  const m = (dateStr||"").match(re);
  if(!m) return "";
  let y = m[1], mon = m[2].padStart(2,"0"), day = m[3].padStart(2,"0");
  if(y.length === 2) y = String(2000 + parseInt(y,10));
  return `${y}-${mon}-${day}`;
}

function findAllDates(text){
  if(!text) return [];
  const re = /(\d{2,4}[.\-\/년]\s?\d{1,2}[.\-\/월]?\s?\d{1,2})/g;
  const out = []; let m;
  while((m = re.exec(text)) !== null) out.push(trim(m[1]));
  return out;
}

function extractRangeFromText(text){
  if(!text) return [];
  const parts = (text||"").split(/\s*(?:–|—|-|~|to)\s*/i).map(s=>s.trim()).filter(Boolean);
  if(parts.length >= 2) return [parts[0], parts[1]];
  const dates = findAllDates(text);
  if(dates.length >= 2) return [dates[0], dates[1]];
  return [];
}

function extractNaverPlaceUrlFromText(text=""){
  if(!text) return "";
  const patterns = [
    /https?:\/\/(?:m\.)?place\.naver\.com\/[^\s'"]+/i,
    /https?:\/\/map\.naver\.com\/[^\s'"]+/i,
    /https?:\/\/naver\.me\/[^\s'"]+/i
  ];
  for(const re of patterns){
    const m = text.match(re);
    if(m) return m[0];
  }
  return "";
}

function isHeaderLine(line){
  if(!line) return false;
  return /^(검색|profile|프로필|나의 캠페인|나의 정보|포인트|계정연동|로그아웃|로그인|캠페인 일정|TASTE|푸터|메뉴|스토리|맛집 보기|검색하)/i.test(line);
}

// 업체명 정제 헬퍼: 대괄호 제거, 사이트명 제거, 접미어 제거 등
function extractCompanyFromLine(line){
  if(!line) return "";
  let s = trim(line);

  // 1) 앞에 사이트명이나 불필요한 단어 제거
  s = s.replace(/^(디너의여왕|홈디너의여왕|뷰티의여왕|택배의여왕)\s*/i, "");

  // 2) 연속된 대괄호 토큰 제거 (예: [서울 노원][클립])
  s = s.replace(/^(?:\[[^\]]+\]\s*)+/,"").trim();

  // 3) "캠페인", "캠페인 신청 섹션", "신청 섹션" 같은 접미사 제거
  s = s.replace(/\s*캠페인(?:\s*신청\s*섹션)?$/i, "");
  s = s.replace(/\s*신청\s*섹션$/i, "");

  // 4) 뒤에 붙는 태그형 문구 제거 (예약필수, 맛집형 등)
  s = s.split(/\s+(?:예약필수|맛집형|클립|TASTE|이미지|배너|탭|신청섹션)\b/i)[0].trim();

  // 5) 다중 공백 정리
  s = s.replace(/\s{2,}/g, " ").trim();

  // 6) 너무 긴 경우 마지막 의미있는 토큰(최대 4토큰) 사용
  const tokens = s.split(/\s+/);
  if(tokens.length > 6){
    s = tokens.slice(-4).join(" ");
  }

  return s;
}

function cleanProvidedLine(line){
  if(!line) return "";
  let t = line.replace(/^[\s\-•\*\★\※\u2022]+/,"").trim();
  t = t.replace(/\(.*?\)$/,"").trim();
  return t;
}

function looksLikeRewardLine(line){
  if(!line) return false;
  return /(?:\d+[만천]원|\d+원|만원|식사권|권|중\s*택|택\s*1|택1|금액권|\b세트\b|\+|\b세트메뉴\b)/i.test(line);
}

// 텍스트 기반 파서 (DOMParser 없을 때도 동작)
function parseTextually(bodyText){
  const meta = { notes: [], rawMatches: {} };
  let company = "", region = "", regionFull = "", providedItems = "";
  let announcementDate = "", experienceStart = "", experienceEnd = "";
  let naverPlaceUrl = "";

  const rawLines = (bodyText||"").split("\n").map(l=>trim(l)).filter(Boolean);
  const lines = rawLines.filter(l => !isHeaderLine(l));

  // 콘텐츠 시작 인덱스 찾기 (헤더 스킵)
  let startIdx = 0;
  for(let i=0;i<lines.length;i++){
    if(/\[.*\].*캠페인/i.test(lines[i]) || (/\b캠페인\b/i.test(lines[i]) && !/캠페인 일정/i.test(lines[i])) || /\b결과 발표\b|\b발표일\b|\b신청기간\b/i.test(lines[i])){
      startIdx = Math.max(0, i-1);
      break;
    }
  }
  const contentLines = lines.slice(startIdx);
  const contentText = contentLines.join("\n");

  // 1) 업체명 및 regionFull 추출: 첫 대괄호 라인 우선
  const firstBracketLineIndex = contentLines.findIndex(l => /\[([^\]]+)\]/.test(l));
  if(firstBracketLineIndex !== -1){
    const line = contentLines[firstBracketLineIndex];
    const bracketMatch = line.match(/\[([^\]]+)\]/);
    if(bracketMatch) regionFull = trim(bracketMatch[1]);
    // 대괄호 뒤 텍스트에서 회사명 추출
    const afterBracket = line.replace(/^\s*\[[^\]]+\]\s*/,"").trim();
    if(afterBracket){
      company = company || extractCompanyFromLine(afterBracket);
    } else {
      const next = contentLines[firstBracketLineIndex + 1] || "";
      if(next) company = company || extractCompanyFromLine(next);
    }
    meta.rawMatches.bracketLine = line;
  }

  // 2) 보조: 캠페인 포함 라인에서 회사명 추출
  if(!company){
    const camLine = contentLines.find(l => /\b캠페인\b/i.test(l) && !isHeaderLine(l));
    if(camLine) company = extractCompanyFromLine(camLine);
    if(company) meta.rawMatches.campaignLine = camLine;
  }

  // 3) 마지막 폴백: 콘텐츠 상단 비어있지 않은 라인에서 후보 추출
  if(!company){
    for(const l of contentLines.slice(0,6)){
      const cand = extractCompanyFromLine(l);
      if(cand) { company = cand; meta.rawMatches.fallback = l; break; }
    }
  }

  // 4) 제공내역: '총 N명 모집' 바로 다음 라인들(최대 5줄) 수집
  const recruitIdx = contentLines.findIndex(l => /총\s*\d+\s*명\s*모집/i.test(l));
  if(recruitIdx !== -1){
    const collected = [];
    for(let k = recruitIdx + 1; k < Math.min(contentLines.length, recruitIdx + 6); k++){
      const Lraw = contentLines[k];
      if(!Lraw) break;
      const L = Lraw.trim();

      // 1) 불릿/특수문자로 시작하면 무조건 제외(요청 반영)
      if(/^[\-\u2022•\*\u25CF\★\※]/.test(L)) {
        continue; // skip bullet lines entirely
      }

      // 2) explicit note 키워드가 포함되어 있으면 수집 중단 (유의사항 등)
      const isExplicitNote = /(?:유의사항|참고|주의|예약|방문|휴무|본인부담|초과비용|전화|예약문의|※|★)/i.test(L);
      if(isExplicitNote) break;

      // 3) 보상형 라인(금액, 권, 택 등) 또는 +, 세트 표기 등은 항목으로 간주
      const looksReward = looksLikeRewardLine(L);
      if(looksReward) {
        collected.push(cleanProvidedLine(L));
        continue;
      }

      // 4) 일반 텍스트(예: "김밥윤결&만두 2만원 금액권") 같은 경우도 수집
      if(/[가-힣\w].{0,50}/.test(L)) {
        collected.push(cleanProvidedLine(L));
        continue;
      }

      // 기타: 안전하게 다음 줄로
    }
    // 중복/빈 값 제거
    const uniq = Array.from(new Set(collected.map(x => x.trim()).filter(Boolean)));
    providedItems = uniq.join(", ");
    meta.rawMatches.recruitLine = contentLines[recruitIdx];
  } else {
    // 폴백: 본문에서 reward-like 라인 하나 찾기 (불릿 시작 라인 제외)
    const rewardLine = contentLines.find(l => looksLikeRewardLine(l) && !/^[\-\u2022•\*\u25CF\★\※]/.test(l) && !/유의사항|예약|방문/i.test(l));
    if(rewardLine) providedItems = cleanProvidedLine(rewardLine);
  }

  // 5) 발표일 추출 (contentLines 기준)
  const annIdx = contentLines.findIndex(l => /\b발표일\b|\b결과 발표\b/i.test(l));
  if(annIdx !== -1){
    let candidates = findAllDates(contentLines[annIdx]);
    if(candidates.length === 0 && contentLines[annIdx + 1]) candidates = candidates.concat(findAllDates(contentLines[annIdx + 1]));
    if(candidates.length) announcementDate = normalizeDateStr(candidates[0]);
  } else {
    const inline = contentLines.find(l => /결과.*발표|결과.*알려/.test(l));
    if(inline){
      const cand = findAllDates(inline)[0];
      if(cand) announcementDate = normalizeDateStr(cand);
    }
  }

  // 6) 체험기간 추출 (신청기간 또는 본문 범위)
  const applyIdx = contentLines.findIndex(l => /신청기간|접수기간|체험 기간|체험기간/i.test(l));
  if(applyIdx !== -1){
    const range = extractRangeFromText(contentLines[applyIdx]);
    if(range.length >= 2){
      experienceStart = normalizeDateStr(range[0]);
      experienceEnd = normalizeDateStr(range[1]);
    }
  } else {
    const rangeLine = contentLines.find(l => /(\d{2,4}[.\-\/년]\s?\d{1,2}).*(?:–|—|-|~|to).*(\d{2,4}[.\-\/년]\s?\d{1,2})/);
    if(rangeLine){
      const r = extractRangeFromText(rangeLine);
      if(r.length >= 2){ experienceStart = normalizeDateStr(r[0]); experienceEnd = normalizeDateStr(r[1]); }
    }
  }

  // 7) naverPlaceUrl 보강
  naverPlaceUrl = extractNaverPlaceUrlFromText(contentText) || extractNaverPlaceUrlFromText(bodyText);

  // 8) region 보정 (regionFull -> region)
  if(regionFull && !region){
    const p = regionFull.split(/\s+/);
    if(p.length >= 2) region = `${p[0]} ${p[1].replace(/(구|군)$/,"")}`;
    else region = regionFull;
  }

  meta.candidates = { company, region, regionFull, providedItems, naverPlaceUrl };
  if(!company) meta.notes.push("회사명 미검출: 대괄호 뒤 텍스트가 있는지 확인하세요.");
  if(!providedItems) meta.notes.push("제공내역 미검출: '총 N명 모집' 패턴 확인하세요.");

  return {
    company: company || "",
    region: region || "",
    regionFull: regionFull || "",
    providedItems: providedItems || "",
    announcementDate: announcementDate || "",
    experienceStart: experienceStart || "",
    experienceEnd: experienceEnd || "",
    naverPlaceUrl: naverPlaceUrl || "",
    meta
  };
}

// DOM 사용 안전 래퍼: DOMParser가 정의돼 있으면 DOM으로 bodyText 추출 후 parseTextually 호출
function parseWithDOM(raw){
  try{
    const parser = (typeof DOMParser !== "undefined") ? new DOMParser() : null;
    if(parser){
      const doc = parser.parseFromString(String(raw||""), "text/html");
      const bodyText = doc.body ? (doc.body.innerText || "") : String(raw||"");
      return parseTextually(bodyText);
    }
  }catch(e){
    // 폴백
  }
  return parseTextually(String(raw||""));
}

// 최종 export (동기 함수)
function parseDINNERText(raw){
  return parseWithDOM(raw);
}

export { parseDINNERText };
export default parseDINNERText;
