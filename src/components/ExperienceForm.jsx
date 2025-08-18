// src/components/ExperienceForm.jsx
// 디너의여왕 우선 분류 강화 + 디여 텍스트(노란창 복붙)에서 제공/발표/기간/플레이스 URL까지 자동기입
// (팝업 메시지 원본 그대로 유지)

import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { parseReviewNoteText } from '../../server/parsers/parseReviewNoteText';
import { parseYellowPanelText } from '../../server/parsers/parseYellowPanelText';
import { parseGANGNAMText } from '../../server/parsers/parseGANGNAMText';
import { parseDINNERText } from '../../server/parsers/parseDINNERText';
import { parseAnnouncementDate } from '../utils/parseDates';
import { toast } from 'react-toastify';

// 발표일 → 체험 시작일 오프셋(일)
const START_OFFSET_BY_SITE = {
  '디너의여왕': 1,
  '스토리앤미디어': 1,
  '미블': 1
};

// 체험 종료일 계산: 시작일 + N일
const DURATIONS_BY_SITE = {
  '강남맛집': 21,
  '리뷰노트': 14,
  '리뷰플레이스': 16,
  '디너의여왕': 14,
  '레뷰': 19,
  '스토리앤미디어': 21,
  '미블': 12
};

const mergeParsedData = (prev, parsed) => {
  const out = {};
  for (const key in parsed) {
    if ((!prev[key] || prev[key] === '') && parsed[key]) out[key] = parsed[key];
  }
  return out;
};

const addDaysISO = (iso, days) => {
  if (!iso) return '';
  const d = new Date(iso);
  d.setDate(d.getDate() + (days || 0));
  return d.toISOString().split('T')[0];
};

const getExperienceEnd = (site, startISO) => {
  if (!startISO) return '';
  const days = DURATIONS_BY_SITE[site] ?? 0;
  return addDaysISO(startISO, days);
};

