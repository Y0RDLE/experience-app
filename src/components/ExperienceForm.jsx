import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { parseReviewNoteText } from '../../server/parsers/parseReviewNoteText';
import { parseYellowPanelText } from '../../server/parsers/parseYellowPanelText';
import { parseGANGNAMText     } from '../../server/parsers/parseGANGNAMText';
import { parseAnnouncementDate } from '../utils/parseDates';
import { toast } from 'react-toastify';

const leisureSites = ['스토리앤미디어', '미블', '디너의여왕', '레뷰'];

const mergeParsedData = (prev, parsed) => {
  const out = {};
  for (const key in parsed) {
    if ((!prev[key] || prev[key] === '') && parsed[key]) out[key] = parsed[key];
  }
  return out;
};

const getExperienceEnd = (site, start) => {
  if (!start) return '';
  const durations = {
    '강남맛집': 21,
    '리뷰노트': 13,
    '리뷰플레이스': 14,
    '디너의여왕': 14,
    '레뷰': 19,
    '스토리앤미디어': 20,
    '미블': 11
  };
  const date = new Date(start);
  date.setDate(date.getDate() + (durations[site] || 0));
  return date.toISOString().split('T')[0];
};

const extractDistrict = address => {
  const parts = address.split(/\s+/);
  if (parts.length < 2) return address;
  const prov = parts[0].replace(/(특별시|광역시|도)$/, '');
  const dist = parts[1].replace(/(시|군|구)$/, '');
  return `${prov} ${dist}`;
};

const getSiteNameFromUrl = url => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    const mapping = {
      'reviewnote.co.kr': '리뷰노트',
      'reviewplace.co.kr': '리뷰플레이스',
      'xn--939au0g4vj8sq.net': '강남맛집',
      'storyn.kr': '스토리앤미디어',
      'mrblog.net': '미블',
      'dinnerqueen.net': '디너의여왕',
      'revu.net': '레뷰',
      'popomon.com': '포포몬'
    };
    for (const domain in mapping) {
      if (host === domain || host.endsWith(`.${domain}`)) return mapping[domain];
    }
  } catch {}
  return '';
};

