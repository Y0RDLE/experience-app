// src/ExperienceForm.jsx
import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { fetchHtmlFromUrl } from './fetchHtml';
import { parseReviewNoteText } from './parseReviewNoteText';
import { parseGANGNAMText } from './parseGANGNAMText';
import { parseStorynText } from './parseStorynText';
import { parseAnnouncementDate } from './utils/parseDates';
import { toast } from 'react-toastify';

const leisureSites = ['스토리앤미디어', '미블', '디너의여왕', '레뷰'];

// 날짜 문자열에 연도 추가 (MM.DD 또는 M/D -> YYYY-MM-DD)
const addYearIfNeeded = (dateStr, fallbackYear) => {
  const m = dateStr.match(/\d{1,2}[\/.]\d{1,2}$/);
  if (m) {
    const [mo, da] = dateStr.split(/[\/.]/).map(v => v.padStart(2, '0'));
    const yr = fallbackYear || new Date().getFullYear();
    return `${yr}-${mo}-${da}`;
  }
  return dateStr;
};

// 이전 값이 비어 있을 때만 파싱 결과 적용
const mergeParsedData = (prev, parsed) => {
  const out = {};
  for (const k in parsed) {
    if ((!prev[k] || prev[k] === '') && parsed[k]) out[k] = parsed[k];
  }
  return out;
};

// 체험 기간 종료일 계산 (사이트별 고정 일수)
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

// "시·도 시·군·구" 두 단계만 추출 (예: 서울 중랑)
const extractDistrict = address => {
  const parts = address.split(/\s+/);
  if (parts.length < 2) return address;
  const province = parts[0].replace(/(특별시|광역시|도)$/, '');
  const district = parts[1].replace(/(시|군|구)$/, '');
  return `${province} ${district}`;
};

