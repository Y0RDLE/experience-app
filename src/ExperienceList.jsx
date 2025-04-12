import React, { useState, useMemo, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import SectionCard from './SectionCard';
import { getMaxGridTemplateColumns } from './utils/gridUtils';

const ExperienceList = ({ onSelect }) => {
  const [experiences, setExperiences] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'experiences'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExperiences(data);
      },
      (error) => {
        console.error("데이터 로드 실패:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // selected가 true 또는 (문자열에서 trim 후 "대기")인 항목만 표시
  const visibleExperiences = experiences.filter(exp => {
    const status = typeof exp.selected === 'string' ? exp.selected.trim() : exp.selected;
    return status === true || status === '대기';
  });

  // 검색 필터
  const filtered = visibleExperiences.filter(exp =>
    exp.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 맛집형과 여가형 분리
  const homeExperiences = filtered.filter(x => x.type === 'home' && x.isLeisure !== true);
  const leisureExperiences = filtered.filter(x => x.isLeisure === true);

  // 발표일 기준 정렬
  const sortedHomeExperiences = [...homeExperiences].sort(
    (a, b) => new Date(a.announcementDate) - new Date(b.announcementDate)
  );
  const sortedLeisureExperiences = [...leisureExperiences].sort(
    (a, b) => new Date(a.announcementDate) - new Date(b.announcementDate)
  );

  const gridTemplateColumns = useMemo(
    () => getMaxGridTemplateColumns([...sortedHomeExperiences, ...sortedLeisureExperiences]),
    [sortedHomeExperiences, sortedLeisureExperiences]
  );

  return (
    <div className="px-10 py-10 bg-customBg min-h-screen">
      <div className="space-y-11">
        <SectionCard
          title="맛집형 체험단 현황"
          headerColor="#F5D194"
          items={sortedHomeExperiences}
          onItemClick={onSelect}
          gridTemplateColumns={gridTemplateColumns}
        />
        <SectionCard
          title="여가형 체험단 현황"
          headerColor="#85DBAF"
          items={sortedLeisureExperiences}
          onItemClick={onSelect}
          gridTemplateColumns={gridTemplateColumns}
        />
      </div>
    </div>
  );
};

export default ExperienceList;
