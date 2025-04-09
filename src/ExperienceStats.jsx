// src/ExperienceStats.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

const ExperienceStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    selectedCount: 0,
    averageCompetition: 0,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'experiences'),
      (snapshot) => {
        const experiences = snapshot.docs.map(doc => doc.data());
        const total = experiences.length;
        const selectedCount = experiences.filter(exp => exp.selected).length;
        
        // 경쟁률을 "1:10" 형태로 가정하고, 분모 값 추출하여 평균 계산
        const competitionValues = experiences
          .map(exp => {
            if(exp.competitionRatio) {
              const parts = exp.competitionRatio.split(':');
              if(parts.length === 2) {
                return parseFloat(parts[1]);
              }
            }
            return null;
          })
          .filter(val => val !== null);
        
        const averageCompetition = competitionValues.length
          ? (competitionValues.reduce((a, b) => a + b, 0) / competitionValues.length).toFixed(2)
          : 0;
        
        setStats({
          total,
          selectedCount,
          averageCompetition,
        });
      },
      (error) => {
        console.error('체험단 통계 데이터를 불러오는 중 오류 발생:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-8 p-4 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">체험 정보 통계</h2>
      <p>총 체험단 신청 수: {stats.total}</p>
      <p>선정된 체험단 수: {stats.selectedCount}</p>
      <p>평균 경쟁률 (분모 평균): {stats.averageCompetition}</p>
    </div>
  );
};

export default ExperienceStats;
