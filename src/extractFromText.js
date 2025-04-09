import { parseReviewNoteText } from './parseReviewNoteText';
import { extractFromText as extractFromGangnam } from './parseGANGNAMText';

export function extractFromText(html) {
  const lowered = html.toLowerCase();
  if (
    lowered.includes('리뷰노트') ||
    lowered.includes('reviewnote') ||
    lowered.includes('대한민국 최초 무료체험단')
  ) {
    return parseReviewNoteText(html);
  }
  return extractFromGangnam(html);
}
