// 📁 utils/naverCrawler.js

import puppeteer from 'puppeteer';

export async function getNaverPlaceUrl(name) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  const searchUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(name)}`;
  await page.goto(searchUrl, { waitUntil: 'networkidle2' });

  const link = await page.evaluate(() => {
    const aTag = document.querySelector('a.place_bluelink, a.tit, a[href*=\"map.naver.com\"]');
    return aTag?.href || '';
  });

  await browser.close();
  return link;
}
