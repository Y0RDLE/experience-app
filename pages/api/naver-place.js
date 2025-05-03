// functions/index.js 또는 Firebase에서 사용하는 endpoint 라우트
import functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { getNaverPlaceUrl } from './utils/naverCrawler.js';

const app = express();
app.use(cors({ origin: true }));

app.get('/api/naver-place', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Missing name' });

  try {
    const url = await getNaverPlaceUrl(name);
    if (url) return res.status(200).json({ url });
    else return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('[Naver Place Error]', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

export const api = functions.https.onRequest(app);
