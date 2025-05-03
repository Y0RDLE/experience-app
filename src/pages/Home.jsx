// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import ExperienceList from '@/components/ExperienceList';
import ExperienceForm from '@/components/ExperienceForm';
import MainLayout from '@/layout/MainLayout';
import Sidebar from '@/components/Sidebar';
import ArchiveMiniSearchModal from '@/components/ArchiveMiniSearchModal';
import useArchiveSearch from '@/hooks/useArchiveSearch';

export default function Home() {
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // 전체 데이터는 데스크탑 리스트용으로 실시간 구독
  const [allExperiences, setAllExperiences] = useState([]);
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'experiences'),
      snap => {
        setAllExperiences(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      err => console.error('Firestore 구독 에러:', err)
    );
    return () => unsubscribe();
  }, []);

  // formKey 리셋(선택 해제 시)
  useEffect(() => {
    if (selectedExperience === null) {
      setFormKey(k => k + 1);
    }
  }, [selectedExperience]);

  // 모바일용 검색 훅 (사이드바 검색창과 동일 로직)
  const { results: searchResults, loading } = useArchiveSearch(searchQuery);

  return (
    <MainLayout
      // 사이드바은 데스크탑에서만
      sidebar={
        <Sidebar
          className="hidden lg:flex"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      }
    >
      <div className="max-w-[1800px] mx-auto px-6 py-0">
        {/* 📱 모바일: 검색창 + 현황표만 */}
        <div className="block lg:hidden pt-[48px]">
          {/* 검색창 */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="업체명·지역·사이트명 검색"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full p-3 border rounded shadow-sm focus:outline-none focus:ring-accentOrange"
            />
          </div>

          {/* 로딩 인디케이터 */}
          {loading ? (
            <div className="flex justify-center py-10 text-gray-500">
              검색 중...
            </div>
          ) : (
            <ExperienceList
              experiences={searchResults}
              onSelect={exp => setSelectedExperience(exp)}
            />
          )}
        </div>

        {/* 🖥 데스크탑: 사이드바 + 리스트 + 폼 */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-12 items-start pt-[48px]">
          {/* 리스트 */}
          <section className="lg:col-span-8 lg:mt-[-42px]">
            <ExperienceList
              experiences={allExperiences}
              onSelect={exp => setSelectedExperience(exp)}
            />
          </section>

          {/* 입력폼 */}
          <section className="lg:col-span-4">
            <ExperienceForm
              key={formKey}
              selectedExperience={selectedExperience}
            />
          </section>
        </div>
      </div>

      {/* 공통: 검색 모달 */}
      <ArchiveMiniSearchModal
        searchQuery={searchQuery}
        onClose={() => {}}
      />
    </MainLayout>
  );
}
