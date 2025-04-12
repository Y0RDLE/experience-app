import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { fetchHtmlFromUrl } from './fetchHtml';
import { parseExperiencePeriod, parseAnnouncementDate } from './utils/parseDates';
import { parseReviewNoteText } from './parseReviewNoteText';
import { parseGangnamText } from './parseGANGNAMText';
import { toast } from 'react-toastify';

// addYearIfNeeded: MM.DD 형식을 YYYY-MM-DD로 변환 (월, 일이 두 자리)
const addYearIfNeeded = (dateStr, fallbackYear) => {
  const match = dateStr.match(/^(\d{1,2})[\/.](\d{1,2})$/);
  if (match) {
    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
    const year = fallbackYear || new Date().getFullYear();
    return `${year}-${month}-${day}`;
  }
  return dateStr;
};

// mergeParsedData: 기존 formData의 값이 비어있을 때만 파서 결과 덮어쓰기
const mergeParsedData = (prev, parsed) => {
  const newData = {};
  Object.keys(parsed).forEach(key => {
    if ((!prev[key] || prev[key] === '') && parsed[key]) {
      newData[key] = parsed[key];
    }
  });
  return newData;
};

function ExperienceForm({ selectedExperience }) {
  const [formData, setFormData] = useState({
    company: '',
    region: '',
    siteUrl: '',
    siteName: '',
    naverPlaceUrl: '',
    announcementDate: '',
    experienceStart: '',
    experienceEnd: '',
    competitionRatio: '',
    selected: null,
    providedItems: '',
    additionalInfo: '',
    extractedText: '',
    type: 'home',
    isClip: false,
    isFamily: false,
    isPetFriendly: false,
    isLeisure: false,
    regionFull: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const siteMapping = {
    'https://xn--939au0g4vj8sq.net/': '강남맛집',
    'https://storyn.kr/': '스토리앤미디어',
    'https://www.reviewnote.co.kr/': '리뷰노트',
    'https://reviewplace.co.kr/': '리뷰플레이스',
    'https://popomon.com/': '포포몬',
    'https://chvu.co.kr/': '체험뷰',
    'https://dinnerqueen.net/': '디너의여왕',
    'https://revu.net/': '레뷰',
    'https://mrble.net/': '미블',
  };

  const getExperienceEnd = (site, startDateStr) => {
    if (!startDateStr) return '';
    const startDate = new Date(startDateStr);
    let days = 0;
    switch (site) {
      case '강남맛집': days = 21; break;
      case '리뷰노트': days = 13; break;
      case '디너의여왕': days = 14; break;
      case '레뷰': days = 19; break;
      case '스토리앤미디어': days = 20; break;
      case '미블': days = 11; break;
      default: return '';
    }
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    return endDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (selectedExperience) {
      setFormData(prev => ({ ...prev, ...selectedExperience }));
    }
  }, [selectedExperience]);

  useEffect(() => {
    if (formData.company && !formData.naverPlaceUrl) {
      fetch(`/api/naver-place?name=${encodeURIComponent(formData.company)}`)
        .then(res => res.json())
        .then(({ url }) => {
          if (url) {
            setFormData(prev => ({ ...prev, naverPlaceUrl: url }));
          }
        })
        .catch(err => console.error('네이버 플레이스 자동 연결 실패:', err));
    }
  }, [formData.company]);

  const handleManualExtract = () => {
    const text = formData.extractedText?.trim();
    if (!text) return;
    if (/^https?:\/\//.test(text)) {
      if (/naver\.me|map\.naver\.com/i.test(text)) {
        handleNaverUrl(text, { showLoading: false });
      } else {
        handleSiteUrl(text, { showLoading: false });
      }
      return;
    }
    setIsLoading(true);
    const lowered = text.toLowerCase();
    let siteName = '';
    let parsed = {};
    if (lowered.includes('reviewnote') || lowered.includes('리뷰노트')) {
      siteName = '리뷰노트';
      parsed = parseReviewNoteText(text);
    } else if (lowered.includes('강남맛집') || lowered.includes('939au0g4vj8sq')) {
      siteName = '강남맛집';
      parsed = parseGangnamText(text);
    }
    let experienceStart = '', experienceEnd = '', announcementDate = '';
    if (parsed.experiencePeriod) {
      const periodArray = parsed.experiencePeriod.split('~').map(s => s.trim());
      if (periodArray.length === 2) {
        const fallbackYear = formData.announcementDate 
          ? formData.announcementDate.split('-')[0] 
          : new Date().getFullYear();
        experienceStart = addYearIfNeeded(periodArray[0], fallbackYear);
        experienceEnd = addYearIfNeeded(periodArray[1], fallbackYear);
      } else {
        console.error('experiencePeriod does not split into 2 parts:', parsed.experiencePeriod);
      }
    }
    if (parsed.announcementDate) {
      announcementDate = parseAnnouncementDate(parsed.announcementDate);
    }
    if (!announcementDate && experienceStart) {
      const start = new Date(experienceStart);
      start.setDate(start.getDate() - 1);
      announcementDate = start.toISOString().split('T')[0];
    }
    const autoEnd = getExperienceEnd(siteName, experienceStart);
    setFormData(prev => ({
      ...prev,
      ...mergeParsedData(prev, parsed),
      region: parsed.region || prev.region,
      regionFull: parsed.regionFull || prev.regionFull,
      siteName: !prev.siteName ? siteName : prev.siteName,
      experienceStart: experienceStart || prev.experienceStart,
      experienceEnd: experienceEnd || autoEnd || prev.experienceEnd,
      announcementDate: announcementDate || prev.announcementDate,
      extractedText: '',
    }));
    setIsLoading(false);
    toast.success('요들의 외침! 수동 분석 완료! 🧠', { autoClose: 2000 });
  };

  const handleSiteUrl = async (url, options = { showLoading: false }) => {
    if (options.showLoading) setIsLoading(true);
    const matched = Object.entries(siteMapping).find(([prefix]) => url.startsWith(prefix));
    const detectedSiteName = matched?.[1] || '';
    const raw = await fetchHtmlFromUrl(url);
    const rawText = raw.text || '';
    let parsed = {};
    if (detectedSiteName === '리뷰노트') {
      parsed = parseReviewNoteText(rawText);
    } else if (detectedSiteName === '강남맛집') {
      parsed = parseGangnamText(rawText);
    }
    let experienceStart = '', experienceEnd = '', announcementDate = '';
    if (parsed.experiencePeriod) {
      const periodArray = parsed.experiencePeriod.split('~').map(s => s.trim());
      if (periodArray.length === 2) {
        const fallbackYear = formData.announcementDate 
          ? formData.announcementDate.split('-')[0] 
          : new Date().getFullYear();
        experienceStart = addYearIfNeeded(periodArray[0], fallbackYear);
        experienceEnd = addYearIfNeeded(periodArray[1], fallbackYear);
      } else {
        console.error('experiencePeriod does not split into 2 parts:', parsed.experiencePeriod);
      }
    }
    if (parsed.announcementDate) {
      announcementDate = parseAnnouncementDate(parsed.announcementDate);
    }
    const autoEnd = getExperienceEnd(detectedSiteName, experienceStart);
    setFormData(prev => ({
      ...prev,
      siteUrl: url,
      siteName: !prev.siteName ? detectedSiteName : prev.siteName,
      ...mergeParsedData(prev, parsed),
      experienceStart: experienceStart || prev.experienceStart,
      experienceEnd: experienceEnd || autoEnd || prev.experienceEnd,
      announcementDate: announcementDate || prev.announcementDate,
      extractedText: '',
    }));
    if (options.showLoading) setIsLoading(false);
    toast.success('사이트 URL 자동 처리 완료!', { autoClose: 2000 });
  };

  const handleNaverUrl = (url, options = { showLoading: false }) => {
    if (options.showLoading) setIsLoading(true);
    setFormData(prev => ({
      ...prev,
      naverPlaceUrl: url,
      extractedText: '',
    }));
    if (options.showLoading) setIsLoading(false);
    toast.success('네이버 플레이스 URL 자동 처리 완료!', { autoClose: 2000 });
  };

  const handleChange = async (e) => {
    const { name, type, value, checked } = e.target;
    if (name === 'selected' && type === 'checkbox') {
      setFormData(prev => ({ ...prev, selected: checked ? true : false }));
      return;
    }
    if (name === 'announcementDate') {
      const nextDay = new Date(value);
      nextDay.setDate(nextDay.getDate() + 1);
      const isoStart = nextDay.toISOString().split('T')[0];
      const autoEnd = getExperienceEnd(formData.siteName, isoStart);
      setFormData(prev => ({
        ...prev,
        announcementDate: value,
        experienceStart: prev.experienceStart || isoStart,
        experienceEnd: prev.experienceEnd || autoEnd,
      }));
      return;
    }
    if (name === 'experienceStart') {
      const autoEnd = getExperienceEnd(formData.siteName, value);
      setFormData(prev => ({ ...prev, experienceStart: value, experienceEnd: autoEnd }));
      return;
    }
    if (name === 'siteUrl') {
      setIsLoading(true);
      const matched = Object.entries(siteMapping).find(([prefix]) => value.startsWith(prefix));
      const detectedSiteName = matched?.[1] || '';
      const raw = await fetchHtmlFromUrl(value);
      const rawText = raw.text || '';
      let parsed = {};
      if (detectedSiteName === '리뷰노트') {
        parsed = parseReviewNoteText(rawText);
      } else if (detectedSiteName === '강남맛집') {
        parsed = parseGangnamText(rawText);
      }
      let experienceStart = '', experienceEnd = '', announcementDate = '';
      if (parsed.experiencePeriod) {
        const periodArray = parsed.experiencePeriod.split('~').map(s => s.trim());
        if (periodArray.length === 2) {
          const fallbackYear = formData.announcementDate 
            ? formData.announcementDate.split('-')[0] 
            : new Date().getFullYear();
          experienceStart = addYearIfNeeded(periodArray[0], fallbackYear);
          experienceEnd = addYearIfNeeded(periodArray[1], fallbackYear);
        } else {
          console.error('experiencePeriod does not split into 2 parts:', parsed.experiencePeriod);
        }
      }
      if (parsed.announcementDate) {
        announcementDate = parseAnnouncementDate(parsed.announcementDate);
      }
      const autoEnd = getExperienceEnd(detectedSiteName, experienceStart);
      setFormData(prev => ({
        ...prev,
        siteUrl: value,
        siteName: !prev.siteName ? detectedSiteName : prev.siteName,
        ...mergeParsedData(prev, parsed),
        experienceStart: experienceStart || prev.experienceStart,
        experienceEnd: experienceEnd || autoEnd || prev.experienceEnd,
        announcementDate: announcementDate || prev.announcementDate,
        extractedText: '',
      }));
      setIsLoading(false);
      toast.success('사이트 URL 자동 처리 완료!', { autoClose: 2000 });
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedData = selectedExperience
        ? { ...formData, selected: formData.selected === false ? '대기' : formData.selected }
        : { ...formData, selected: '대기' };
      if (!updatedData.naverPlaceUrl) {
        toast.error('요들의 외침! 100% 일치하는 네이버 플레이스가 없는디용??🤨 직접 입력해!', { autoClose: 2000 });
        return;
      }
      if (selectedExperience) {
        const ref = doc(db, 'experiences', selectedExperience.id);
        await updateDoc(ref, updatedData);
        toast.success('요들의 외침! 수정됨! 🙌', { autoClose: 2000 });
      } else {
        await addDoc(collection(db, 'experiences'), updatedData);
        toast.success('요들의 외침! 저장됨! 🎉', { autoClose: 2000 });
      }
      resetForm();
    } catch (error) {
      console.error('저장 실패:', error);
      toast.error('요들의 외침! 다시 시도해! 😞', { autoClose: 2000 });
    }
  };

  const handleUnselected = async () => {
    try {
      const dataToSave = { ...formData, selected: '미선정' };
      if (selectedExperience) {
        const ref = doc(db, 'experiences', selectedExperience.id);
        await updateDoc(ref, dataToSave);
        toast.success('요들의 외침! 🛑 미선정 ㅆㅑ갈!', { autoClose: 2000 });
      } else {
        await addDoc(collection(db, 'experiences'), dataToSave);
        toast.success('요들의 외침! 🛑 미선정 ㅆㅑ갈!', { autoClose: 2000 });
      }
      resetForm();
    } catch (error) {
      console.error('저장 실패:', error);
      toast.error('요들의 외침! 다시 시도해! 😞', { autoClose: 2000 });
    }
  };

  // "숙제끗" 버튼은 selectedExperience가 존재하고,
  // 그리고 formData.selected 값이 boolean true (즉, 선정 처리된 상태)인 경우에만 표시합니다.
  const handleComplete = async () => {
    try {
      const dataToSave = { ...formData, selected: '완료' };
      if (selectedExperience) {
        const ref = doc(db, 'experiences', selectedExperience.id);
        await updateDoc(ref, dataToSave);
        toast.success('요들의 외침! 숙제끗! ✍', { autoClose: 2000 });
      }
      resetForm();
    } catch (error) {
      console.error('요들의 외침! 리뷰 완료 처리 실패!:', error);
      toast.error('요들의 외침! 리뷰 완료 처리 실패!', { autoClose: 2000 });
    }
  };

  const resetForm = () => {
    setFormData({
      company: '',
      region: '',
      siteUrl: '',
      siteName: '',
      naverPlaceUrl: '',
      announcementDate: '',
      experienceStart: '',
      experienceEnd: '',
      competitionRatio: '',
      selected: null,
      providedItems: '',
      additionalInfo: '',
      extractedText: '',
      type: 'home',
      isClip: false,
      isFamily: false,
      isPetFriendly: false,
      isLeisure: false,
      regionFull: '',
    });
  };

  return (
    <div className="bg-white p-8 shadow-[0_6px_20px_rgba(0,0,0,0.1)] rounded-[20px] w-full space-y-6">
      {isLoading && (
        <>
          <div className="w-full">
            <div className="h-1 bg-accentOrange animate-pulse"></div>
          </div>
          <div className="flex items-center justify-center py-3">
            <div className="w-5 h-5 border-2 border-accentOrange border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-accentOrange text-sm">불러오는 중...</span>
          </div>
        </>
      )}
      <form onSubmit={handleSubmit} className="space-y-6 text-sm">
        <div className="grid grid-cols-2 gap-4">
          {[
            ['업체명', 'company'],
            ['지역', 'region'],
            ['제공내역', 'providedItems'],
            ['기타 사항', 'additionalInfo'],
            ['사이트 URL', 'siteUrl'],
            ['네이버 플레이스 링크', 'naverPlaceUrl'],
            ['발표일', 'announcementDate'],
            ['경쟁률', 'competitionRatio'],
            ['체험 시작일', 'experienceStart'],
            ['체험 종료일', 'experienceEnd']
          ].map(([label, name]) => (
            <div key={name} className="flex flex-col">
              <label className="font-semibold mb-1">{label}</label>
              <input
                type={(name === 'announcementDate' || name === 'experienceStart' || name === 'experienceEnd') ? 'date' : 'text'}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                required={['company', 'region', 'providedItems'].includes(name)}
                className="p-3 rounded-md shadow-sm bg-white focus:ring-accentOrange focus:outline-none"
              />
              {name === 'additionalInfo' && (
                <small className="text-gray-500">★선택사항, 입력시 회색으로 표기</small>
              )}
            </div>
          ))}
        </div>
        <div>
          <label className="font-semibold mb-1 block">복붙 추출란</label>
          <textarea
            name="extractedText"
            value={formData.extractedText}
            onChange={handleChange}
            onBlur={handleManualExtract}
            placeholder="단순 복붙 자동 채움 기능은 강남맛집만 구현 (URL 붙여넣으면 자동 처리)"
            className="w-full h-40 p-3 bg-yellow-100 text-xs rounded-md shadow-inner font-mono"
          />
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {[
            ['선정됨', 'selected'],
            ['클립형', 'isClip'],
            ['가족용', 'isFamily'],
            ['무쓰오케이', 'isPetFriendly'],
            ['여가형', 'isLeisure']
          ].map(([label, name]) => (
            <label key={name} className="flex items-center gap-2">
              <input
                type="checkbox"
                name={name}
                checked={formData[name] === true}
                onChange={handleChange}
                className="w-4 h-4"
              />
              {label}
            </label>
          ))}
        </div>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleUnselected}
            className="bg-gray-300 text-gray-700 px-[18px] py-1 rounded-md hover:opacity-90 text-sm"
          >
            미선정
          </button>
          {selectedExperience && formData.selected === true && (
            <button
              type="button"
              onClick={handleComplete}
              className="bg-green-500 text-white px-[18px] py-2 rounded-md hover:opacity-90 text-sm"
            >
              숙제끗
            </button>
          )}
          <button
            type="submit"
            className="bg-accentOrange text-white px-6 py-2 rounded-md hover:opacity-90 text-sm"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  );
}

export default ExperienceForm;
