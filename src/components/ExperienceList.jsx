// src/ExperienceList.jsx
import React, { useMemo } from 'react';
import SectionCard from './SectionCard';
import { getMaxGridTemplateColumns } from '../utils/gridUtils';

export default function ExperienceList({ experiences, onSelect }) {
  // selected가 true, '대기', 또는 null인 항목만 표시 (false/미선정, '완료' 제외)
  const visible = experiences.filter(exp =>
    exp.selected === true ||
    exp.selected === '대기' ||
    exp.selected == null
  );

  // 맛집형 / 여가형 분리
  const home = visible.filter(x => x.type === 'home' && !x.isLeisure);
  const leisure = visible.filter(x => x.isLeisure);

  // 발표일 순 정렬
  const sortByDate = arr =>
    [...arr].sort(
      (a, b) =>
        new Date(a.announcementDate) - new Date(b.announcementDate)
    );
  const sortedHome = sortByDate(home);
  const sortedLeisure = sortByDate(leisure);

  // 그리드 컬럼 계산
  const gridCols = useMemo(
    () => getMaxGridTemplateColumns([...sortedHome, ...sortedLeisure]),
    [sortedHome, sortedLeisure]
  );

  return (
    <div className="px-10 py-10 bg-customBg min-h-screen">
      <div className="space-y-11">
        <SectionCard
          title="맛집형 체험단 현황"
          headerColor="#F5D194"
          items={sortedHome}
          onItemClick={onSelect}
          gridTemplateColumns={gridCols}
        />
        <SectionCard
          title="여가형 체험단 현황"
          headerColor="#85DBAF"
          items={sortedLeisure}
          onItemClick={onSelect}
          gridTemplateColumns={gridCols}
        />
      </div>
    </div>
  );
}
