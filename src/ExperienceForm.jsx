import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
// import { fetchHtmlFromUrl } from './fetchHtml'; // 더 이상 사용하지 않음
import { parseReviewNoteText } from '../server/parsers/parseReviewNoteText';
import { parseAnnouncementDate } from './utils/parseDates';
import { toast } from 'react-toastify';

const leisureSites = ['스토리앤미디어', '미블', '디너의여왕', '레뷰'];

const addYearIfNeeded = (dateStr, fallbackYear) => {
  const m = dateStr.match(/\d{1,2}[\/.]\d{1,2}$/);
  if (m) {
    const [mo, da] = dateStr.split(/[\/.]/).map(v => v.padStart(2, '0'));
    const yr = fallbackYear || new Date().getFullYear();
    return `${yr}-${mo}-${da}`;
  }
  return dateStr;
};

const mergeParsedData = (prev, parsed) => {
  const out = {};
  for (const k in parsed) {
    if ((!prev[k] || prev[k] === '') && parsed[k]) out[k] = parsed[k];
  }
  return out;
};

const getExperienceEnd = (site, start) => {
  if (!start) return '';
  const map = {
    '강남맛집': 21,
    '리뷰노트': 13,
    '디너의여왕': 14,
    '레뷰': 19,
    '스토리앤미디어': 20,
    '미블': 11
  };
  const d = new Date(start);
  d.setDate(d.getDate() + (map[site] || 0));
  return d.toISOString().split('T')[0];
};

const extractDistrict = address => {
  const parts = address.split(/\s+/);
  if (parts.length < 2) return address;
  const province = parts[0].replace(/(특별시|광역시|도)$/, '');
  const district = parts[1].replace(/(시|군|구)$/, '');
  return `${province} ${district}`;
};

