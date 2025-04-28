const puppeteer = require('puppeteer');

async function crawlCampaign(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // XPath로 텍스트 추출 헬퍼
  async function getText(xpath) {
    const [el] = await page.$x(xpath);
    if (!el) return '';
    const txt = await page.evaluate(e => e.textContent, el);
    return txt.trim();
  }

  // 1) 타이틀 ([지역] 업체명…)
  const rawTitle = await getText('//h1 | //*[contains(@class, "campaign-title")]');
  const regionMatch = rawTitle.match(/\[([^\]]+)\]/);
  const defaultRegion = regionMatch
    ? regionMatch[1].split('/').slice(0, 2).join(' ')
    : '';
  const afterRegion = rawTitle.replace(/\[[^\]]+\]\s*/, '');
  const companyMatch = afterRegion.match(/^(.+?)에서\b/);
  const company = companyMatch
    ? companyMatch[1].trim()
    : afterRegion.split(/\s+/)[0];

  // 2) dt/dd 레이블-값 추출
  const providedItems    = await getText("//dt[contains(text(),'제공내역')]/following-sibling::dd[1]");
  const fullAddress      = await getText("//dt[contains(text(),'방문주소')]/following-sibling::dd[1]");
  const competitionRatio = await getText("//dt[contains(text(),'신청한 리뷰어')]/following-sibling::dd[1]");
  const announcementDate = await getText("//dt[contains(text(),'발표')]/following-sibling::dd[1]");
  const expRaw           = await getText("//dt[contains(text(),'리뷰 등록기간') or contains(text(),'등록기간')]/following-sibling::dd[1]");

  // 3) 날짜 정제
  const annMatch = announcementDate.match(/(\d{1,2}[.\/]\d{1,2})/);
  const expMatch = expRaw.match(/(\d{1,2}[.\/]\d{1,2})\s*[~\-–]\s*(\d{1,2}[.\/]\d{1,2})/);

  // 4) 네이버 플레이스 URL
  const naverPlaceUrl = await page.evaluate(() => {
    const a = Array.from(document.querySelectorAll('a[href*="map.naver.com"], a[href*="naver.me"]'))[0];
    return a ? a.href : '';
  });

  await browser.close();

  return {
    company,
    region: defaultRegion,
    fullAddress,
    providedItems,
    competitionRatio: competitionRatio.trim(),
    announcementDate: annMatch ? annMatch[1] : '',
    experiencePeriod: expMatch ? `${expMatch[1]} ~ ${expMatch[2]}` : '',
    naverPlaceUrl,
  };
}

// CLI 실행 지원
if (require.main === module) {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node crawlCampaignXPath.js <campaign_url>');
    process.exit(1);
  }
  crawlCampaign(url)
    .then(data => console.log('추출 데이터:', data))
    .catch(err => console.error('크롤링 실패:', err));
}

module.exports = { crawlCampaign };