export default function ExperienceForm({ selectedExperience, onSelect }) {
  const [formData, setFormData] = useState({
    company: '', region: '', regionFull: '', siteUrl: '', siteName: '', naverPlaceUrl: '',
    announcementDate: '', experienceStart: '', experienceEnd: '', competitionRatio: '', selected: null,
    providedItems: '', additionalInfo: '', extractedText: '', type: 'home',
    isClip: false, isFamily: false, isPetFriendly: false, isLeisure: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleManualExtract = () => {
  const text = formData.extractedText.trim();
  if (!text) return;

  // HTML 포함 여부 검사
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(text);
  let parsed;

  if (isHtml) {
    // HTML이면 리뷰노트 파서
    parsed = parseReviewNoteText(text);
  }
  else if (formData.siteName === '강남맛집' || /캠페인 신청기간/.test(text)) {
    // 강남맛집 페이지 또는 신청기간 키워드가 있으면 강남맛집 파서
    parsed = parseGANGNAMText(text);
    parsed.siteName = '강남맛집';  // siteName도 강남맛집으로 고정
  }
  else {
    // 그 외는 옐로우 패널 파서
    parsed = parseYellowPanelText(text);
  }

  // 기존 필드 정제 로직
  if (parsed.company)       parsed.company       = parsed.company.trim();
  if (parsed.region) {
    const [prov, raw] = parsed.region.split('/');
    const dist = raw ? raw.replace(/(시|군|구)$/, '') : '';
    parsed.regionFull = parsed.regionFull || parsed.region;
    parsed.region     = [prov, dist].filter(Boolean).join(' ');
  }
  if (parsed.providedItems)     parsed.providedItems     = parsed.providedItems.trim();
  if (parsed.competitionRatio)  parsed.competitionRatio  = parsed.competitionRatio.replace('/', ':');
  if (parsed.announcementDate)  parsed.announcementDate  = parseAnnouncementDate(parsed.announcementDate);
  if (parsed.experiencePeriod) {
    const [startRaw, endRaw] = parsed.experiencePeriod.split('~').map(s => s.trim().split(' ')[0]);
    parsed.experienceStart = parseAnnouncementDate(startRaw);
    parsed.experienceEnd   = parseAnnouncementDate(endRaw);
  }

  const merged = mergeParsedData(formData, parsed);
  if (!merged.siteName) merged.siteName = '리뷰노트';

  setFormData(prev => ({ ...prev, ...merged }));
  toast.success('요들의 외침! 텍스트 자동 추출 완료! ✂️', { toastId: 'manual-extract' });
};

  useEffect(() => {
    if (selectedExperience) setFormData({ ...selectedExperience }); else resetForm();
  }, [selectedExperience]);

  const handleSiteUrl = async (url, showLoading) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch(`/api/autoExtract?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const siteName = data.siteName || getSiteNameFromUrl(url);
      setFormData(prev => ({
        ...prev, siteUrl: url, siteName, ...data, extractedText: '', ...(selectedExperience ? {} : { isLeisure: leisureSites.includes(siteName) })
      }));
      toast.success('요들의 외침! 사이트 URL 자동 처리 완료! 🧠', { toastId: 'site-url' });
    } catch {
      toast.error('자동 처리 실패 ㅆㅑ갈!', { toastId: 'site-url-fail' });
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleChange = e => {
    const { name, type, checked, value } = e.target;
    if (name === 'siteUrl') {
      setFormData(prev => ({ ...prev, siteUrl: value, siteName: getSiteNameFromUrl(value) }));
      return;
    }
    if (name === 'announcementDate') {
      const iso = parseAnnouncementDate(value);
      const end = getExperienceEnd(formData.siteName || '리뷰노트', iso);
      setFormData(prev => ({ ...prev, announcementDate: iso, experienceStart: iso, experienceEnd: end }));
      return;
    }
    if (name === 'experienceStart') {
      const end = getExperienceEnd(formData.siteName || '리뷰노트', value);
      setFormData(prev => ({ ...prev, experienceStart: value, experienceEnd: end }));
      return;
    }
    if (type === 'checkbox') setFormData(prev => ({ ...prev, [name]: checked }));
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault(); setIsLoading(true); toast.dismiss();
    const payload = { ...formData, selected: formData.selected === true ? true : null };
    if (!payload.naverPlaceUrl) { toast.error('요들의 외침! 네이버 플레이스 언제 알아서 기입할 거야 ㅆㅃ!!', { toastId: 'submit-error' }); setIsLoading(false); return; }
    try { if (selectedExperience) await updateDoc(doc(db, 'experiences', selectedExperience.id), payload); else await addDoc(collection(db, 'experiences'), payload); } catch { setIsLoading(false); return; }
    toast.success(selectedExperience ? '요들의 외침! 수정끗! 🙌' : '요들의 외침! 저장끗! 🎉', { toastId: 'submit-success' }); onSelect(null); resetForm(); setIsLoading(false);
  };

  const handleComplete = async () => { toast.dismiss(); await updateDoc(doc(db, 'experiences', selectedExperience.id), { ...formData, selected: '완료' }); toast.success('요들의 외침! 숙제끗! ✍', { toastId: 'complete' }); onSelect(null); resetForm(); };
  const handleUnselected = async () => { toast.dismiss(); setIsLoading(true); const payload = { ...formData, selected: false }; if (selectedExperience) await updateDoc(doc(db, 'experiences', selectedExperience.id), payload); else await addDoc(collection(db, 'experiences'), payload); toast.success('요들의 외침! 🛑 미선정 ㅆ ㅑ갈!', { toastId: 'unselect' }); onSelect(null); resetForm(); setIsLoading(false); };

  const resetForm = () => { setFormData({ company: '', region: '', regionFull: '', siteUrl: '', siteName: '', naverPlaceUrl: '', announcementDate: '', experienceStart: '', experienceEnd: '', competitionRatio: '', selected: null, providedItems: '', additionalInfo: '', extractedText: '', type: 'home', isClip: false, isFamily: false, isPetFriendly: false, isLeisure: false }); setIsLoading(false); };

  useEffect(() => {
    // 네이버 플레이스 링크 자동완성 (필요 없으면 삭제)
    const fetchNaverPlaceUrl = async () => {
      if (formData.company && !formData.naverPlaceUrl) {
        try {
          const res = await fetch(`http://localhost:5100/viewtalk-a3835/us-central1/api/naver-place?name=${encodeURIComponent(formData.company)}`);
          const data = await res.json();
          if (data.url) setFormData(prev => ({ ...prev, naverPlaceUrl: data.url }));
        } catch {}
      }
    };
    const delay = setTimeout(fetchNaverPlaceUrl, 800);
    return () => clearTimeout(delay);
  }, [formData.company, formData.naverPlaceUrl]);
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
                type={['announcementDate', 'experienceStart', 'experienceEnd'].includes(name) ? 'date' : 'text'}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                required={['company', 'region', 'providedItems'].includes(name)}
                className="p-3 rounded shadow-sm bg-white focus:ring-accentOrange"
              />
            </div>
          ))}
        </div>
        <div>
          <label className="font-semibold mb-1 block">복붙 추출란</label>
          <textarea
            name="extractedText"
            value={formData.extractedText}
            onChange={handleChange}
            onBlur={() => {
              const t = formData.extractedText.trim();
              if (!t) return;
              if (/^https?:\/\//.test(t)) {
                handleSiteUrl(t, false);
              } else {
                handleManualExtract();
              }
            }}
            placeholder="URL 또는 복붙 텍스트"
            className="w-full h-40 p-3 bg-yellow-100 text-xs rounded"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            ['선정됨', 'selected'],
            ['클립형', 'isClip'],
            ['가족용', 'isFamily'],
            ['무쓰오케이', 'isPetFriendly'],
            ['여가형', 'isLeisure'],
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