export default function ExperienceForm({ selectedExperience, onSelect }) {
  const [formData, setFormData] = useState({
    company: '',
    region: '',
    regionFull: '',
    siteUrl: '',
    siteName: '',
    naverPlaceUrl: '',
    announcementDate: '',
    experienceStart: '',
    experienceEnd: '',
    competitionRatio: '',
    selected: null,            // null = 대기, true = 선정, false = 미선정
    providedItems: '',
    additionalInfo: '',
    extractedText: '',
    type: 'home',
    isClip: false,
    isFamily: false,
    isPetFriendly: false,
    isLeisure: false,
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

  // 편집 모드: 기존 데이터 로드, 신규 모드: 초기화
  useEffect(() => {
    if (selectedExperience) {
      setFormData({ ...selectedExperience });
    } else {
      resetForm();
    }
  }, [selectedExperience]);

  // 복붙 추출란에 URL/텍스트 붙여넣기 시 자동 처리 (onBlur에서도 동작)
  useEffect(() => {
    const t = formData.extractedText.trim();
    if (!t) return;
    if (/^https?:\/\//.test(t)) {
      if (/naver\.me|map\.naver\.com/.test(t)) {
        handleNaverUrl(t, true);
      } else {
        setFormData(p => ({ ...p, siteUrl: t, extractedText: '' }));
        setTimeout(() => handleSiteUrl(t, true), 0);
      }
    }
  }, [formData.extractedText]);

  // 업체명 입력 시 네이버 플레이스 자동 채움
  useEffect(() => {
    if (!formData.company) return;
    const endpoint = process.env.NEXT_PUBLIC_NAVER_PLACE_FUNCTION_URL || '/api/naver-place';
    fetch(`${endpoint}?name=${encodeURIComponent(formData.company)}`)
      .then(res => res.json())
      .then(({ url }) => {
        if (url && url !== formData.naverPlaceUrl) {
          setFormData(p => ({ ...p, naverPlaceUrl: url }));
        }
      })
      .catch(err => console.error('네이버 플레이스 fetch 에러:', err));
  }, [formData.company]);

  // 수동 복붙 텍스트 파싱
  const handleManualExtract = () => {
    const t = formData.extractedText.trim();
    if (!t) return;
    if (/^https?:\/\//.test(t)) {
      if (/naver\.me|map\.naver\.com/.test(t)) return handleNaverUrl(t, false);
      return handleSiteUrl(t, false);
    }

    setIsLoading(true);
    const l = t.toLowerCase();
    let siteName = '';
    let parsed = {};

    if (l.includes('리뷰노트')) {
      siteName = '리뷰노트';
      parsed = parseReviewNoteText(t);
    } else if (l.includes('강남맛집')) {
      siteName = '강남맛집';
      parsed = parseGANGNAMText(t);
    } else if (l.includes('스토리앤미디어')) {
      siteName = '스토리앤미디어';
      parsed = parseStorynText(t);
    }

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

    // 신규 등록 시에만 isLeisure 자동 설정
    const isLeisureAuto = leisureSites.includes(siteName);

    setFormData(prev => ({
      ...prev,
      ...mergeParsedData(prev, parsed),
      siteName: prev.siteName || siteName,
      experienceStart: prev.experienceStart || start,
      experienceEnd: prev.experienceEnd || autoEnd,
      announcementDate: prev.announcementDate || ann,
      regionFull: full,
      region: short,
      extractedText: '',
      ...(selectedExperience ? {} : { isLeisure: isLeisureAuto }),
    }));
    setIsLoading(false);

    toast.success('요들의 외침! 수동 분석 완료! 🧠', {
      toastId: 'manual-extract',
      autoClose: 2000
    });
  };

  // 사이트 URL 자동 파싱
  const handleSiteUrl = async (url, showLoading) => {
    if (showLoading) setIsLoading(true);
    const match = Object.entries(siteMapping).find(([p]) => url.startsWith(p));
    const siteName = match?.[1] || '';
    const raw = await fetchHtmlFromUrl(url);
    const txt = raw.text || '';
    let parsed = {};

    if (siteName === '리뷰노트') parsed = parseReviewNoteText(txt);
    else if (siteName === '강남맛집') parsed = parseGANGNAMText(txt);
    else if (siteName === '스토리앤미디어') parsed = parseStorynText(txt);

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
      siteUrl: url,
      siteName: prev.siteName || siteName,
      ...mergeParsedData(prev, parsed),
      experienceStart: prev.experienceStart || start,
      experienceEnd: prev.experienceEnd || autoEnd,
      announcementDate: prev.announcementDate || ann,
      regionFull: full,
      region: short,
      extractedText: '',
      ...(selectedExperience ? {} : { isLeisure: isLeisureAuto }),
    }));
    if (showLoading) setIsLoading(false);

    toast.success('요들의 외침! 사이트 URL 자동 처리 완료!', {
      toastId: 'site-url',
      autoClose: 2000
    });
  };

  // 네이버 플레이스 URL 처리
  const handleNaverUrl = (url, showLoading) => {
    if (showLoading) setIsLoading(true);
    setFormData(prev => ({ ...prev, naverPlaceUrl: url, extractedText: '' }));
    if (showLoading) setIsLoading(false);

    toast.success('요들의 외침! 네이버 플레이스 URL 자동 처리 완료!', {
      toastId: 'naver-url',
      autoClose: 2000
    });
  };

  // 폼 입력 변경 핸들러
  const handleChange = e => {
    const { name, type, checked, value } = e.target;

    // 선정 체크박스: checked → true, 해제 → null
    if (name === 'selected' && type === 'checkbox') {
      setFormData(prev => ({ ...prev, selected: checked ? true : null }));
      return;
    }

    // 발표일: 다음날체험시작 자동 채움
    if (name === 'announcementDate') {
      const d = new Date(value);
      d.setDate(d.getDate() + 1);
      const iso = d.toISOString().split('T')[0];
      const end = getExperienceEnd(formData.siteName, iso);
      setFormData(prev => ({
        ...prev,
        announcementDate: value,
        experienceStart: prev.experienceStart || iso,
        experienceEnd: prev.experienceEnd || end,
      }));
      return;
    }

    // 체험시작일: 종료일 자동 채움
    if (name === 'experienceStart') {
      const end = getExperienceEnd(formData.siteName, value);
      setFormData(prev => ({ ...prev, experienceStart: value, experienceEnd: end }));
      return;
    }

    // siteUrl 직접 입력 시: 파싱 없이 값만
    if (name === 'siteUrl') {
      setFormData(prev => ({ ...prev, siteUrl: value }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // 저장 / 수정 처리
  const handleSubmit = async e => {
    e.preventDefault();
    const payload = {
      ...formData,
      selected: formData.selected === true ? true : null
    };

    if (!payload.naverPlaceUrl) {
      toast.error('요들의 외침! 네이버 플레이스 URL이 필요합니다!', {
        toastId: 'submit-error',
        autoClose: 2000
      });
      return;
    }

    try {
      if (selectedExperience) {
        await updateDoc(doc(db, 'experiences', selectedExperience.id), payload);
        toast.success('요들의 외침! 수정됨! 🙌', {
          toastId: 'submit-success',
          autoClose: 2000
        });
      } else {
        await addDoc(collection(db, 'experiences'), payload);
        toast.success('요들의 외침! 저장됨! 🎉', {
          toastId: 'submit-success',
          autoClose: 2000
        });
      }
      onSelect(null);
      resetForm();
    } catch {
      toast.error('요들의 외침! 다시 시도해! 😞', {
        toastId: 'submit-fail',
        autoClose: 2000
      });
    }
  };

  // 미선정 처리
  const handleUnselected = async () => {
    const payload = { ...formData, selected: false };
    try {
      if (selectedExperience) {
        await updateDoc(doc(db, 'experiences', selectedExperience.id), payload);
      } else {
        await addDoc(collection(db, 'experiences'), payload);
      }
      toast.success('요들의 외침! 🛑 미선정 처리 완료!', {
        toastId: 'unselect',
        autoClose: 2000
      });
      onSelect(null);
      resetForm();
    } catch {
      toast.error('요들의 외침! 다시 시도해! 😞', {
        toastId: 'unselect-fail',
        autoClose: 2000
      });
    }
  };

  // 완료 처리
  const handleComplete = async () => {
    const payload = { ...formData, selected: '완료' };
    try {
      await updateDoc(doc(db, 'experiences', selectedExperience.id), payload);
      toast.success('요들의 외침! 완료 처리되었습니다! ✍', {
        toastId: 'complete',
        autoClose: 2000
      });
      onSelect(null);
      resetForm();
    } catch {
      toast.error('요들의 외침! 완료 처리 실패!', {
        toastId: 'complete-fail',
        autoClose: 2000
      });
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      company: '',
      region: '',
      regionFull: '',
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
    });
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
        {/* 입력 필드 */}
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
                className="p-3 rounded shadow-sm bg-white focus:ring-accentOrange"
              />
            </div>
          ))}
        </div>

        {/* 복붙 추출란 */}
        <div>
          <label className="font-semibold mb-1 block">복붙 추출란</label>
          <textarea
            name="extractedText"
            value={formData.extractedText}
            onChange={handleChange}
            onBlur={handleManualExtract}
            placeholder="URL 또는 복붙 텍스트"
            className="w-full h-40 p-3 bg-yellow-100 text-xs rounded"
          />
        </div>

        {/* 옵션 체크박스 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            ['선정됨','selected'],
            ['클립형','isClip'],
            ['가족용','isFamily'],
            ['반려동물','isPetFriendly'],
            ['여가형','isLeisure'],
          ].map(([label,name]) => (
            <label key={name} className="flex items-center gap-2">
              <input
                type="checkbox"
                name={name}
                checked={formData[name]===true}
                onChange={handleChange}
                className="rounded"
              />
              {label}
            </label>
          ))}
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleUnselected}
            className="bg-gray-300 px-4 py-1 rounded"
          >
            미선정
          </button>
          {selectedExperience && formData.selected===true && (
            <button
              type="button"
              onClick={handleComplete}
              className="bg-green-500 px-4 py-1 rounded text-white"
            >
              완료
            </button>
          )}
          <button
            type="submit"
            className="bg-accentOrange px-6 py-2 rounded text-white"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  );
}
