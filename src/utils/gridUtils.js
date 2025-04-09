// utils/gridUtils.js

const getTextWidth = (text, font = '14px Pretendard') => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text).width;
  };
  
  export const getMaxGridTemplateColumns = (items) => {
    let maxCompany = 0;
    let maxRegion = 0;
    let maxSite = 0;
    let maxAnnouncement = 0;
    let maxPeriod = 0;
    let maxCompetition = 0;
  
    items.forEach((exp) => {
      const companyText = exp.company || '';
      const tagText = [
        exp.isClip ? '클립' : '',
        exp.isFamily ? '가족용' : '',
        exp.isPetFriendly ? '반려동물' : '',
      ]
        .filter(Boolean)
        .join(' ');
      const fullCompany = `${companyText} ${tagText}`.trim();
  
      const regionText = exp.region || '';
      const siteText = exp.siteName || '';
      const announcementText = exp.announcementDate
        ? new Date(exp.announcementDate).toLocaleDateString('ko-KR', {
            month: 'numeric',
            day: 'numeric',
          })
        : '';
      const periodText =
        exp.experienceStart && exp.experienceEnd
          ? `${new Date(exp.experienceStart).toLocaleDateString('ko-KR', {
              month: 'numeric',
              day: 'numeric',
            })} ~ ${new Date(exp.experienceEnd).toLocaleDateString('ko-KR', {
              month: 'numeric',
              day: 'numeric',
            })}`
          : '';
      const competitionText = exp.competitionRatio || '-';
  
      maxCompany = Math.max(maxCompany, getTextWidth(fullCompany));
      maxRegion = Math.max(maxRegion, getTextWidth(regionText));
      maxSite = Math.max(maxSite, getTextWidth(siteText));
      maxAnnouncement = Math.max(maxAnnouncement, getTextWidth(announcementText));
      maxPeriod = Math.max(maxPeriod, getTextWidth(periodText));
      maxCompetition = Math.max(maxCompetition, getTextWidth(competitionText));
    });
  
    const total =
      maxCompany + maxRegion + maxSite + maxAnnouncement + maxPeriod + maxCompetition;
  
    const toFr = (value) => `${(value / total).toFixed(3)}fr`;
  
    return [
      toFr(maxCompany),
      toFr(maxRegion),
      toFr(maxSite),
      toFr(maxAnnouncement),
      toFr(maxPeriod),
      toFr(maxCompetition),
    ].join(' ');
  };
  