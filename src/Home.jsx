// src/Home.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import ExperienceList from './ExperienceList';
import ExperienceForm from './ExperienceForm';

export default function Home() {
  // Firestore에서 불러온 전체 체험단 데이터
  const [experiences, setExperiences] = useState([]);
  // 현재 폼에 로드할 선택된 경험단 (객체)
  const [selectedExperience, setSelectedExperience] = useState(null);
  // selectedExperience가 null로 바뀔 때마다 폼을 강제 리셋하기 위한 key
  const [formKey, setFormKey] = useState(0);

  // Firestore 'experiences' 컬렉션 실시간 구독
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

  // selectedExperience가 null이 되면 formKey 증가 → 폼 강제 리렌더
  useEffect(() => {
    if (selectedExperience === null) {
      setFormKey(k => k + 1);
    }
  }, [selectedExperience]);

  return (
    <div className="max-w-[1800px] mx-auto px-6 py-0">
      <div className="grid grid-cols-12 gap-12 items-start pt-[48px]">
        {/* 왼쪽: 체험단 현황표 */}
        <section className="col-span-8 mt-[-42px]">
          <ExperienceList
            experiences={experiences}
            onSelect={exp => setSelectedExperience(exp)}
          />
        </section>

        {/* 오른쪽: 체험단 정보 입력 */}
        <section className="col-span-4">
          <ExperienceForm
            key={formKey}
            selectedExperience={selectedExperience}
          />
        </section>
      </div>
    </div>
  );
}
