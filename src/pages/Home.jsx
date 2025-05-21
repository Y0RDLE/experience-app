import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import ExperienceList from '@/components/ExperienceList';
import ExperienceForm from '@/components/ExperienceForm';
import ArchiveMiniSearchModal from '@/components/ArchiveMiniSearchModal';

export default function Home() {
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [allExperiences, setAllExperiences] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'experiences'),
      (snap) => setAllExperiences(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error('Firestore 구독 에러:', err)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedExperience === null) setFormKey((k) => k + 1);
  }, [selectedExperience]);

  return (
    <>
      <div className="max-w-[1800px] mx-auto px-6 lg:mt-0.5">
        <div className="grid grid-cols-12 gap-10 items-start">
          <section className="col-span-12 lg:col-span-8">
            <ExperienceList
              experiences={allExperiences}
              onSelect={(exp) => setSelectedExperience(exp)}
            />
          </section>
          <section className="col-span-12 lg:col-span-4 lg:mt-10">
            <ExperienceForm
              key={formKey}
              selectedExperience={selectedExperience}
              onSelect={(exp) => setSelectedExperience(exp)}
            />
          </section>
        </div>
      </div>

      {/* 검색 모달 (비활성 상태만 보여줌) */}
      <ArchiveMiniSearchModal searchQuery="" onClose={() => {}} />
    </>
  );
}
