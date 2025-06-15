// src/server/utils/getNaverPlaceUrl.js
import puppeteer from 'puppeteer';

export async function getNaverPlaceUrl(name) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const searchUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(name)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    // 검색결과 중 ‘장소’ 탭으로 이동 (필요시)
    const placeTab = await page.$('a[aria-label="장소"]');
    if (placeTab) {
      await placeTab.click();
      await page.waitForLoadState?.('networkidle') || page.waitForTimeout(1000);
    }

    // 메인 문서에서 바로 place URL 추출
    const placeUrl = await page.evaluate(() => {
      // v5 지도 진입 링크
      const a = document.querySelector('a[href^="https://map.naver.com/v5/entry/place"]');
      return a ? a.href : null;
    });

    await browser.close();
    return placeUrl;
  } catch (err) {
    await browser.close();
    throw err;
  }
}
