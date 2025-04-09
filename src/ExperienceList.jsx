import React, { useState, useEffect, useMemo } from 'react';
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

  // "선정" 또는 "선정 대기" 상태만 표시하도록 필터링
  const visibleExperiences = experiences.filter(
    (exp) => exp.selected === true || exp.selected === '대기'
  );

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

  const combined = [...sortedHomeExperiences, ...sortedLeisureExperiences];

  const gridTemplateColumns = useMemo(() => {
    return getMaxGridTemplateColumns(combined);
  }, [combined]);

  return (
    <div className="px-10 py-10 bg-customBg min-h-screen" /* space-y 대신 수동으로 간격 조정할 수도 있음 */>
      {/* 검색창 등 추가 UI가 필요하다면 이곳에 배치 */}
      <div className="space-y-11">
        <SectionCard
          title="맛집형 체험단 현황"
          headerColor="#F5D194"
          items={sortedHomeExperiences}
          onItemClick={onSelect}
          gridTemplateColumns={gridTemplateColumns}
        />
        {/* 맛집형과 여가형 간 간격을 줄이기 위해 space-y-4 사용 */}
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
