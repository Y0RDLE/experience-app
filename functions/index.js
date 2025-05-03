// functions/index.js

import functions from 'firebase-functions';
import puppeteer from 'puppeteer';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({ origin: true })); // ✅ CORS 허용

// 🔥 /api/naver-place 경로로 통일
app.get('/api/naver-place', async (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).json({ error: 'name 파라미터가 필요합니다.' });

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    const searchUrl = `https://map.naver.com/v5/search/${encodeURIComponent(name)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    // 잠깐 대기 (내부 데이터 로딩 시간)
    await new Promise(resolve => setTimeout(resolve, 3000));

    const result = await page.evaluate(() => {
      const a = document.querySelector("a[href^='https://map.naver.com/v5/entry']");
      return a ? a.href : null;
    });

    await browser.close();

    if (!result) {
      return res.status(404).json({ error: '네이버 플레이스 결과 없음' });
    }

    return res.status(200).json({ url: result });
  } catch (err) {
    console.error('🔥 크롤링 실패:', err);
    return res.status(500).json({ error: '서버 내부 오류' });
  }
});

// 🔥 Firebase에 등록되는 엔드포인트 이름
export const api = functions.https.onRequest(app);
