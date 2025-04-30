// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import ExperienceList from '@/components/ExperienceList';
import ExperienceForm from '@/components/ExperienceForm';
import MainLayout from '@/layout/MainLayout';
import Sidebar from '@/components/Sidebar';
import ArchiveMiniSearchModal from '@/components/ArchiveMiniSearchModal';

export default function Home() {
  const [experiences, setExperiences] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'experiences'),
      snapshot => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExperiences(docs);
      },
      error => {
        console.error('Firestore 구독 에러:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedExperience === null) {
      setFormKey(k => k + 1);
    }
  }, [selectedExperience]);

  return (
    <MainLayout sidebar={<Sidebar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}>
      <div className="max-w-[1800px] mx-auto px-6 py-0">
        <div className="grid grid-cols-12 gap-12 items-start pt-[48px]">
          <section className="col-span-8 mt-[-42px]">
            <ExperienceList
              experiences={experiences} // ✅ 필터링 제거하고 원본 그대로 사용
              onSelect={exp => setSelectedExperience(exp)}
            />
          </section>
          <section className="col-span-4">
            <ExperienceForm
              key={formKey}
              selectedExperience={selectedExperience}
            />
          </section>
        </div>
      </div>
      <ArchiveMiniSearchModal searchQuery={searchQuery} onClose={() => {}} />
    </MainLayout>
  );
}