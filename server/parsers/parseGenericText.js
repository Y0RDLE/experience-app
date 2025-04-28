import { parseReviewNoteText } from './parseReviewNoteText.js';

/**
 * Generic parser: 리뷰노트 파서를 재사용하여
 * HTML 문자열에서 텍스트를 추출합니다.
 * @param {string} html - 페이지 전체 HTML 또는 텍스트
 * @returns {object} parseReviewNoteText 결과
 */
export function parseGenericText(html) {
  return parseReviewNoteText(html);
}
