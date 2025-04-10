// ✅ /routes/naverPlace.js
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.get('/naver-place', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: '업체명이 없습니다' });

  try {
    const encoded = encodeURIComponent(name);
    const url = `https://map.naver.com/v5/api/search?query=${encoded}&type=all`;

    const result = await fetch(url, {
      headers: {
        'referer': 'https://map.naver.com/',
        'user-agent': 'Mozilla/5.0',
      },
    });

    const data = await result.json();
    const places = data?.result?.place?.list || [];

    const exact = places.find((place) => place.name?.trim() === name.trim());

    if (exact) {
      const placeUrl = `https://map.naver.com/v5/entry/place/${exact.id}?query=${encoded}`;
      return res.json({ url: placeUrl });
    } else {
      return res.json({ url: '' });
    }
  } catch (err) {
    console.error('네이버 플레이스 크롤링 실패:', err);
    return res.status(500).json({ error: '크롤링 실패' });
  }
});

export default router;


// ✅ server.js (수정된 부분만 요약)
import naverPlaceRoute from './routes/naverPlace.js';
app.use('/api', naverPlaceRoute);


// ✅ ExperienceForm.jsx 내부 useEffect 추가
useEffect(() => {
  if (formData.company && !formData.naverPlaceUrl) {
    fetch(`/api/naver-place?name=${encodeURIComponent(formData.company)}`)
      .then((res) => res.json())
      .then(({ url }) => {
        if (url) {
          setFormData((prev) => ({ ...prev, naverPlaceUrl: url }));
        }
      })
      .catch((err) => console.error('네이버 플레이스 자동 연결 실패:', err));
  }
}, [formData.company]);
