// src/components/ArchiveEditModal.jsx
import React from 'react';
import { X } from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';

const ArchiveEditModal = ({ experience, onClose, onChange, onSave }) => {
  if (!experience) return null;

  const handleSaveInternal = async () => {
    try {
      const { id, ...rest } = experience;
      const ref = doc(db, 'experiences', id);
      await updateDoc(ref, rest);
      // 부모에서 목록 갱신/모달 닫기 처리
      onSave();
    } catch (err) {
      console.error('Firestore 저장 실패:', err);
    }
  };

  const handleDelete = async () => {
    try {
      const ref = doc(db, 'experiences', experience.id);
      await deleteDoc(ref);
      onSave();
    } catch (err) {
      console.error('Firestore 삭제 실패:', err);
    }
  };

  // 복구: 완료 상태에서 현황표(선정 true)로 되돌림
  const handleRestore = async () => {
    try {
      const ref = doc(db, 'experiences', experience.id);
      await updateDoc(ref, { selected: true });
      onSave();
    } catch (err) {
      console.error('복구 실패:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-[560px] max-w-[90%] p-6 relative">
        <div className="relative mb-4">
          <h2 className="text-xl font-bold text-center mt-[-2px]">체험단 정보 수정</h2>
          <button
            className="absolute top-[-6px] right-[-6px] text-gray-500 hover:text-gray-700"
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative max-h-[70vh] overflow-y-auto custom-scroll mr-[-18px] pr-[18px]">
          <div className="space-y-4">
            {[
              ['업체명', 'company'],
              ['사이트명', 'siteName'],
              ['사이트 URL', 'siteUrl'],
              ['네이버 플레이스 링크', 'naverPlaceUrl'],
              ['지역', 'region'],
              ['전체 주소', 'regionFull'],
              ['제공내역', 'providedItems'],
              ['추가정보', 'additionalInfo'],
              ['경쟁률', 'competitionRatio'],
              ['발표일', 'announcementDate'],
              ['체험 시작일', 'experienceStart'],
              ['체험 종료일', 'experienceEnd'],
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

            <div className="flex flex-wrap gap-4 pt-2">
              {/* 체크박스 순서: 선정됨 → 연장됨 → 무쓰오케이 → 클립형 → 가족용 → 여가형 */}
              {[
                ['선정됨', 'selected'],
                ['연장됨', 'extension'],
                ['무쓰오케이', 'isPetFriendly'],
                ['클립형', 'isClip'],
                ['가족용', 'isFamily'],
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
        </div>

        <div className="flex justify-between mt-6 gap-3">
          <div className="flex gap-2">
            {/* 삭제 버튼 */}
            <button
              className="px-4 py-2 rounded bg-red-100 text-sm text-red-600 hover:bg-red-200"
              onClick={handleDelete}
            >
              삭제
            </button>

            {/* 복구 버튼: 현재 문서가 '완료'로 표시되어 있을 경우에만 노출 */}
            {experience.selected === '완료' && (
              <button
                className="px-4 py-2 rounded bg-green-100 text-sm text-green-700 hover:bg-green-200"
                onClick={handleRestore}
              >
                복구
              </button>
            )}
          </div>

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

      <style jsx>{`
        .custom-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cccccc transparent;
        }
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: #cccccc;
          border-radius: 9999px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default ArchiveEditModal;
