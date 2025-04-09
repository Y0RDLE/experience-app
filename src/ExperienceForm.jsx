// ✅ ExperienceForm 완전 신규버전 - 모든 기존 기능 + 수동 자동입력 감지 포함

import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { fetchHtmlFromUrl } from './fetchHtml';
import { parseExperiencePeriod, parseAnnouncementDate } from './utils/parseDates';
import { extractFromText } from './extractFromText';
import { toast } from 'react-toastify';

function ExperienceForm({ selectedExperience }) {
  const [formData, setFormData] = useState({
    company: '', region: '', siteUrl: '', siteName: '',
    naverPlaceUrl: '', announcementDate: '', experienceStart: '', experienceEnd: '',
    competitionRatio: '', selected: null, providedItems: '', additionalInfo: '',
    extractedText: '', type: 'home', isClip: false, isFamily: false, isPetFriendly: false, isLeisure: false,
  });

  const siteMapping = {
    'https://xn--939au0g4vj8sq.net/': '강남맛집',
    'https://storyn.kr/': '스토리앤미디어',
    'https://www.reviewnote.co.kr/': '리뷰노트',
    'https://reviewplace.co.kr/': '리뷰플레이스',
    'https://popomon.com/': '포포몬',
    'https://chvu.co.kr/': '체험뷰',
    'https://dinnerqueen.net/': '디너의여왕',
    'https://revu.net/': '레뷰',
    'https://meble.co.kr/': '미블',
  };

  const naverPlaceMapping = {
    '다이닝몽드웨딩파티 다산': 'https://map.naver.com/p/entry/place/1209816440?placePath=%2Fmenu%2Flist',
    '리뷰노트': 'https://naver.me/example2',
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
      setFormData((prev) => ({ ...prev, ...selectedExperience }));
    }
  }, [selectedExperience]);

  const handleManualExtract = () => {
    const text = formData.extractedText?.trim();
    const lowered = text.toLowerCase();
    const isReviewNote =
      formData.siteName === '리뷰노트' ||
      lowered.includes('reviewnote') ||
      lowered.includes('리뷰노트') ||
      lowered.includes('대한민국 최초 무료체험단');

    if (isReviewNote && text) {
      const parsed = extractFromText(text);
      let experienceStart = '', experienceEnd = '', announcementDate = '';

      if (parsed.experiencePeriod) {
        [experienceStart, experienceEnd] = parseExperiencePeriod(parsed.experiencePeriod);
      }
      if (parsed.announcementDate) {
        announcementDate = parseAnnouncementDate(parsed.announcementDate);
      }

      const autoEnd = getExperienceEnd('리뷰노트', experienceStart);

      setFormData((prev) => ({
        ...prev,
        siteName: '리뷰노트',
        ...parsed,
        experienceStart: experienceStart || prev.experienceStart,
        experienceEnd: experienceEnd || autoEnd || prev.experienceEnd,
        announcementDate: announcementDate || prev.announcementDate,
      }));

      toast.success('요들의 외침! 수동 공격이 자동 인식됨! 🧠', { autoClose: 2000 });
    }
  };

  const handleChange = async (e) => {
    const { name, type, value, checked } = e.target;

    if (name === 'selected' && type === 'checkbox') {
      setFormData((prev) => ({ ...prev, selected: checked ? true : false }));
      return;
    }

    if (name === 'announcementDate') {
      const nextDay = new Date(value);
      nextDay.setDate(nextDay.getDate() + 1);
      const isoStart = nextDay.toISOString().split('T')[0];
      setFormData((prev) => {
        const site = prev.siteName;
        const autoEnd = getExperienceEnd(site, isoStart);
        return {
          ...prev,
          announcementDate: value,
          experienceStart: prev.experienceStart || isoStart,
          experienceEnd: prev.experienceEnd || autoEnd,
        };
      });
      return;
    }

    if (name === 'experienceStart') {
      const site = formData.siteName;
      const autoEnd = getExperienceEnd(site, value);
      setFormData((prev) => ({
        ...prev,
        experienceStart: value,
        experienceEnd: prev.experienceEnd || autoEnd,
      }));
      return;
    }

    if (name === 'siteUrl') {
      const matched = Object.entries(siteMapping).find(([prefix]) => value.startsWith(prefix));
      const detectedSiteName = matched?.[1] || '';
      const raw = await fetchHtmlFromUrl(value);
      const parsed = extractFromText(raw.text || '');

      let experienceStart = '', experienceEnd = '', announcementDate = '';
      if (parsed.experiencePeriod) {
        [experienceStart, experienceEnd] = parseExperiencePeriod(parsed.experiencePeriod);
      }
      if (parsed.announcementDate) {
        announcementDate = parseAnnouncementDate(parsed.announcementDate);
      }
      const autoEnd = getExperienceEnd(detectedSiteName, experienceStart);

      setFormData((prev) => ({
        ...prev,
        siteUrl: value,
        siteName: detectedSiteName,
        ...parsed,
        experienceStart,
        experienceEnd: experienceEnd || autoEnd,
        announcementDate,
        extractedText: raw.text || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let updatedData;
      if (selectedExperience) {
        updatedData = {
          ...formData,
          selected: formData.selected === false ? '대기' : formData.selected,
        };
      } else {
        updatedData = { ...formData, selected: '대기' };
        if (!updatedData.naverPlaceUrl) {
          const normalizedCompany = updatedData.company.trim();
          const autoLink = naverPlaceMapping[normalizedCompany];
          if (autoLink) {
            updatedData.naverPlaceUrl = autoLink;
          } else {
            toast.error('요들의 외침! 업체명과 100% 일치하는 네이버 플레이스가 없는디용?? 직접 입력해! 😞', { autoClose: 2000 });
            return;
          }
        }
      }
      if (!selectedExperience && updatedData.selected === '대기') {
        toast.warn('요들의 외침! ‘선정대기’로 저장됨! 🎯', { autoClose: 2000 });
      }
      if (selectedExperience) {
        const ref = doc(db, 'experiences', selectedExperience.id);
        await updateDoc(ref, updatedData);
        toast.success('요들의 외침! 체험단 정보가 수정됨! 🙌', { autoClose: 2000 });
      } else {
        await addDoc(collection(db, 'experiences'), updatedData);
        toast.success('요들의 외침! 체험단 정보가 저장됨! 🎉', { autoClose: 2000 });
      }
      resetForm();
    } catch (error) {
      console.error('저장 실패:', error);
      toast.error('요들의 외침! 다시 시도해! 😞', { autoClose: 2000 });
    }
  };

  const handleUnselected = async () => {
    try {
      const dataToSave = { ...formData, selected: null };
      if (selectedExperience) {
        const ref = doc(db, 'experiences', selectedExperience.id);
        await updateDoc(ref, dataToSave);
        toast.success('요들의 외침! ‘미선정’ 처리됨! 🛑', { autoClose: 2000 });
      } else {
        await addDoc(collection(db, 'experiences'), dataToSave);
        toast.success('요들의 외침! ‘미선정’으로 저장됨! ✅', { autoClose: 2000 });
      }
      resetForm();
    } catch (error) {
      console.error('저장 실패:', error);
      toast.error('요들의 외침! 다시 시도해! 😞', { autoClose: 2000 });
    }
  };

  const resetForm = () => {
    setFormData({
      company: '', region: '', siteUrl: '', siteName: '',
      naverPlaceUrl: '', announcementDate: '', experienceStart: '', experienceEnd: '',
      competitionRatio: '', selected: null, providedItems: '', additionalInfo: '',
      extractedText: '', type: 'home', isClip: false, isFamily: false, isPetFriendly: false, isLeisure: false,
    });
  };

  return (
    <div className="bg-white p-8 shadow-[0_6px_20px_rgba(0,0,0,0.1)] rounded-[20px] w-full space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6 text-sm">
        <div className="grid grid-cols-2 gap-4">
          {[['업체명', 'company'], ['지역', 'region'], ['제공내역', 'providedItems'], ['기타 사항', 'additionalInfo'], ['사이트 URL', 'siteUrl'], ['네이버 플레이스 링크', 'naverPlaceUrl'], ['발표일', 'announcementDate'], ['경쟁률', 'competitionRatio'], ['체험 시작일', 'experienceStart'], ['체험 종료일', 'experienceEnd']].map(([label, name]) => (
            <div key={name} className="flex flex-col">
              <label className="font-semibold mb-1">{label}</label>
              <input
                type={name.includes('Date') ? 'date' : 'text'}
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
          <label className="font-semibold mb-1 block">HTML 원문</label>
          <textarea
            name="extractedText"
            value={formData.extractedText}
            onChange={handleChange}
            onBlur={handleManualExtract}
            className="w-full h-40 p-3 bg-yellow-100 text-xs rounded-md shadow-inner font-mono"
          />
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          {[['선정됨', 'selected'], ['클립형', 'isClip'], ['가족용', 'isFamily'], ['무쓰오케이', 'isPetFriendly'], ['여가형', 'isLeisure']].map(([label, name]) => (
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
            className="bg-gray-300 text-gray-700 py-1 rounded-md hover:opacity-90 text-sm"
            style={{ paddingLeft: '19px', paddingRight: '19px' }}
          >
            미선정
          </button>
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