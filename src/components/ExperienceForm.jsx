// src/components/ExperienceForm.jsx
// 리뷰노트/강남맛집 모두 커버: 병렬 파싱 + 필드단 병합 + ★경쟁률/지역 최종 보정
import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { parseReviewNoteText } from '../../server/parsers/parseReviewNoteText';
import { parseYellowPanelText } from '../../server/parsers/parseYellowPanelText';
import { parseGANGNAMText } from '../../server/parsers/parseGANGNAMText';
import { parseDINNERText } from '../../server/parsers/parseDINNERText';
import { parseAnnouncementDate } from '../utils/parseDates';
import { toast } from 'react-toastify';

const START_OFFSET_BY_SITE = {
  '강남맛집': 1,
  '디너의여왕': 1,
  '스토리앤미디어': 1,
  '미블': 1
};

const DURATIONS_BY_SITE = {
  '강남맛집': 21,
  '리뷰노트': 14,
  '리뷰플레이스': 16,
  '디너의여왕': 14,
  '레뷰': 19,
  '스토리앤미디어': 21,
  '미블': 12,
  '체험뷰': 16,
};

const addDaysISO = (iso, days) => {
  if (!iso) return '';
  const d = new Date(iso);
  d.setDate(d.getDate() + (days || 0));
  return d.toISOString().split('T')[0];
};

// 종료일 = 시작일 포함 (기간-1)
const getExperienceEnd = (site, startISO) => {
  if (!startISO) return '';
  const days = DURATIONS_BY_SITE[site] ?? 0;
  if (!days) return '';
  return addDaysISO(startISO, days - 1);
};

// 지역 표준화
const formatRegion = (str) => {
  if (!str) return '';
  let s = String(str).replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
  const parts = s.split(/\s+/);
  const prov = (parts[0] || '').replace(/(특별시|광역시|도)$/,'');
  const dist = (parts[1] || '').replace(/(시|군|구)$/,'');
  return [prov, dist].filter(Boolean).join(' ');
};

// ★ 경쟁률 최후 보정
const normalizeCompetition = (txt) => {
  if (!txt) return '';
  const src = String(txt).replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ').trim();

  let m = src.match(/지원[^\d]*([\d,]+)\s*[\-–—:|/~]?\s*[^\d]*모집[^\d]*([\d,]+)\s*명?/i);
  if (m) return `${m[1].replace(/,/g,'')}:${m[2].replace(/,/g,'')}`;

  const sup = src.match(/지원[^\d]*([\d,]+)\s*명?/i);
  const rec = src.match(/모집[^\d]*([\d,]+)\s*명?/i);
  if (sup && rec) return `${sup[1].replace(/,/g,'')}:${rec[1].replace(/,/g,'')}`;

  const m2 = src.match(/(\d{1,3}(?:,\d{3})*)\s*\/\s*(\d{1,3}(?:,\d{3})*)/);
  if (m2 && /실시간\s*지원\s*현황|지원|모집|신청자/.test(src))
    return `${m2[1].replace(/,/g,'')}:${m2[2].replace(/,/g,'')}`;

  const m3 = src.match(/지원\s*[:\-]?\s*([\d,]+)[^\d]+모집\s*[:\-]?\s*([\d,]+)/i);
  if (m3) return `${m3[1].replace(/,/g,'')}:${m3[2].replace(/,/g,'')}`;

  const m4 = src.match(/^\s*(\d{1,3}(?:,\d{3})*)\s*[:\-]\s*(\d{1,3}(?:,\d{3})*)\s*$/);
  if (m4) return `${m4[1].replace(/,/g,'')}:${m4[2].replace(/,/g,'')}`;

  return '';
};

const detectSiteFromText = (txt = '') => {
  const t = String(txt || '');
  if (/디너의여왕|dinnerqueen\.net/i.test(t)) return '디너의여왕';
  if (/강남맛집|캠페인\s*신청기간|gangnammatzip/i.test(t)) return '강남맛집';
  if (/리뷰노트|reviewnote\.co\.kr/i.test(t) || /실시간\s*지원\s*현황|체험기간|리뷰어\s*발표/.test(t)) return '리뷰노트';
  return '';
};

const getSiteNameFromUrl = (url) => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    const map = {
      'reviewnote.co.kr': '리뷰노트',
      'reviewplace.co.kr': '리뷰플레이스',
      'xn--939au0g4vj8sq.net': '강남맛집',
      'storyn.kr': '스토리앤미디어',
      'mrblog.net': '미블',
      'dinnerqueen.net': '디너의여왕',
      'revu.net': '레뷰',
      'popomon.com': '포포몬',
      'chvu.co.kr': '체험뷰'
    };
    for (const d in map) if (host === d || host.endsWith(`.${d}`)) return map[d];
  } catch {}
  return '';
};

