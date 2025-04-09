// src/ExperienceCalendar.jsx
import React from 'react';

const ExperienceCalendar = () => {
  // 예시 데이터: 실제 Firestore 연동 필요 시 수정
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-3">체험단 일정 캘린더</h2>
      <div className="grid grid-cols-7 gap-2 text-center text-sm">
        {days.map((day) => (
          <div key={day} className="border p-3 rounded hover:bg-blue-50">
            {day}일
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExperienceCalendar;
