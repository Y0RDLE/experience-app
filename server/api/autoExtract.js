import express from 'express';
import puppeteer from 'puppeteer';

const router = express.Router();

router.get('/api/autoExtract', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const data = await page.evaluate(() => {
      // dt 텍스트에 포함된 키워드로 dt 찾고, 다음 dd.textContent 리턴
      const pickDd = (label) => {
        const dtList = Array.from(document.querySelectorAll('dt'));
        const dt = dtList.find(d => d.textContent.trim().includes(label));
        if (!dt) return '';
        const dd = dt.nextElementSibling;
        return dd ? dd.textContent.trim() : '';
      };

      const company       = document.querySelector('h1.campaign-title')?.textContent.trim() || '';
      const providedItems = pickDd('제공서비스/물품');
      const regionFull    = pickDd('방문 주소');
      const regionParts   = regionFull.split(/\s+/);
      const region        = regionParts.length >= 2 ? regionParts.slice(0,2).join(' ') : '';

      // th → td 구조에서 뽑아내기 (기존 그대로)
      const pickTd = (label) => {
        const thList = Array.from(document.querySelectorAll('th'));
        const th = thList.find(t => t.textContent.includes(label));
        if (!th) return '';
        const td = th.nextElementSibling;
        return td ? td.textContent.trim() : '';
      };
      const experiencePeriod = pickTd('체험단 신청기간');
      const announcementDate = pickTd('리뷰어 발표');
      const competitionRatio = (pickDd('실시간 지원 현황').match(/지원\s*\d+\s*\/\s*모집\s*\d+/) || [''])[0];

      return { company, region, regionFull, providedItems, experiencePeriod, announcementDate, competitionRatio };
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

export default router;
