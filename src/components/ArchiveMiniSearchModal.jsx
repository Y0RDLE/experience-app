import React, { useEffect, useState } from 'react';
import useArchiveSearch from '@/hooks/useArchiveSearch';
import ArchiveEditModal from './ArchiveEditModal';

const ArchiveMiniSearchModal = ({ searchQuery, onClose }) => {
  const { results, loading, triggered, setTriggered } = useArchiveSearch(searchQuery);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      setTriggered(false);
    }
  }, [searchQuery]);

  if (!triggered) return null;

  const handleClose = () => {
    setEditingItem(null);
    setTriggered(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="relative w-[760px] max-h-[80vh] overflow-hidden bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 font-medium">
        <div className="relative mb-4 pb-2 border-b border-gray-200">
          <h2 className="text-center text-lg font-extrabold">🔍 전체 검색 결과</h2>
          <button
            onClick={handleClose}
            className="absolute top-0 right-0 p-1 text-gray-400 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto pr-3 custom-scroll max-h-[calc(80vh-80px)]">
          {loading && <div className="text-center text-sm text-gray-500">검색 중…</div>}
          {!loading && results.length === 0 && (
            <div className="text-center text-sm text-gray-400">검색 결과 없음</div>
          )}

          <div className="grid grid-cols-2 gap-4 py-2">
            {results.map((item) => {
              const isSelected = item.selected === true || item.selected === '완료';
              return (
                <div
                  key={item.id}
                  onClick={() => setEditingItem(item)}
                  className={`p-4 border rounded-lg shadow-sm hover:shadow-md transition cursor-pointer ${
                    isSelected ? 'bg-[#FEFAEE] border-[#F5D6AA]' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="mb-1 text-sm font-bold text-gray-800">{item.company}</div>
                  <div className="mb-1 text-xs text-gray-500">
                    {item.region} {item.siteName && `· ${item.siteName}`}
                  </div>
                  <div className="mb-1 text-xs text-gray-700 line-clamp-1">
                    🧺 {item.providedItems || '제공내역 없음'}
                  </div>
                  <div className="text-xs text-gray-400 line-clamp-1">
                    💬 {item.additionalInfo || '기타사항 없음'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
            onSave={() => {
              setEditingItem(null);
            }}
          />
        )}
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

export default ArchiveMiniSearchModal;
