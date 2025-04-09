// src/Home.jsx
import React, { useState } from 'react';
import ExperienceList from './ExperienceList';
import ExperienceForm from './ExperienceForm';

function Home() {
  const [selectedExperience, setSelectedExperience] = useState(null);

  return (
    <div className="max-w-[1800px] mx-auto px-6 py-0">
      <div className="grid grid-cols-12 gap-12 items-start pt-[48px]">
        {/* 왼쪽: 체험단 현황표 → 마이너스 마진으로 위로 당김 */}
        <section className="col-span-8 mt-[-42px]">
          <ExperienceList onSelect={setSelectedExperience} />
        </section>

        {/* 오른쪽: 체험단 정보 입력 */}
        <section className="col-span-4">
          <ExperienceForm selectedExperience={selectedExperience} />
        </section>
      </div>
    </div>
  );
}

export default Home;
