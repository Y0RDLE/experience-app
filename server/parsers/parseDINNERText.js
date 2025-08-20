// server/parsers/parseDINNERText.js
// 디너의여왕 전용 파서 (신청기간 완전 무시, 라벨-값 1:1 매핑, 제공내역=보상만)

function trim(s){ return (s||"").toString().replace(/[\u00A0\u200B-\u200D\uFEFF]/g," ").trim(); }

// YY.MM.DD / YYYY.MM.DD / YYYY-MM-DD / "25. 08. 19" → ISO YYYY-MM-DD
function normalizeDateStr(dateStr){
  if(!dateStr) return "";
  const re = /(\d{2,4})[.\-\/년]\s?(\d{1,2})[.\-\/월]?\s?(\d{1,2})/;
  const m = String(dateStr||"").match(re);
  if(!m) return "";
  let y = m[1], mon = m[2].padStart(2,"0"), day = m[3].padStart(2,"0");
  if(y.length === 2) y = String(2000 + parseInt(y,10));
  return `${y}-${mon}-${day}`;
}

function findAllDates(text){
  if(!text) return [];
  const re = /(\d{2,4}[.\-\/년]\s?\d{1,2}[.\-\/월]?\s?\d{1,2})/g;
  const out = []; let m;
  const src = String(text||"");
  while((m = re.exec(src)) !== null) out.push(trim(m[1]));
  return out;
}

// 기간: A ~ B / A – B / A - B / A to B, 없으면 2개 날짜로 대체
function extractRangeFromText(text){
  if(!text) return [];
  const parts = String(text||"").split(/\s*(?:–|—|-|~|to)\s*/i).map(s=>s.trim()).filter(Boolean);
  if(parts.length >= 2) return [parts[0], parts[1]];
  const dates = findAllDates(text);
  if(dates.length >= 2) return [dates[0], dates[1]];
  return [];
}