const extractNaverPlaceUrlFromText = (text = '') => {
  const patterns = [
    /https?:\/\/(?:m\.)?place\.naver\.com\/[^\s'")]+/i,
    /https?:\/\/map\.naver\.com\/[^\s'")]+/i,
    /https?:\/\/naver\.me\/[^\s'")]+/i,
    /https?:\/\/search\.naver\.com\/search\.nhn\?[^\s'"]*query=[^\s'"]*/i
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[0].replace(/[.,;:!?…]+$/g,'').replace(/\)+$/,'');
  }
  return '';
};

// ISO 판별: 이미 YYYY-MM-DD면 재파싱 금지
const isISODate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));

export default function ExperienceForm({ selectedExperience, onSelect }) {
  const [formData, setFormData] = useState({
    company: '', region: '', regionFull: '', siteUrl: '', siteName: '', naverPlaceUrl: '',
    announcementDate: '', experienceStart: '', experienceEnd: '', competitionRatio: '', selected: null,
    providedItems: '', additionalInfo: '', extractedText: '', type: 'home',
    isClip: false, isFamily: false, isPetFriendly: false, isLeisure: false,
    isExtended: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const processedTextRef = useRef('');

  const setDatesByAnnouncement = (siteName, annISO) => {
    const offset = START_OFFSET_BY_SITE[siteName] ?? 0;
    const startISO = addDaysISO(annISO, offset);
    const endISO = getExperienceEnd(siteName, startISO);
    return { announcementDate: annISO, experienceStart: startISO, experienceEnd: endISO };
  };

  const looksLikeGangnam = (txt = '') => /강남맛집|캠페인\s*신청기간/i.test(txt);

  // 병합 유틸: 우선순위 배열대로 첫 값 채택
  const mergeByPriority = (priorityList, keys) => {
    const out = {};
    for (const k of keys) {
      for (const src of priorityList) {
        if (src && src[k]) { out[k] = src[k]; break; }
      }
    }
    return out;
  };

  const handleManualExtract = async (rawText = null) => {
    const raw = (rawText !== null) ? rawText.trim() : (formData.extractedText || '').trim();
    if (!raw) return;
    if (processedTextRef.current === raw) return;
    processedTextRef.current = raw;
    setIsLoading(true);

    // 1) 사이트 힌트
    const siteHint = detectSiteFromText(raw);

    // 2) 세 파서 병렬 실행
    let parsedRN = {};
    let parsedGM = {};
    let parsedDQ = {};

    try { parsedRN = await parseReviewNoteText(raw) || {}; } catch {}
    try { parsedGM = await parseGANGNAMText(raw) || {}; } catch {}
    if (siteHint === '디너의여왕') {
      try { parsedDQ = await parseDINNERText(raw) || {}; } catch {}
    }

    // 3) 우선순위 결정
    const priority = (() => {
      if (siteHint === '강남맛집') return [parsedGM, parsedRN, parsedDQ];
      if (siteHint === '리뷰노트') return [parsedRN, parsedGM, parsedDQ];
      if (siteHint === '디너의여왕') return [parsedDQ, parsedRN, parsedGM];
      // 힌트 없으면 리뷰노트가 더 일반적인 라벨이 많으니 RN → GM
      return [parsedRN, parsedGM, parsedDQ];
    })();

    // 4) 병합 (필수 키 우선)
    const mainKeys = [
      'siteName','company','region','regionFull','providedItems',
      'announcementDate','experienceStart','experienceEnd','experiencePeriod','competitionRatio','naverPlaceUrl'
    ];
    const merged = mergeByPriority(priority, mainKeys);

    // 5) 네이버 플레이스 보완
    if (!merged.naverPlaceUrl) {
      const found = extractNaverPlaceUrlFromText(raw);
      if (found) merged.naverPlaceUrl = found;
    }

    // 6) 지역/경쟁률 최종 정규화
    if (merged.regionFull && !merged.region) merged.region = formatRegion(merged.regionFull);
    else if (merged.region) {
      merged.region = formatRegion(merged.region);
      merged.regionFull = merged.regionFull || merged.region;
    }

    if (merged.competitionRatio) {
      const n = normalizeCompetition(merged.competitionRatio);
      merged.competitionRatio = n || String(merged.competitionRatio);
    } else {
      const last = normalizeCompetition(raw);
      if (last) merged.competitionRatio = last;
    }

    // 7) 날짜 ISO 변환 (이미 ISO면 재파싱 금지)
    if (merged.announcementDate && !isISODate(merged.announcementDate)) {
      merged.announcementDate = parseAnnouncementDate(merged.announcementDate);
    }
    if (merged.experienceStart && !isISODate(merged.experienceStart)) {
      merged.experienceStart = parseAnnouncementDate(merged.experienceStart);
    }
    if (merged.experienceEnd && !isISODate(merged.experienceEnd)) {
      merged.experienceEnd = parseAnnouncementDate(merged.experienceEnd);
    }

    // 8) siteName 보강
    const siteNameFinal =
      merged.siteName ||
      siteHint ||
      (looksLikeGangnam(raw) ? '강남맛집' : '리뷰노트');

    setFormData(prev => ({
      ...prev,
      ...merged,
      siteName: siteNameFinal,
      extractedText: raw
    }));

    setIsLoading(false);
    toast.success('텍스트 자동 추출 완료! ✂️', { toastId: 'manual-extract' });
  };

  const handleSiteUrl = async (url, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch(`/api/autoExtract?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const siteName = data.siteName || getSiteNameFromUrl(url);

      if (data.region || data.regionFull) {
        const rFull = data.regionFull || data.region || '';
        data.region = formatRegion(rFull);
        data.regionFull = rFull;
      }

      if (data.competitionRatio) {
        const n = normalizeCompetition(data.competitionRatio);
        data.competitionRatio = n || String(data.competitionRatio);
      }

      let patch = {};
      if (data.announcementDate) {
        const annISO = isISODate(data.announcementDate)
          ? data.announcementDate
          : parseAnnouncementDate(data.announcementDate);
        patch = setDatesByAnnouncement(siteName || '리뷰노트', annISO);
      }

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
      }));
      toast.success('사이트 URL 자동 처리 완료! 🧠', { toastId: 'site-url' });
    } catch {
      toast.error('자동 처리 실패', { toastId: 'site-url-fail' });
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handlePaste = async (e) => {
    const pasted = e.clipboardData.getData('text/plain') || '';
    if (!pasted) return;

    setFormData(prev => ({ ...prev, siteName: '' }));
    setFormData(prev => ({ ...prev, extractedText: pasted }));

    const maybeUrl = (pasted.trim().split(/\s+/).find(tok => /^https?:\/\//i.test(tok)) || '').trim();
    const naverPlace = extractNaverPlaceUrlFromText(pasted);

    if (naverPlace) {
      setFormData(prev => ({ ...prev, naverPlaceUrl: naverPlace }));
      await handleManualExtract(pasted);
      return;
    }
    if (maybeUrl) {
      await handleSiteUrl(maybeUrl, true);
      return;
    }
    await handleManualExtract(pasted);
  };

  useEffect(() => {
    if (selectedExperience) {
      const normalized = {
        ...selectedExperience,
        region: formatRegion(selectedExperience.region || selectedExperience.regionFull || ''),
        competitionRatio: (() => {
          const raw = selectedExperience.competitionRatio || '';
          const n = normalizeCompetition(raw);
          return n || raw;
        })(),
        isExtended: (selectedExperience.isExtended === true) || (selectedExperience.extension === true) || false,
      };
      setFormData({ ...normalized });
    } else resetForm();
    processedTextRef.current = '';
  }, [selectedExperience]);

  const handleChange = e => {
    const { name, type, checked, value } = e.target;

    if (name === 'siteUrl') {
      setFormData(prev => ({ ...prev, siteUrl: value, siteName: getSiteNameFromUrl(value) }));
      return;
    }

    if (name === 'announcementDate') {
      const iso = isISODate(value) ? value : parseAnnouncementDate(value);
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

    const payload = { ...formData, selected: formData.selected === true ? true : null };
    if (payload.extension !== undefined) delete payload.extension;

    if (!payload.naverPlaceUrl) {
      toast.error('네이버 플레이스 링크가 필요합니다.', { toastId: 'submit-error' });
      setIsLoading(false);
      return;
    }

    try {
      if (selectedExperience) await updateDoc(doc(db, 'experiences', selectedExperience.id), payload);
      else await addDoc(collection(db, 'experiences'), payload);
    } catch {
      setIsLoading(false);
      return;
    }

    toast.success(selectedExperience ? '수정끗 🙌' : '저장끗🎉', { toastId: 'submit-success' });
    onSelect(null);
    resetForm();
    setIsLoading(false);
  };

  const handleComplete = async () => {
    toast.dismiss();
    await updateDoc(doc(db, 'experiences', selectedExperience.id), { ...formData, selected: '완료' });
    toast.success('숙제끗✍', { toastId: 'complete' });
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
    toast.success('미선정 처리', { toastId: 'unselect' });
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

  // (선택) 업체명으로 플레이스 자동 보완
  useEffect(() => {
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
                value={formData[name] ?? ''}
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
            onChange={(e) => setFormData(prev => ({ ...prev, extractedText: e.target.value }))}
            onBlur={() => {
              const t = (formData.extractedText || '').trim();
              if (!t) return;
              if (processedTextRef.current === t) return;
              if (/^https?:\/\//.test(t)) handleSiteUrl(t, false);
              else handleManualExtract(t);
            }}
            onPaste={handlePaste}
            placeholder="URL 또는 복붙 텍스트"
            className="w-full h-40 p-3 bg-yellow-100 text-xs rounded"
          />
        </div>

        {(() => {
          const items = [
            ['선정', 'selected'],
            ['연장됨', 'isExtended'],
            ['무쓰오케이', 'isPetFriendly'],
            ['클립형', 'isClip'],
            ['가족용', 'isFamily'],
            ['여가형', 'isLeisure'],
          ];
          const colIndentPx = [2, 36, 45];
          return (
            <div className="grid grid-cols-3 gap-3">
              {items.map(([label, name], idx) => {
                const col = idx % 3;
                const paddingLeft = colIndentPx[col] ? `${colIndentPx[col]}px` : undefined;
                return (
                  <label key={name} className="flex items-center gap-2" style={{ paddingLeft }}>
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
