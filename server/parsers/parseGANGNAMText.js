// src/server/parsers/parseGANGNAMText.js
// 강남맛집 복붙 파서 (기간 강인식 + 주소/경쟁률 보강 + ISO 반환)
export function parseGANGNAMText(rawText = '') {
  const normSpaces = (s) =>
    String(s || '')
      .replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const text = String(rawText || '');
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  /* ---------- 1) 업체명 / 기본 지역 ---------- */
  const compLineIdx = lines.findIndex((l) => /^\[[^\]]+\]/.test(l));
  const compMatch =
    (compLineIdx >= 0 && lines[compLineIdx].match(/^\[([^\]]+)\]\s*(.+)$/)) || [];
  const defaultRegionRaw = normSpaces(compMatch[1] || '');
  const company = normSpaces(compMatch[2] || '');

  // 지역 정규화 유틸: [ ] / / 제거, 접미사 컷(특별시/광역시/도, 시/군/구), 잘린 브라켓 방지
  const normalizeRegion = (input = '') => {
    if (!input) return '';
    let s = normSpaces(input);

    // 괄호 패턴 처리: "[서울 동대문]"이면 내부만, "서울 동대문] ..."이면 ']' 이후 컷
    s = s.replace(/^[^\[]*\[([^\]]+)\].*$/, '$1'); // 대괄호 내부만 추출
    s = s.replace(/\].*$/, '');                   // 남은 닫힘괄호 및 뒤 꼬리 컷

    // 구분자 정리
    s = s.replace(/\//g, ' ');
    s = s.replace(/\s+/g, ' ').trim();

    const parts = s.split(/\s+/);
    let prov = parts[0] || '';
    let dist = parts[1] || '';

    // 접미사 컷
    prov = prov.replace(/(특별자치도|특별시|광역시|자치시|도)$/,'');
    dist = dist.replace(/(시|군|구)$/,'').replace(/]$/,'');

    // 최소 "광역단위 + 기초(구/군/시)" 두 토큰 필요
    if (!prov || !dist) return '';

    return `${prov} ${dist}`.trim();
  };

  const defaultRegion = normalizeRegion(defaultRegionRaw);

  /* ---------- 2) 제공내역: 업체명 바로 다음 줄 ---------- */
  const providedItems = normSpaces(lines[compLineIdx + 1] || '');

  /* ---------- 3) 주소 & 축약 지역 ---------- */
  const BAD_LINE = /(NAVER\s*©|카카오|지도|위치|길찾기)/i;
  const provRx =
    /^(서울|세종|제주|인천|부산|대전|대구|광주|울산|경기|강원특별자치도|전북특별자치도|강원|충북|충남|경북|경남|전북|전남)\b/;

  // 줄 단위 우선, 없으면 본문에서 첫 매치(이때 ']' 꼬리 제거를 normalizeRegion에서 처리)
  let regionFullCandidate =
    lines.find((l) => provRx.test(l) && !BAD_LINE.test(l)) ||
    (text.match(/(서울|세종|제주|인천|부산|대전|대구|광주|울산|경기|강원특별자치도|전북특별자치도|강원|충북|충남|경북|경남|전북|전남)[^\n]+/)?.[0] || '');
  regionFullCandidate = normSpaces(regionFullCandidate);

  // 최종 region: 기본지역 우선, fallback 후보가 '브라켓/이상문자 없음 + 두 토큰'을 만족할 때만 덮어쓰기
  let region = defaultRegion;
  const regionFromFull = normalizeRegion(regionFullCandidate);
  if (regionFromFull && !/[\[\]]/.test(regionFromFull)) {
    region = regionFromFull;
  }

  /* ---------- 4) 경쟁률: '신청자 18/10' → '18:10' (or '지원 ~ 모집 ~') ---------- */
  let competitionRatio = '';
  {
    let m =
      text.match(/신청자\s*(\d+)\s*[/:\-]\s*(\d+)/) ||
      text.match(/지원\s*(\d+)[\s\S]*?모집\s*(\d+)/);
    if (m) competitionRatio = `${m[1]}:${m[2]}`;
  }

  /* ---------- 5) 날짜 파싱 유틸 ---------- */
  const toISO = (y, m, d) =>
    `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const parseOneDateToISO = (s) => {
    if (!s) return '';
    const nowY = new Date().getFullYear();
    const src = String(s).replace(/\([^)]+\)/g, ''); // (금) 제거 등

    let m = src.match(/(\d{4})[.\-\/]\s*(\d{1,2})[.\-\/]\s*(\d{1,2})/);
    if (m) return toISO(+m[1], +m[2], +m[3]);

    m = src.match(/(\d{1,2})[.\/]\s*(\d{1,2})/);
    if (m) return toISO(nowY, +m[1], +m[2]);

    m = src.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (m) return toISO(nowY, +m[1], +m[2]);

    return '';
  };

  const DATE = '(?:\\d{4}[.\\-/]\\s*\\d{1,2}[.\\-/]\\s*\\d{1,2}|\\d{1,2}[./]\\s*\\d{1,2}|\\d{1,2}\\s*월\\s*\\d{1,2}\\s*일)';
  const RANGE = new RegExp(`${DATE}\\s*(?:~|–|—|-|to)\\s*${DATE}`, 'i');

  const labelPriority = [
    /리뷰\s*등록\s*기간/i,
    /체험\s*&\s*리뷰/i,
    /체험\s*기간/i,
    /캠페인\s*(?:진행)?\s*기간/i
  ];

  const findRangeByLabel = () => {
    for (const lb of labelPriority) {
      const inline = new RegExp(`${lb.source}[^\\n]{0,80}?(${DATE})\\s*(?:~|–|—|-|to)\\s*(${DATE})`, 'i');
      const m = text.match(inline);
      if (m) {
        const start = parseOneDateToISO(m[1]);
        const end   = parseOneDateToISO(m[2]);
        if (start && end) return { start, end };
      }
    }
    for (const lb of labelPriority) {
      const idx = lines.findIndex((l) => lb.test(l));
      if (idx < 0) continue;
      const scope = [lines[idx], lines[idx + 1] || '', lines[idx + 2] || '', lines[idx + 3] || '']
        .filter(Boolean)
        .join(' ');
      const m = scope.match(RANGE);
      if (m) {
        const left  = (m[0].match(new RegExp(`^\\s*(${DATE})`, 'i')) || [,''])[1];
        const right = (m[0].match(new RegExp(`(?:~|–|—|-|to)\\s*(${DATE})\\s*$`, 'i')) || [,''])[1];
        const start = parseOneDateToISO(left);
        const end   = parseOneDateToISO(right);
        if (start && end) return { start, end };
      }
      const tokens = (scope.match(new RegExp(DATE, 'gi')) || []);
      if (tokens.length >= 2) {
        const start = parseOneDateToISO(tokens[0]);
        const end   = parseOneDateToISO(tokens[1]);
        if (start && end) return { start, end };
      }
    }
    return { start: '', end: '' };
  };

  /* ---------- 6) 발표일 / 체험기간 ---------- */
  const annIdx = lines.findIndex((l) => /리뷰어\s*발표/i.test(l));
  let announcementDate = '';
  if (annIdx >= 0) {
    const scope = [lines[annIdx], lines[annIdx + 1] || ''].join(' ');
    const tok = (scope.match(new RegExp(DATE, 'i')) || [])[0];
    if (tok) announcementDate = parseOneDateToISO(tok);
  } else {
    const m = text.match(/리뷰어\s*발표[^\n]{0,40}?(\d{1,2}[./]\s*\d{1,2}|\d{4}[.\-\/]\s*\d{1,2}[.\-\/]\s*\d{1,2}|\d{1,2}\s*월\s*\d{1,2}\s*일)/i);
    if (m) announcementDate = parseOneDateToISO(m[1]);
  }

  const exp = findRangeByLabel();
  const experienceStart = exp.start;
  const experienceEnd   = exp.end;
  const experiencePeriod =
    experienceStart && experienceEnd ? `${experienceStart} ~ ${experienceEnd}` : '';

  return {
    company,
    region,          // ✅ 이제 '서울 광진'처럼 깔끔 (']' 제거)
    regionFull: normSpaces(regionFullCandidate),
    providedItems,
    competitionRatio,
    experienceStart,
    experienceEnd,
    experiencePeriod,
    announcementDate,
    text
  };
}

export default parseGANGNAMText;
