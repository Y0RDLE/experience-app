// crawlCampaign.js
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function crawlCampaign(url) {
  const browser = await puppeteer.launch(); // 필요에 따라 headless: false 옵션 추가 가능
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' }); // 페이지 로드 완료 대기

  // 페이지의 HTML을 가져옵니다.
  const html = await page.content();
  const $ = cheerio.load(html);

  // 아래 선택자는 대상 사이트의 HTML 구조에 맞게 수정합니다.
  const company = $('div.company-info > h1').text().trim() || '미확인 회사';
  const regionFull = $('div.address').text().trim() || '';
  const regionShort = regionFull.split(' ')[0] + ' ' + (regionFull.split(' ')[1] || '');
  const providedItems = $('div.provided-items').text().trim() || '';
  
  // 체험기간 텍스트(예: "4/12 ~ 4/25") 추출 - 실제 선택자를 수정해야 함.
  const experiencePeriod = $('div.period').text().trim() || '';
  // 발표일 텍스트 추출 (예: "4/11") - 실제 선택자를 수정
  const announcementDateRaw = $('div.announcement-date').text().trim() || '';

  // 기타 필요한 데이터 추출
  // ...

  await browser.close();

  return {
    company,
    region: regionShort,
    regionFull,
    providedItems,
    experiencePeriod,
    announcementDate: announcementDateRaw,
    // 기타 추출 필드
  };
}

// 예시 실행
crawlCampaign('https://storyn.kr/review_campaign.php?cp_id=1744350127')
  .then(data => {
    console.log('추출 데이터:', data);
    // 여기서 data를 백엔드 API로 전송하거나 Firestore에 저장하는 로직을 추가할 수 있습니다.
  })
  .catch(err => console.error('크롤링 실패:', err));