const extractDistrict = address => {
  const parts = (address || '').split(/\s+/);
  if (parts.length < 2) return address || '';
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

// 간단한 네이버 플레이스 URL 추출기
const extractNaverPlaceUrlFromText = (text = '') => {
  if (!text) return '';
  const patterns = [
    /https?:\/\/(?:m\.)?place\.naver\.com\/[^\s'"]+/i,
    /https?:\/\/map\.naver\.com\/[^\s'"]+/i,
    /https?:\/\/naver\.me\/[^\s'"]+/i,
    /https?:\/\/search\.naver\.com\/search\.nhn\?[^\s'"]*query=[^\s'"]*/i
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return '';
};

export default function ExperienceForm({ selectedExperience, onSelect }) {
  const [formData, setFormData] = useState({
    company: '', region: '', regionFull: '', siteUrl: '', siteName: '', naverPlaceUrl: '',
    announcementDate: '', experienceStart: '', experienceEnd: '', competitionRatio: '', selected: null,
    providedItems: '', additionalInfo: '', extractedText: '', type: 'home',
    isClip: false, isFamily: false, isPetFriendly: false, isLeisure: false,
    // 통일된 연장 플래그
    isExtended: false
  });
  const [isLoading, setIsLoading] = useState(false);

  // 마지막으로 처리한 텍스트(중복 처리 방지)
  const processedTextRef = useRef('');

  const setDatesByAnnouncement = (siteName, annISO) => {
    const offset = START_OFFSET_BY_SITE[siteName] ?? 0;
    const startISO = addDaysISO(annISO, offset);
    const endISO = getExperienceEnd(siteName, startISO);
    return { announcementDate: annISO, experienceStart: startISO, experienceEnd: endISO };
  };

  // === 분류 로직: 디너의여왕 우선 탐지(충돌 방지) ===
  const looksLikeDinner = (txt = '') =>
    /디너의여왕|dinnerqueen/i.test(txt) ||
    /결과\s*발표는/.test(txt) ||
    /체험&리뷰/.test(txt) ||
    /리뷰정보/.test(txt) ||
    /리뷰어\s*미션/.test(txt) ||
    /추가\s*안내사항/.test(txt) ||
    /캠페인\s*신청하기/.test(txt) ||
    /플레이스지도\s*url\s*:\s*https?:\/\//i.test(txt);

  const looksLikeGangnam = (txt = '') =>
    /강남맛집/.test(txt) || /캠페인\s*신청기간/.test(txt);

  // handleManualExtract: rawText를 인자로 받아 즉시 파싱하도록 변경
  const handleManualExtract = async (rawText = null) => {
    const raw = (rawText !== null) ? rawText.trim() : (formData.extractedText || '').trim();
    if (!raw) return;

    // 중복 처리 방지
    if (processedTextRef.current === raw) return;
    processedTextRef.current = raw;

    setIsLoading(true);
    let parsed = {};
    const isHtml = /<\/?[a-z][\s\S]*>/i.test(raw);

    // 사이트 우선순위 파싱
    if (looksLikeDinner(raw) || formData.siteName === '디너의여왕') {
      parsed = await parseDINNERText(raw);
      parsed.siteName = '디너의여왕';
    } else if (formData.siteName === '강남맛집' || looksLikeGangnam(raw)) {
      parsed = await parseGANGNAMText(raw);
      parsed.siteName = '강남맛집';
    } else if (isHtml) {
      parsed = await parseReviewNoteText(raw);
    } else {
      parsed = await parseYellowPanelText(raw);
    }

    // 네이버 플레이스 URL 자동 추출 보완
    if (!parsed.naverPlaceUrl) {
      const found = extractNaverPlaceUrlFromText(raw);
      if (found) parsed.naverPlaceUrl = found;
    }

    // 정제 및 기본 보정
    if (parsed.company) parsed.company = parsed.company.trim();

    if (parsed.regionFull && !parsed.region) {
      const parts = parsed.regionFull.split(/\s+/);
      const prov = (parts[0] || '').replace(/(특별시|광역시|도)$/, '');
      const dist = (parts[1] || '').replace(/(시|군|구)$/, '');
      parsed.region = [prov, dist].filter(Boolean).join(' ');
    } else if (parsed.region) {
      parsed.regionFull = parsed.regionFull || parsed.region;
      parsed.region = extractDistrict(parsed.region);
    }

    if (parsed.providedItems) parsed.providedItems = parsed.providedItems.trim();
    if (parsed.competitionRatio) parsed.competitionRatio = parsed.competitionRatio.replace('/', ':');

    // 날짜
    if (parsed.announcementDate) parsed.announcementDate = parseAnnouncementDate(parsed.announcementDate);

    if (parsed.experiencePeriod) {
      const [startRaw, endRaw] = parsed.experiencePeriod
        .split(/[~–—-]/)
        .map(s => s.trim().split(' ')[0]);
      parsed.experienceStart = parseAnnouncementDate(startRaw);
      parsed.experienceEnd = parseAnnouncementDate(endRaw);
    }

    const merged = mergeParsedData(formData, parsed);
    if (!merged.siteName) merged.siteName = '리뷰노트';

    // 디여: 발표만 있으면 다음날 시작 + 14일 종료
    if (merged.siteName === '디너의여왕') {
      const annISO = merged.announcementDate || formData.announcementDate;
      const hasRange = merged.experienceStart && merged.experienceEnd;
      if (annISO && !hasRange) {
        Object.assign(merged, setDatesByAnnouncement('디너의여왕', annISO));
      }
      // isLeisure 자동 토글 제거: 사용자가 수동으로 체크하도록 변경
    }

    // naverPlaceUrl 포맷 검증 ( 없거나 비정상 URL이면 공란 )
    if (merged.naverPlaceUrl && !/^https?:\/\//.test(merged.naverPlaceUrl)) merged.naverPlaceUrl = '';

    setFormData(prev => ({ ...prev, ...merged, extractedText: raw }));

    setIsLoading(false);

    // ==== 원본 팝업 메시지(복구) ====
    toast.success('요들의 외침! 텍스트 자동 추출 완료! ✂️', { toastId: 'manual-extract' });
  };

  useEffect(() => {
    if (selectedExperience) {
      // 기존에 extension 필드로 저장된 데이터가 있으면 isExtended로 보정해서 로드
      const normalized = {
        ...selectedExperience,
        isExtended: (selectedExperience.isExtended === true) || (selectedExperience.extension === true) || false
      };
      setFormData({ ...normalized });
    } else resetForm();
    // reset processed text when new selection
    processedTextRef.current = '';
  }, [selectedExperience]);

  const handleSiteUrl = async (url, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch(`/api/autoExtract?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const siteName = data.siteName || getSiteNameFromUrl(url);

      let patch = {};
      if (data.announcementDate) {
        const annISO = parseAnnouncementDate(data.announcementDate);
        patch = setDatesByAnnouncement(siteName || '리뷰노트', annISO);
      }

      // 네이버 플레이스 추출 보완
      if (!data.naverPlaceUrl) {
        const possible = extractNaverPlaceUrlFromText((data.extractedText || '') + '\n' + url);
        if (possible) data.naverPlaceUrl = possible;
      }

      setFormData(prev => ({
        ...prev,
        siteUrl: url,
        siteName,
        ...data,
        ...patch,
        extractedText: ''
        // isLeisure 자동 설정 제거: 사용자가 수동으로 제어
      }));
      // ==== 원본 팝업 메시지(복구) ====
      toast.success('요들의 외침! 사이트 URL 자동 처리 완료! 🧠', { toastId: 'site-url' });
    } catch {
      // ==== 원본 팝업 메시지(복구) ====
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
      const site = formData.siteName || '리뷰노트';
      const patch = setDatesByAnnouncement(site, iso);
      setFormData(prev => ({ ...prev, ...patch }));
      return;
    }

    if (name === 'experienceStart') {
      const site = formData.siteName || '리뷰노트';
      const end = getExperienceEnd(site, value);
      setFormData(prev => ({ ...prev, experienceStart: value, experienceEnd: end }));
      return;
    }

    if (type === 'checkbox') setFormData(prev => ({ ...prev, [name]: checked }));
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    toast.dismiss();

    // payload 만들기 전에 legacy 'extension' 필드 제거(있으면 마이그레이션 고려)
    const payload = { ...formData, selected: formData.selected === true ? true : null };
    if (payload.extension !== undefined) delete payload.extension;

    if (!payload.naverPlaceUrl) {
      // ==== 원본 팝업 메시지(복구) ====
      toast.error('요들의 외침! 네이버 플레이스 언제 알아서 기입할 거야 ㅆㅃ!!', { toastId: 'submit-error' });
      setIsLoading(false);
      return;
    }

    try {
      if (selectedExperience) {
        await updateDoc(doc(db, 'experiences', selectedExperience.id), payload);
      } else {
        await addDoc(collection(db, 'experiences'), payload);
      }
    } catch {
      setIsLoading(false);
      return;
    }

    // ==== 원본 팝업 메시지(복구) ====
    toast.success(selectedExperience ? '요들의 외침! 수정끗! 🙌' : '요들의 외침! 저장끗! 🎉', { toastId: 'submit-success' });
    onSelect(null);
    resetForm();
    setIsLoading(false);
  };

  const handleComplete = async () => {
    toast.dismiss();
    await updateDoc(doc(db, 'experiences', selectedExperience.id), { ...formData, selected: '완료' });
    // ==== 원본 팝업 메시지(복구) ====
    toast.success('요들의 외침! 숙제끗! ✍', { toastId: 'complete' });
    onSelect(null);
    resetForm();
  };

  const handleUnselected = async () => {
    toast.dismiss();
    setIsLoading(true);
    const payload = { ...formData, selected: false };
    if (payload.extension !== undefined) delete payload.extension;
    if (selectedExperience) await updateDoc(doc(db, 'experiences', selectedExperience.id), payload);
    else await addDoc(collection(db, 'experiences'), payload);
    // ==== 원본 팝업 메시지(복구) ====
    toast.success('요들의 외침! 🛑 미선정 ㅆ ㅑ갈!', { toastId: 'unselect' });
    onSelect(null);
    resetForm();
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      company: '', region: '', regionFull: '', siteUrl: '', siteName: '', naverPlaceUrl: '',
      announcementDate: '', experienceStart: '', experienceEnd: '', competitionRatio: '', selected: null,
      providedItems: '', additionalInfo: '', extractedText: '', type: 'home',
      isClip: false, isFamily: false, isPetFriendly: false, isLeisure: false,
      isExtended: false
    });
    setIsLoading(false);
    processedTextRef.current = '';
  };

  useEffect(() => {
    // 네이버 플레이스 자동완성(선택) — 필요 없으면 제거
    const fetchNaverPlaceUrl = async () => {
      if (formData.company && !formData.naverPlaceUrl) {
        try {
          const res = await fetch(
            `http://localhost:5100/viewtalk-a3835/us-central1/api/naver-place?name=${encodeURIComponent(formData.company)}`
          );
          const data = await res.json();
          if (data.url) setFormData(prev => ({ ...prev, naverPlaceUrl: data.url }));
        } catch {}
      }
    };
    const delay = setTimeout(fetchNaverPlaceUrl, 800);
    return () => clearTimeout(delay);
  }, [formData.company, formData.naverPlaceUrl]);

  // 붙여넣기 즉시 처리 핸들러
  const handlePaste = async (e) => {
    const pasted = e.clipboardData.getData('text/plain') || '';
    if (!pasted) return;
    // textarea에 붙여넣기 내용 반영
    setFormData(prev => ({ ...prev, extractedText: pasted }));

    // URL만 있는 경우 사이트 URL 처리
    const maybeUrl = (pasted.trim().split(/\s+/).find(token => /^https?:\/\//i.test(token)) || '').trim();
    const naverPlace = extractNaverPlaceUrlFromText(pasted);

    if (naverPlace) {
      // 네이버 플레이스가 포함되어 있으면 바로 채워넣기 (siteUrl은 원문 URL 칸과 별개)
      setFormData(prev => ({ ...prev, naverPlaceUrl: naverPlace }));
      // 추가로 파싱 시도 (문구도 함께 파싱)
      await handleManualExtract(pasted);
      return;
    }

    if (maybeUrl) {
      // 일반 사이트 URL이면 siteUrl로 처리해서 autoExtract API 호출
      await handleSiteUrl(maybeUrl, true);
      return;
    }

    // 일반 텍스트(노란창 등)인 경우 파서로 즉시 처리
    await handleManualExtract(pasted);
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
              const t = (formData.extractedText || '').trim();
              if (!t) return;
              // onBlur 시 이미 처리된 텍스트인지 체크
              if (processedTextRef.current === t) return;
              if (/^https?:\/\//.test(t)) {
                handleSiteUrl(t, false);
              } else {
                handleManualExtract(t);
              }
            }}
            onPaste={handlePaste}
            placeholder="URL 또는 복붙 텍스트"
            className="w-full h-40 p-3 bg-yellow-100 text-xs rounded"
          />
        </div>

        {/*
  체크박스 그리드 — 각 열별로 들여쓰기 조절 가능.
  colIndentPx: [leftCol, centerCol, rightCol] 형식으로 픽셀 단위로 지정하세요.
  - 0열: 왼쪽열, 1열: 가운데열, 2열: 오른쪽열
  예) [0, 12, 24] 은 가운데열 12px, 오른쪽열 24px 들여쓰기.
*/}
{(() => {
  const items = [
    ['선정', 'selected'],
    ['연장됨', 'isExtended'],
    ['무쓰오케이', 'isPetFriendly'],
    ['클립형', 'isClip'],
    ['가족용', 'isFamily'],
    ['여가형', 'isLeisure'],
  ];

  // 여기서 각 열의 들여쓰기(px)를 마음대로 조정하세요.
  // (원하면 'px' 대신 rem 값으로 바꿔도 됩니다: '0.75rem' 등)
  const colIndentPx = [2, 36, 45]; // [왼쪽, 가운데, 오른쪽]

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(([label, name], idx) => {
        const col = idx % 3; // 0:left, 1:center, 2:right
        const paddingLeft = colIndentPx[col] ? `${colIndentPx[col]}px` : undefined;

        return (
          <label
            key={name}
            className="flex items-center gap-2"
            style={{ paddingLeft }} // 열별 들여쓰기 적용 (가로만 변경)
          >
            <input
              type="checkbox"
              name={name}
              checked={!!formData[name]}
              onChange={handleChange}
              className="rounded"
            />
            {label}
          </label>
        );
      })}
    </div>
  );
})()}




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
