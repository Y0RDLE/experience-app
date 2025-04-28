// crawlStorynCampaign.js
import fetch from 'node-fetch';
import cheerio from 'cheerio';

async function crawlStorynCampaign(cp_id) {
  const url = `https://storyn.kr/review_campaign.php?cp_id=${cp_id}`;
  try {
    const response = await fetch(url);
    const html = await response.text();

    // 디버깅용: HTML의 처음 300자를 출력합니다.
    console.log('HTML 일부:', html.slice(0, 300));

    // Cheerio로 HTML 파싱
    const $ = cheerio.load(html);

    // 예시: 캠페인 제목 추출 (실제 선택자는 페이지 구조에 맞게 수정해야 함)
    const title = $('h1.campaign-title').text().trim() || '제목 없음';

    // 예시: 체험기간 추출 (실제 선택자는 페이지 구조에 맞게 수정)
    const periodText = $('div.campaign-period').text().trim() || '기간 정보 없음';

    // 필요시 추가 정보 추출
    const providedItems = $('div.provided-items').text().trim() || '제공 내역 없음';

    // 원하는 데이터를 객체로 구성
    const campaignData = {
      title,
      period: periodText,
      providedItems
    };

    console.log('캠페인 데이터:', campaignData);
    return campaignData;
  } catch (error) {
    console.error('크롤링 실패:', error);
  }
}

// 예시 실행 (cp_id를 1744350127로 지정)
crawlStorynCampaign(1744350127);
