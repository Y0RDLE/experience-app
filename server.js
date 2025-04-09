// server.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 4000;

app.use(cors());

app.get('/api/fetch-html', async (req, res) => {
  const targetUrl = req.query.url;
  console.log('📡 요청받은 URL:', targetUrl);

  try {
    const response = await fetch(targetUrl);
    const html = await response.text();

    console.log('✅ HTML 일부:', html.slice(0, 300)); // 디버깅용

    const result = {
      company: '',
      region: '',
      providedItems: '',
      experiencePeriod: '',
      announcementDate: '',
      competitionRatio: '',
      text: html, // 👈 클라이언트용 원본 전달
    };

    res.json(result);
  } catch (error) {
    console.error('❌ HTML 요청 실패:', error);
    res.status(500).json({ error: '서버 오류 발생' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy server listening at http://localhost:${PORT}`);
});
