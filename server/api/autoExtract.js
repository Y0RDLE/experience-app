import express from 'express';
import fetch from 'node-fetch';
import { load } from 'cheerio';
import { parseReviewNoteText }  from '../parsers/parseReviewNoteText.js';
import { parseGANGNAMText }     from '../parsers/parseGANGNAMText.js';
import { parseReviewPlaceText } from '../parsers/parseReviewPlaceText.js';
import { parseStorynText }      from '../parsers/parseStorynText.js';
import { parseGenericText }     from '../parsers/parseGenericText.js';

const router = express.Router();

// GET /api/autoExtract?url=<campaign_url>
router.get('/autoExtract', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  let html;
  try {
    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
    html = await resp.text();
  } catch (err) {
    console.error('[AutoExtract • fetch HTML error]', err);
    return res.status(500).json({ error: 'Failed to fetch page HTML' });
  }

  // Cheerio로 본문 텍스트나 HTML 로딩 (각 파서 내부에서 load 사용)
  try {
    let data;
    if (url.includes('reviewnote.co.kr')) {
      data = parseReviewNoteText(html);
    } else if (url.includes('xn--939au0g4vj8sq.net')) {
      data = parseGANGNAMText(html);
    } else if (url.includes('reviewplace.co.kr')) {
      data = parseReviewPlaceText(html);
    } else if (url.includes('storyn.kr')) {
      data = parseStorynText(html);
    } else {
      data = parseGenericText(html);
    }
    return res.json(data);
  } catch (err) {
    console.error('[AutoExtract • parse error]', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
