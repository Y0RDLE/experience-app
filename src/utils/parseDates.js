// src/utils/parseDates.js
import { addYearIfNeeded } from './dateHelpers';

/**
 * parseReviewNoteText 에서 뽑아낸 발표일(raw)을 ISO 날짜로 변환합니다.
 * 지원 포맷: "5/8", "5.8", "2025-05-08" 등
 * @param {string} raw
 * @returns {string} YYYY-MM-DD 또는 빈 문자열
 */
export function parseAnnouncementDate(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const isoInput = addYearIfNeeded(raw);
  const d = new Date(isoInput);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}
