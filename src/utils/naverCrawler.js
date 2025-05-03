import puppeteer from 'puppeteer';

export async function getNaverPlaceUrl(name) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    const searchUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(name)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    // iframe 내부 접근
    const frames = await page.frames();
    const searchFrame = frames.find(f => f.url().includes('search.naver.com/search.naver?where='));

    if (!searchFrame) {
      console.log('❌ iframe not found');
      await browser.close();
      return null;
    }

    const placeUrl = await searchFrame.evaluate(() => {
      const aTag = document.querySelector('a[href^="https://map.naver.com/v5/entry/place"]');
      return aTag?.href || '';
    });

    await browser.close();
    return placeUrl || null;
  } catch (err) {
    await browser.close();
    throw err;
  }
}