function extractNaverPlaceUrlFromText(text=""){
  const patterns = [
    /https?:\/\/(?:m\.)?place\.naver\.com\/[^\s'"]+/i,
    /https?:\/\/map\.naver\.com\/[^\s'"]+/i,
    /https?:\/\/naver\.me\/[^\s'"]+/i
  ];
  for(const re of patterns){
    const m = String(text||"").match(re);
    if(m) return m[0];
  }
  return "";
}

function isHeaderLine(line){
  if(!line) return false;
  return /^(검색|profile|프로필|나의 캠페인|나의 정보|포인트|계정연동|로그아웃|로그인|캠페인 일정|TASTE|푸터|메뉴|스토리|맛집 보기|검색하)/i.test(line);
}

/* ---------- 업체/제공내역 ---------- */

function extractCompanyFromLine(line){
  if(!line) return "";
  let s = trim(line);
  s = s.replace(/^(디너의여왕|홈디너의여왕|뷰티의여왕|택배의여왕)\s*/i, "");
  s = s.replace(/^(?:\[[^\]]+\]\s*)+/,"").trim(); // [서울 노원][클립] 제거
  s = s.replace(/\s*캠페인(?:\s*신청\s*섹션)?$/i, "");
  s = s.replace(/\s*신청\s*섹션$/i, "");
  s = s.split(/\s+(?:예약필수|맛집형|클립|TASTE|이미지|배너|탭|신청섹션)\b/i)[0].trim();
  s = s.replace(/\s{2,}/g, " ").trim();
  const tokens = s.split(/\s+/);
  if(tokens.length > 6) s = tokens.slice(-4).join(" ");
  return s;
}

function looksLikeRewardLine(line){
  if(!line) return false;
  return /(?:\d+[만천]원|\d+원|만원|식사권|금액권|권\b|중\s*택|택\s*1|택1|\b세트\b|\+|\b세트메뉴\b|이용권|바우처)/i.test(line);
}
function isNoteOrOpsLine(line){
  if(!line) return true;
  if(/^[\-\u2022•\*\u25CF\★\※]/.test(line)) return true; // 불릿 시작
  if(/^(체험\s*시간|휴무일|예약\s*문의|예약\s*문자|예약\s*필수|당일예약|노쇼|대리체험|포장체험|주차|매장\s*영업시간|라스트오더)\s*:?/i.test(line)) return true;
  if(/(유의사항|참고|주의|본인\s*부담|본인부담|초과비용|전화|중복\s*체험|SNS|선정)/i.test(line)) return true;
  return false;
}

/* ---------- 메인 파서 ---------- */

function parseTextually(bodyText){
  let company = "";
  let region = "";
  let regionFull = "";
  let providedItems = "";
  let announcementDate = "";
  let experienceStart = "";
  let experienceEnd = "";
  let naverPlaceUrl = "";

  const rawLines = String(bodyText||"").split("\n").map(l=>trim(l));
  const lines = rawLines.filter(l => l && !isHeaderLine(l));
  const textAll = lines.join("\n");

  // 1) 업체명/지역
  const firstBracketLineIndex = lines.findIndex(l => /\[([^\]]+)\]/.test(l));
  if(firstBracketLineIndex !== -1){
    const line = lines[firstBracketLineIndex];
    const bracketAll = line.match(/\[([^\]]+)\]/g);
    if(bracketAll && bracketAll.length){
      const firstBracket = bracketAll[0].replace(/^\[|\]$/g,'');
      regionFull = trim(firstBracket);
    }
    const afterBracket = line.replace(/^\s*(?:\[[^\]]+\]\s*)+/,"").trim();
    if(afterBracket) company = extractCompanyFromLine(afterBracket);
    else {
      const next = lines[firstBracketLineIndex + 1] || "";
      if(next) company = extractCompanyFromLine(next);
    }
  }
  if(!company){
    const camLine = lines.find(l => /\b캠페인\b/i.test(l));
    if(camLine) company = extractCompanyFromLine(camLine);
  }
  if(!company){
    for(const l of lines.slice(0,6)){
      const cand = extractCompanyFromLine(l);
      if(cand){ company = cand; break; }
    }
  }

  // 2) 제공내역: '총 N명 모집' 아래에서 보상형만 (운영/주의/불릿 컷)
  const recruitIdx = lines.findIndex(l => /총\s*\d+\s*명\s*모집/i.test(l));
  if(recruitIdx !== -1){
    const collected = [];
    for(let k = recruitIdx + 1; k < Math.min(lines.length, recruitIdx + 10); k++){
      const L = (lines[k] || "").trim();
      if(!L) continue;
      if(isNoteOrOpsLine(L)) continue;
      if(/^(방문\s*및\s*예약|방문\s*위치|리뷰정보|리뷰어\s*미션|추가\s*안내사항|클립\s*해시태그|블로그\s*키워드|체험.?리뷰|발표일|신청기간)\s*$/i.test(L)) break;
      if(looksLikeRewardLine(L) || /금액권|식사권|이용권/i.test(L)){
        collected.push(L.replace(/\(.*?\)/g,"").trim());
      }
      if(collected.length >= 3) break;
    }
    providedItems = Array.from(new Set(collected)).join(", ");
  } else {
    const rewardLine = lines.find(L => looksLikeRewardLine(L) && !isNoteOrOpsLine(L));
    if(rewardLine) providedItems = rewardLine.replace(/\(.*?\)/g,"").trim();
  }

  // 3) ★ 핵심: 라벨 블록과 값 블록 매핑 (신청기간은 버림)
  // 라벨들이 연속으로 뜨고, 그 '다음'에 값들이 같은 순서로 줄지어 나오는 구조를 사용
  const labelIdx_apply = lines.findIndex(l => /^\s*신청기간\s*$/i.test(l));
  let labelIdx_ann = -1, labelIdx_exp = -1;
  if(labelIdx_apply !== -1){
    labelIdx_ann = lines.findIndex((l, i) => i > labelIdx_apply && /^\s*발표일\s*$/i.test(l));
    if(labelIdx_ann !== -1){
      labelIdx_exp = lines.findIndex((l, i) => i > labelIdx_ann && /^\s*체험.?리뷰\s*$/i.test(l));
    }
  }

  if(labelIdx_apply !== -1 && labelIdx_ann !== -1 && labelIdx_exp !== -1){
    // 라벨 블록의 마지막(체험&리뷰) 이후부터 날짜 포함된 줄 3개 수집
    const dateLines = [];
    for(let i = labelIdx_exp + 1; i < lines.length && dateLines.length < 6; i++){
      const L = lines[i].trim();
      if(!L) continue;
      // 다른 라벨이 또 나오면 중단
      if(/^(신청기간|발표일|체험.?리뷰)\s*$/i.test(L)) break;
      if(findAllDates(L).length) dateLines.push(L);
      if(dateLines.length >= 3) break;
    }

    // 기대 순서: [신청기간값, 발표일값, 체험기간값]
    if(dateLines.length >= 3){
      // 발표일
      const dAnn = findAllDates(dateLines[1])[0];
      if(dAnn) announcementDate = normalizeDateStr(dAnn);
      // 체험기간
      let r = extractRangeFromText(dateLines[2]);
      if(r.length >= 2){
        experienceStart = normalizeDateStr(r[0]);
        experienceEnd   = normalizeDateStr(r[1]);
      } else {
        const ds = findAllDates(dateLines[2]);
        if(ds.length >= 2){
          experienceStart = normalizeDateStr(ds[0]);
          experienceEnd   = normalizeDateStr(ds[1]);
        }
      }
    } else {
      // 값 줄이 3개 못 모였을 때: 단일/범위 판별로 추론
      const singles = dateLines.filter(L => extractRangeFromText(L).length < 2 && findAllDates(L).length >= 1);
      const ranges  = dateLines.filter(L => extractRangeFromText(L).length >= 2 || findAllDates(L).length >= 2);
      // 발표일 = 첫 단일 날짜, 체험기간 = '마지막' 범위(신청기간 범위를 피하기 위해)
      if(singles.length){
        const d = findAllDates(singles[0])[0];
        if(d) announcementDate = normalizeDateStr(d);
      }
      if(ranges.length){
        const lastRange = ranges[ranges.length - 1];
        const r = extractRangeFromText(lastRange);
        if(r.length >= 2){
          experienceStart = normalizeDateStr(r[0]);
          experienceEnd   = normalizeDateStr(r[1]);
        }
      }
    }
  } else {
    // 폴백: 라벨별 "다음 줄" 탐색 (페이지 변형 대응)
    const idxAnn = lines.findIndex(l => /^\s*발표일\s*$/i.test(l) || /결과\s*발표는/.test(l));
    if(idxAnn !== -1){
      // 라벨 직후부터 다음 라벨 나오기 전까지 첫 날짜 줄
      for(let i=idxAnn+1;i<Math.min(lines.length, idxAnn+10);i++){
        const L = lines[i].trim();
        if(!L) continue;
        if(/^(신청기간|발표일|체험.?리뷰)\s*$/i.test(L)) break;
        const ds = findAllDates(L);
        if(ds.length){ announcementDate = normalizeDateStr(ds[0]); break; }
      }
    }
    const idxExp = lines.findIndex(l => /^\s*체험.?리뷰\s*$/i.test(l));
    if(idxExp !== -1){
      for(let i=idxExp+1;i<Math.min(lines.length, idxExp+12);i++){
        const L = lines[i].trim();
        if(!L) continue;
        if(/^(신청기간|발표일|체험.?리뷰)\s*$/i.test(L)) break;
        const r = extractRangeFromText(L);
        if(r.length >= 2){
          experienceStart = normalizeDateStr(r[0]);
          experienceEnd   = normalizeDateStr(r[1]);
          break;
        }
      }
    }
  }

  // 4) 네이버 플레이스 URL
  naverPlaceUrl = extractNaverPlaceUrlFromText(textAll);

  // 5) region 보정
  if(regionFull && !region){
    const p = regionFull.split(/\s+/);
    region = p.length >= 2 ? `${p[0]} ${p[1].replace(/(구|군)$/,"")}` : regionFull;
  }

  return {
    siteName: '디너의여왕',
    company: company || "",
    region: region || "",
    regionFull: regionFull || "",
    providedItems: providedItems || "",
    announcementDate: announcementDate || "",
    experienceStart: experienceStart || "",
    experienceEnd: experienceEnd || "",
    naverPlaceUrl: naverPlaceUrl || "",
  };
}

/* ---------- DOM 래퍼 ---------- */
function parseWithDOM(raw){
  try{
    const parser = (typeof DOMParser !== "undefined") ? new DOMParser() : null;
    if(parser){
      const doc = parser.parseFromString(String(raw||""), "text/html");
      const bodyText = doc.body ? (doc.body.innerText || "") : String(raw||"");
      return parseTextually(bodyText);
    }
  }catch(e){}
  return parseTextually(String(raw||""));
}

/* ---------- export ---------- */
function parseDINNERText(raw){
  return parseWithDOM(raw);
}
export { parseDINNERText };
export default parseDINNERText;
