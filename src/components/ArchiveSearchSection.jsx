import React, { useState } from 'react';
import useArchiveSearch from '@/hooks/useArchiveSearch';
import ArchiveEditModal from './ArchiveEditModal';

const ArchiveSearchSection = ({ searchQuery }) => {
  const { results, loading } = useArchiveSearch(searchQuery);
  const [editingItem, setEditingItem] = useState(null);

  return (
    <div className="mt-8">
      {loading && <div className="text-center text-gray-500">검색 중…</div>}

      {!loading && !results.length && (
        <div className="text-center text-gray-500">검색 결과가 없습니다.</div>
      )}

      <div className="mt-4 space-y-2 max-h-64 overflow-auto">
        {results.map((item) => (
          <div
            key={item.id}
            onClick={() => setEditingItem(item)}
            className="p-3 border rounded hover:bg-gray-50 cursor-pointer transition"
          >
            <div className="font-semibold text-sm">{item.company}</div>
            <div className="text-xs text-gray-500">
              {item.region} · {item.siteName}
            </div>
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
          onSave={() => setEditingItem(null)}
        />
      )}
    </div>
  );
};

export default ArchiveSearchSection;
