export const siteParsers = {
    'https://reviewplace.co.kr/': {
      extract: (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
  
        const company = doc.querySelector('.biz_info .name')?.textContent || '';
        const region = doc.querySelector('.biz_info .address')?.textContent || '';
        const providedItems = doc.querySelector('.product-info')?.textContent || '';
        const experiencePeriod = doc.querySelector('.recruit-date-wrap .date')?.textContent || '';
        const announcementDate = doc.querySelector('.announce-date-wrap .date')?.textContent || '';
        const competitionRatio = doc.querySelector('.user-info .applicants')?.textContent || '';
  
        return {
          company,
          region,
          providedItems,
          experiencePeriod,
          announcementDate,
          competitionRatio,
        };
      },
    },
  
    'https://www.reviewnote.co.kr/': {
      extract: (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
  
        const company = doc.querySelector('.name')?.textContent.trim() || '';
        const region = doc.querySelector('.addr')?.textContent.trim() || '';
        const providedItems = doc.querySelector('.campaign-product')?.textContent.trim() || '';
        const experiencePeriod = doc.querySelector('.info-table .period:nth-of-type(2)')?.textContent || '';
        const announcementDate = doc.querySelector('.info-table .date:nth-of-type(2)')?.textContent || '';
        const competitionRatio = doc.querySelector('.info-table .status strong')?.textContent || '';
  
        return {
          company,
          region,
          providedItems,
          experiencePeriod,
          announcementDate,
          competitionRatio,
        };
      },
    },
  
    'https://xn--939au0g4vj8sq.net/': {
  extract: (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const company = doc.querySelector('.biz-name')?.textContent.trim() || '';
    const region = doc.querySelector('.biz-addr')?.textContent.trim() || '';
    const providedItems = doc.querySelector('.product-desc')?.textContent.trim() || '';
    const experiencePeriod = doc.querySelector('.period-box .date-range')?.textContent.trim() || '';
    const announcementDate = doc.querySelector('.announce-box .announce-date')?.textContent.trim() || '';
    const competitionRatio = doc.querySelector('.entry-status')?.textContent.trim() || '';

    return {
      company,
      region,
      providedItems,
      experiencePeriod,
      announcementDate,
      competitionRatio,
    };
  },
},

  
    'https://www.mrblog.net/': {
      extract: (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
  
        const company = doc.querySelector('.company-info .title')?.textContent.trim() || '';
        const region = doc.querySelector('.company-info .address')?.textContent.trim() || '';
        const providedItems = doc.querySelector('.support-info')?.textContent.trim() || '';
        const experiencePeriod = doc.querySelector('.experience-period .date')?.textContent || '';
        const announcementDate = doc.querySelector('.schedule-box .announce')?.textContent || '';
        const competitionRatio = doc.querySelector('.summary-box .apply-status')?.textContent || '';
  
        return {
          company,
          region,
          providedItems,
          experiencePeriod,
          announcementDate,
          competitionRatio,
        };
      },
    },
  
    'https://popomon.com/': {
      extract: (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
  
        const company = doc.querySelector('.detail-header .title')?.textContent.trim() || '';
        const region = doc.querySelector('.location')?.textContent.trim() || '';
        const providedItems = doc.querySelector('.product-area')?.textContent.trim() || '';
        const experiencePeriod = doc.querySelector('.review-date')?.textContent || '';
        const announcementDate = doc.querySelector('.announce-area .date')?.textContent || '';
        const competitionRatio = doc.querySelector('.apply-count .current')?.textContent || '';
  
        return {
          company,
          region,
          providedItems,
          experiencePeriod,
          announcementDate,
          competitionRatio,
        };
      },
    },
  
    'https://storyn.kr/': {
      extract: (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
  
        const company = doc.querySelector('.biz_name')?.textContent.trim() || '';
        const region = doc.querySelector('.biz_addr')?.textContent.trim() || '';
        const providedItems = doc.querySelector('.gift')?.textContent.trim() || '';
        const experiencePeriod = doc.querySelector('.review-date')?.textContent || '';
        const announcementDate = doc.querySelector('.announce-date')?.textContent || '';
        const competitionRatio = doc.querySelector('.applicant-box .count')?.textContent || '';
  
        return {
          company,
          region,
          providedItems,
          experiencePeriod,
          announcementDate,
          competitionRatio,
        };
      },
    },
  
    'https://chvu.co.kr/': {
      extract: (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
  
        const company = doc.querySelector('.title .name')?.textContent.trim() || '';
        const region = doc.querySelector('.location')?.textContent.trim() || '';
        const providedItems = doc.querySelector('.support-info')?.textContent.trim() || '';
        const experiencePeriod = doc.querySelector('.review-date-box .date')?.textContent || '';
        const announcementDate = doc.querySelector('.recruit-box .announce')?.textContent || '';
        const competitionRatio = doc.querySelector('.applicants .number')?.textContent || '';
  
        return {
          company,
          region,
          providedItems,
          experiencePeriod,
          announcementDate,
          competitionRatio,
        };
      },
    },
  
    'https://dinnerqueen.net/': {
      extract: (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
  
        const company = doc.querySelector('.shop-info .title')?.textContent.trim() || '';
        const region = doc.querySelector('.shop-info .addr')?.textContent.trim() || '';
        const providedItems = doc.querySelector('.product-info')?.textContent.trim() || '';
        const experiencePeriod = doc.querySelector('.review-date')?.textContent || '';
        const announcementDate = doc.querySelector('.result-date')?.textContent || '';
        const competitionRatio = doc.querySelector('.applicant-info')?.textContent || '';
  
        return {
          company,
          region,
          providedItems,
          experiencePeriod,
          announcementDate,
          competitionRatio,
        };
      },
    },
  };
  