// src/utils/dateHelpers.js
/**
 * "5/8" 또는 "5.8" 형태의 문자열에 연도를 붙여 YYYY-MM-DD 형식으로 변환합니다.
 * 이미 "YYYY-MM-DD" 형식이면 그대로 반환합니다.
 * @param {string} raw - MM/DD 또는 M.D 또는 YYYY-MM-DD
 * @param {number} [year=new Date().getFullYear()] - 기본 연도
 * @returns {string}
 */
export function addYearIfNeeded(raw, year = new Date().getFullYear()) {
    const trimmed = raw.trim();
    const m = trimmed.match(/^(\d{1,2})[\/\.](\d{1,2})$/);
    if (m) {
      const mo = m[1].padStart(2, '0');
      const da = m[2].padStart(2, '0');
      return `${year}-${mo}-${da}`;
    }
    // YYYY-MM-DD라면 그대로
    return trimmed;
  }
  