// ✅ server.js - fetch + puppeteer 동시 탑재 완성형

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer';

const app = express();
const PORT = 4000;

app.use(cors());

// ✅ HTML fetch 프록시
app.get('/api/fetch-html', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'url 파라미터가 필요합니다.' });
  }
  console.log('📡 요청받은 URL:', targetUrl);

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                      'Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    if (!response.ok) {
      console.error(`❌ 요청 실패, 상태 코드: ${response.status}`);
      return res.status(response.status).json({ error: '대상 URL 요청 실패' });
    }
    const html = await response.text();
    console.log('✅ HTML 일부:', html.slice(0, 300));

    const result = {
      company: '',
      region: '',
      providedItems: '',
      experiencePeriod: '',
      announcementDate: '',
      competitionRatio: '',
      text: html,
    };

    res.setHeader('Content-Type', 'application/json');
    res.json(result);
  } catch (error) {
    console.error('❌ HTML 요청 실패:', error);
    res.status(500).json({ error: '서버 오류 발생' });
  }
});

// ✅ 네이버 플레이스 크롤링 (puppeteer 기반)
app.get('/api/naver-place', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Missing name' });

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    const searchUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(name)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    const link = await page.evaluate(() => {
      const el = document.querySelector('a.place_bluelink, a.tit, a[href*="map.naver.com"]');
      return el?.href || '';
    });

    await browser.close();

    if (link) return res.json({ url: link });
    else return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('[Naver Place Error]', err);
    return res.status(500).json({ error: 'Internal Error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy server listening at http://localhost:${PORT}`);
});
