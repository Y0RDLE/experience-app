// src/components/ArchiveMiniSearchModal.jsx
import React, { useEffect } from 'react';
import useArchiveSearch from '@/hooks/useArchiveSearch';
import ArchiveEditModal from './ArchiveEditModal';

const ArchiveMiniSearchModal = ({ searchQuery, onClose }) => {
  const { results, loading, triggered, setTriggered } = useArchiveSearch(searchQuery);
  const [editingItem, setEditingItem] = React.useState(null);

  useEffect(() => {
    if (!triggered) onClose();
  }, [triggered, onClose]);

  if (!triggered) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white w-[760px] max-h-[80vh] px-6 py-6 rounded-[24px] shadow-2xl relative border border-gray-200 overflow-y-auto custom-scroll font-[GmarketSansMedium]">
        <h2 className="text-[17px] font-extrabold mb-4 text-gray-900 text-center">🔍 전체 검색 결과</h2>

        {loading && <div className="text-gray-500 text-sm text-center">검색 중...</div>}

        {!loading && results.length === 0 && (
          <div className="text-gray-400 text-sm text-center">검색 결과 없음</div>
        )}

        <div className="grid grid-cols-2 gap-4 pb-4">
          {results.map((item) => {
            const isSelected = item.selected === true || item.selected === '완료';
            return (
              <div
                key={item.id}
                onClick={() => setEditingItem(item)}
                className={`p-4 border rounded-[16px] shadow-sm hover:shadow-md transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#FEFAEE] border-[#FAD6A5]' // ✅ 병아리 배경으로 교체
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="text-sm font-bold text-gray-800 mb-1">
                  {item.company}
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  {item.region} {!!item.siteName && `· ${item.siteName}`}
                </div>
                <div className="text-xs text-gray-700 mb-1 line-clamp-1">
                  🧺 {item.providedItems || '제공내역 없음'}
                </div>
                <div className="text-xs text-gray-400 line-clamp-1">
                  💬 {item.additionalInfo || '기타사항 없음'}
                </div>
              </div>
            );
          })}
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={() => setTriggered(false)}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold"
        >✕</button>

        {/* 수정 모달 */}
        {editingItem && (
          <ArchiveEditModal
            experience={editingItem}
            onClose={() => setEditingItem(null)}
            onChange={(e) => {
              const { name, type, checked, value } = e.target;
              setEditingItem((prev) => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
              }));
            }}
            onSave={() => setEditingItem(null)}
          />
        )}
      </div>

      <style jsx>{`
        .custom-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: #bbb;
          border-radius: 9999px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default ArchiveMiniSearchModal;
