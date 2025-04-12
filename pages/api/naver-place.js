// 📁 pages/api/naver-place.js

import { getNaverPlaceUrl } from '../../utils/naverCrawler';

export default async function handler(req, res) {
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
}
