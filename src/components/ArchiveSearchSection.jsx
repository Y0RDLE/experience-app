// src/components/ArchiveSearchSection.jsx
import React, { useState } from 'react';
import useArchiveSearch from '@/hooks/useArchiveSearch';
import ArchiveEditModal from './ArchiveEditModal';

const ArchiveSearchSection = ({ searchQuery }) => {
  const { results, loading } = useArchiveSearch(searchQuery);
  const [editingItem, setEditingItem] = useState(null);

  return (
    <div className="mt-8">
      {loading && <div className="text-gray-500">검색 중...</div>}

      {!loading && results.length === 0 && (
        <div className="text-gray-500">검색 결과가 없습니다.</div>
      )}

      <div className="space-y-2">
        {results.map((item) => (
          <div
            key={item.id}
            onClick={() => setEditingItem(item)}
            className="p-3 border rounded cursor-pointer hover:bg-gray-50"
          >
            <div className="font-semibold text-sm">{item.company}</div>
            <div className="text-xs text-gray-500">{item.region} · {item.siteName}</div>
          </div>
        ))}
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
            // 저장 로직은 ArchiveEditModal 내부에서 처리
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

export default ArchiveSearchSection;