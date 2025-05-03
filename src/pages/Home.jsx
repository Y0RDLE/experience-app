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
        {/* 좁게 줄였을 때(모바일 포함) 오직 입력폼만 보이게 */}
        <div className="block lg:hidden pt-[48px]">
          <ExperienceForm
            key={formKey}
            selectedExperience={selectedExperience}
          />
        </div>

        {/* 충분히 넓은 창에서는 현황표와 입력폼을 좌우로 나란히 */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-12 items-start pt-[48px] relative">
          <section className="lg:col-span-8 lg:mt-[-42px] relative z-[10]">
            <ExperienceList
              experiences={experiences}
              onSelect={exp => setSelectedExperience(exp)}
            />
          </section>
          <section className="lg:col-span-4 relative z-[20]">
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
