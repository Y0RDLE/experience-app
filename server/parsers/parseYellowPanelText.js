// src/server/parsers/parseYellowPanelText.js
export function parseYellowPanelText(txt) {
  const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 업체명과 지역 추출
  const companyLine = lines.find(l => /^\[.*\]\s*.+$/.test(l)) || '';
  const [, regionBracket, company] = companyLine.match(/^\[(.+)\]\s*(.+)$/) || [];

  // 전체 주소
  const addressLine = lines.find(l => l.startsWith('방문 주소')) || '';
  const regionFull = addressLine.replace(/^방문 주소\s*/, '');
  const region = regionBracket || '';

  // 제공내역 (다음 줄)
  const providedIdx = lines.findIndex(l => l.startsWith('제공서비스/물품'));
  const providedItems = (providedIdx >= 0 && lines[providedIdx + 1])
    ? lines[providedIdx + 1]
    : '';

  // 체험기간 (다음 줄에서 시작~종료)
  const periodIdx = lines.findIndex(l => l.startsWith('체험기간'));
  const periodRaw = (periodIdx >= 0 && lines[periodIdx + 1])
    ? lines[periodIdx + 1]
    : '';
  const experiencePeriod = periodRaw.replace(/\s*\(.*?\)/g, ''); // 괄호 제거

  // 발표일 (다음 줄)
  const announceIdx = lines.findIndex(l => l.startsWith('리뷰어 발표'));
  const announceRaw = (announceIdx >= 0 && lines[announceIdx + 1])
    ? lines[announceIdx + 1]
    : '';
  const announcementDate = announceRaw.replace(/\s*\(.*?\)/g, '').trim();

  // 경쟁률
  const ratioLine = lines.find(l => /지원\s*\d+\s*\/\s*모집\s*\d+/.test(l)) || '';
  const nums = ratioLine.match(/\d+/g) || [];
  const competitionRatio = nums.length >= 2 ? `${nums[0]}:${nums[1]}` : '';

  return {
    company: company || '',
    regionFull,
    region,
    providedItems,
    experiencePeriod,
    announcementDate,
    competitionRatio,
  };
}