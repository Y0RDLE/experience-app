// src/ShareLink.jsx
import React from 'react';

const ShareLink = () => {
  // 현재 개발 중인 사이트의 기본 URL을 공유 링크로 사용합니다.
  const shareUrl = window.location.origin;

  return (
    <div className="mt-4 p-4 bg-gray-100 border rounded">
      <p className="font-bold mb-2">사이트 공유 링크:</p>
      <input
        type="text"
        readOnly
        value={shareUrl}
        className="w-full border border-gray-300 p-2 rounded"
        onFocus={(e) => e.target.select()}
      />
    </div>
  );
};

export default ShareLink;
