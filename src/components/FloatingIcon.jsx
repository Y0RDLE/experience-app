import React from 'react';

// FloatingIcon: 애니메이션은 외부에서 wrapper에 적용합니다.
const FloatingIcon = ({ icon, label, className = '' }) => (
  <div className={`${className} flex items-center gap-1`}>  {/* 아이콘과 라벨 간 간격을 줄임 */}
    <img src={icon} alt={label} className="w-6 h-6" />  {/* 아이콘 크기를 키움 */}
    <span className="text-base text-gray-600">{label}</span>  {/* 텍스트 크기를 키움 */}
  </div>
);

export default FloatingIcon;
