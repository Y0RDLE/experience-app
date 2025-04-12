// server.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 4000;

app.use(cors());

// HTML을 가져와 JSON으로 반환하는 프록시 엔드포인트
app.get('/api/fetch-html', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'url 파라미터가 필요합니다.' });
  }
  console.log('📡 요청받은 URL:', targetUrl);

  try {
    const response = await fetch(targetUrl, {
      // User-Agent 헤더를 추가하여 일반 브라우저 요청처럼 보이게 할 수 있습니다.
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
    console.log('✅ HTML 일부:', html.slice(0, 300)); // 디버깅용 출력

    // 각 사이트마다 구조와 사용하는 단어가 다르므로, 여기서
    // 완전한 파싱은 하지 않고 원본 HTML만 클라이언트에 전달합니다.
    // 클라이언트에서는 사이트별 파서 로직을 통해 필요한 데이터(회사, 지역, 체험기간, 발표일 등)를 추출합니다.
    const result = {
      // 기본적으로 미리 할당해두었지만, 필요에 따라 여기에 추가 데이터 가공도 가능
      company: '',
      region: '',
      providedItems: '',
      experiencePeriod: '',
      announcementDate: '',
      competitionRatio: '',
      text: html, // 원본 HTML
    };

    res.setHeader('Content-Type', 'application/json');
    res.json(result);
  } catch (error) {
    console.error('❌ HTML 요청 실패:', error);
    res.status(500).json({ error: '서버 오류 발생' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy server listening at http://localhost:${PORT}`);
});
