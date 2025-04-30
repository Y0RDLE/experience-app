// src/components/ArchiveEditModal.jsx
import React from 'react';
import { X } from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';

const ArchiveEditModal = ({ experience, onClose, onChange, onSave }) => {
  if (!experience) return null;

  // 저장 버튼 클릭 시 Firestore 문서 업데이트
  const handleSaveInternal = async () => {
    try {
      const { id, ...rest } = experience;
      const ref = doc(db, 'experiences', id);
      await updateDoc(ref, rest);
      onSave();
    } catch (err) {
      console.error('Firestore 저장 실패:', err);
    }
  };

  // 삭제 버튼 클릭 시 Firestore 문서 삭제
  const handleDelete = async () => {
    try {
      const ref = doc(db, 'experiences', experience.id);
      await deleteDoc(ref);
      onSave(); // 삭제 후 모달 닫기
    } catch (err) {
      console.error('Firestore 삭제 실패:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-[560px] max-w-[90%] p-6 relative">
        {/* 닫기 버튼 */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4">체험단 정보 수정</h2>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {[
            ['업체명', 'company'],
            ['사이트명', 'siteName'],
            ['사이트 URL', 'siteUrl'],
            ['네이버 플레이스 링크', 'naverPlaceUrl'],
            ['지역', 'region'],
            ['지역 전체 주소', 'regionFull'],
            ['제공내역', 'providedItems'],
            ['추가정보', 'additionalInfo'],
            ['경쟁률', 'competitionRatio'],
            ['발표일', 'announcementDate'],
            ['체험 시작일', 'experienceStart'],
            ['체험 종료일', 'experienceEnd'],
            ['선택 상태', 'selected'],
            ['유형', 'type'],
          ].map(([label, name]) => (
            <div key={name} className="flex flex-col">
              <label className="text-sm font-semibold mb-1">{label}</label>
              <input
                type="text"
                name={name}
                value={experience[name] || ''}
                onChange={onChange}
                className="border rounded px-3 py-2 shadow-sm focus:ring-accentOrange focus:border-accentOrange"
              />
            </div>
          ))}

          {/* 체크박스 필드 */}
          <div className="flex flex-wrap gap-4 pt-2">
            {[
              ['클립형', 'isClip'],
              ['가족용', 'isFamily'],
              ['무쓰오케이', 'isPetFriendly'],
              ['여가형', 'isLeisure'],
            ].map(([label, name]) => (
              <label key={name} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name={name}
                  checked={!!experience[name]}
                  onChange={onChange}
                  className="rounded"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* 하단 버튼들 */}
        <div className="flex justify-between mt-6 gap-3">
          <button
            className="px-4 py-2 rounded bg-red-100 text-sm text-red-600 hover:bg-red-200"
            onClick={handleDelete}
          >
            삭제
          </button>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 rounded bg-gray-200 text-sm text-gray-700 hover:bg-gray-300"
              onClick={onClose}
            >
              취소
            </button>
            <button
              className="px-4 py-2 rounded bg-accentOrange text-sm text-white hover:bg-orange-400"
              onClick={handleSaveInternal}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveEditModal;