export default function ExperienceForm({ selectedExperience, onSelect }) {
  const [formData, setFormData] = useState({
    company: '', region: '', regionFull: '', siteUrl: '', siteName: '', naverPlaceUrl: '',
    announcementDate: '', experienceStart: '', experienceEnd: '', competitionRatio: '',
    selected: null, providedItems: '', additionalInfo: '', extractedText: '', type: 'home',
    isClip: false, isFamily: false, isPetFriendly: false, isLeisure: false,
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

  useEffect(() => {
    if (selectedExperience) setFormData({ ...selectedExperience });
    else resetForm();
  }, [selectedExperience]);

  useEffect(() => {
    const t = formData.extractedText.trim();
    if (!t) return;
    if (/^https?:\/\//.test(t)) {
      if (/naver\.me|map\.naver\.com/.test(t)) handleNaverUrl(t, true);
      else {
        setFormData(p => ({ ...p, siteUrl: t, extractedText: '' }));
        setTimeout(() => handleSiteUrl(t, true), 0);
      }
    }
  }, [formData.extractedText]);

  useEffect(() => {
    if (!formData.company) return;
    const endpoint = process.env.NEXT_PUBLIC_NAVER_PLACE_FUNCTION_URL || '/api/naver-place';
    fetch(`${endpoint}?name=${encodeURIComponent(formData.company)}`)
      .then(res => res.json())
      .then(({ url }) => {
        if (url && url !== formData.naverPlaceUrl) setFormData(p => ({ ...p, naverPlaceUrl: url }));
      })
      .catch(err => console.error('네이버 플레이스 fetch 에러:', err));
  }, [formData.company]);

  const handleManualExtract = () => {
    const t = formData.extractedText.trim();
    if (!t) return;
    if (/^https?:\/\//.test(t)) {
      if (/naver\.me|map\.naver\.com/.test(t)) return handleNaverUrl(t, false);
      return handleSiteUrl(t, false);
    }
    setIsLoading(true);
    const parsed = parseReviewNoteText(t);
    const siteName = '리뷰노트';
    const [start] = parsed.experiencePeriod?.split('~').map(s => addYearIfNeeded(s.trim())) || [];
    let ann = parsed.announcementDate ? parseAnnouncementDate(parsed.announcementDate) : '';
    if (!ann && start) {
      const d = new Date(start);
      d.setDate(d.getDate() - 1);
      ann = d.toISOString().split('T')[0];
    }
    const autoEnd = getExperienceEnd(siteName, start);
    const full = parsed.regionFull || '';
    const short = full ? extractDistrict(full) : parsed.region || '';
    const isLeisureAuto = leisureSites.includes(siteName);

    setFormData(prev => ({
      ...prev,
      ...mergeParsedData(prev, parsed),
      siteName,
      experienceStart: prev.experienceStart || start,
      experienceEnd: prev.experienceEnd || autoEnd,
      announcementDate: prev.announcementDate || ann,
      regionFull: full,
      region: short,
      extractedText: '',
      ...(selectedExperience ? {} : { isLeisure: isLeisureAuto })
    }));
    setIsLoading(false);
    toast.success('요들의 외침! 수동 분석 완료! 🧠', { toastId: 'manual-extract', autoClose: 2000 });
  };

  const handleSiteUrl = async (url, showLoading) => {
    if (showLoading) setIsLoading(true);
    try {
      const resp = await fetch(`/api/autoExtract?url=${encodeURIComponent(url)}`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      const siteName = data.siteName || formData.siteName;
      setFormData(prev => ({
        ...prev,
        siteUrl: url,
        siteName,
        ...data,
        extractedText: '',
        ...(selectedExperience ? {} : { isLeisure: leisureSites.includes(siteName) })
      }));
      toast.success('요들의 외침! 사이트 URL 자동 처리 완료! 🧠', { toastId: 'site-url', autoClose: 2000 });
    } catch (err) {
      console.error('autoExtract 실패:', err);
      toast.error('자동 처리 실패… 수동으로 입력해 주세요.', { toastId: 'site-url-fail' });
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleNaverUrl = (url, showLoading) => {
    if (showLoading) setIsLoading(true);
    setFormData(prev => ({ ...prev, naverPlaceUrl: url, extractedText: '' }));
    if (showLoading) setIsLoading(false);
    toast.success('요들의 외침! 네이버 플레이스 URL 자동 처리 완료! 🧠', { toastId: 'naver-url', autoClose: 2000 });
  };


  const handleChange = e => {
    const { name, type, checked, value } = e.target;
    if (name === 'selected' && type === 'checkbox') {
      setFormData(prev => ({ ...prev, selected: checked ? true : null }));
      return;
    }
    if (name === 'announcementDate') {
      const d = new Date(value);
      d.setDate(d.getDate() + 1);
      const iso = d.toISOString().split('T')[0];
      const end = getExperienceEnd(formData.siteName, iso);
      setFormData(prev => ({ ...prev, announcementDate: value, experienceStart: iso, experienceEnd: end }));
      return;
    }
    if (name === 'experienceStart') {
      const end = getExperienceEnd(formData.siteName, value);
      setFormData(prev => ({ ...prev, experienceStart: value, experienceEnd: end }));
      return;
    }
    if (name === 'siteUrl') {
      setFormData(prev => ({ ...prev, siteUrl: value }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    toast.dismiss();
    const payload = { ...formData, selected: formData.selected === true ? true : null };
    if (!payload.naverPlaceUrl) {
      toast.error('요들의 외침! 네이버 플레이스 URL 필요', { toastId: 'submit-error' });
      setIsLoading(false);
      return;
    }
    try {
      if (selectedExperience) await updateDoc(doc(db, 'experiences', selectedExperience.id), payload);
      else await addDoc(collection(db, 'experiences'), payload);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      return;
    }
    toast.success(selectedExperience ? '요들의 외침! 수정됨! 🙌' : '요들의 외침! 저장됨! 🎉', { toastId: 'submit-success' });
    onSelect(null);
    resetForm();
    setIsLoading(false);
  };

  const handleComplete = async () => {
    toast.dismiss();
    try {
      await updateDoc(doc(db, 'experiences', selectedExperience.id), { ...formData, selected: '완료' });
      toast.success('요들의 외침! 숙제끗! ✍', { toastId: 'complete' });
      onSelect(null);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnselected = async () => {
    toast.dismiss();
    const payload = { ...formData, selected: false };
    try {
      if (selectedExperience) await updateDoc(doc(db, 'experiences', selectedExperience.id), payload);
      else await addDoc(collection(db, 'experiences'), payload);
      toast.success('요들의 외침! 🛑 미선정 ㅆ ㅑ갈!', { toastId: 'unselect' });
      onSelect(null);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error('요들의 외침! 다시 시도해! 😞', { toastId: 'unselect-fail' });
    }
  };

  const resetForm = () => {
    setFormData({
      company: '', region: '', regionFull: '', siteUrl: '', siteName: '', naverPlaceUrl: '',
      announcementDate: '', experienceStart: '', experienceEnd: '', competitionRatio: '',
      selected: null, providedItems: '', additionalInfo: '', extractedText: '', type: 'home',
      isClip: false, isFamily: false, isPetFriendly: false, isLeisure: false,
    });
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-8 shadow rounded-[20px] w-full space-y-6">
      {isLoading && (
        <div className="space-y-2">
          <div className="h-1 bg-accentOrange animate-pulse" />
          <div className="flex justify-center items-center">
            <div className="w-5 h-5 border-2 border-accentOrange border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-accentOrange">불러오는 중...</span>
          </div>
        </div>
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
            ['체험 종료일', 'experienceEnd'],
          ].map(([label, name]) => (
            <div key={name} className="flex flex-col">
              <label className="font-semibold mb-1">{label}</label>
              <input
                type={['announcementDate','experienceStart','experienceEnd'].includes(name) ? 'date' : 'text'}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                required={['company','region','providedItems'].includes(name)}
                className="p-3 rounded shadow-sm bg-white focus:ring-accentOrange" />
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
            placeholder="URL 또는 복붙 텍스트"
            className="w-full h-40 p-3 bg-yellow-100 text-xs rounded" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            ['선정됨','selected'],
            ['클립형','isClip'],
            ['가족용','isFamily'],
            ['무쓰오케이','isPetFriendly'],
            ['여가형','isLeisure'],
          ].map(([label, name]) => (
            <label key={name} className="flex items-center gap-2">
              <input type="checkbox" name={name} checked={formData[name]} onChange={handleChange} className="rounded" />
              {label}
            </label>
          ))}
        </div>
        <div className="flex justify-between">
          <button type="button" onClick={handleUnselected} className="bg-gray-300 px-4 py-1 rounded">미선정</button>
          {selectedExperience && formData.selected === true && (
            <button type="button" onClick={handleComplete} className="bg-green-500 px-4 py-1 rounded text-white">완료</button>
          )}
          <button type="submit" className="bg-accentOrange px-6 py-2 rounded text-white">저장</button>
        </div>
      </form>
    </div>
  );
}
