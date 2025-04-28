// server.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer';
import autoExtractRouter from './api/autoExtract.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// HTML Fetch Proxy
app.get('/api/fetch-html', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const text = await response.text();
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Naver Place Crawling
app.get('/api/naver-place', async (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).json({ error: 'Missing name parameter' });
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(`https://search.naver.com/search.naver?query=${encodeURIComponent(name)}`, { waitUntil: 'networkidle2' });
    const link = await page.evaluate(() => {
      const el = document.querySelector('a.place_bluelink, a.tit, a[href*="map.naver.com"]');
      return el?.href || '';
    });
    await browser.close();
    if (link) res.json({ url: link });
    else res.status(404).json({ error: 'Not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AutoExtract 라우터
app.use('/api', autoExtractRouter);

app.listen(PORT, () => {
  console.log(`✅ Server listening at http://localhost:${PORT}`);
});
