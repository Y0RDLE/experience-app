import React from 'react';
import ArchiveSearchSection from '@/components/ArchiveSearchSection';
import ArchiveList from '@/components/ArchiveList';
import ArchiveEditModal from '@/components/ArchiveEditModal';
import useArchiveEdit from '@/hooks/useArchiveEdit';

const ArchivePage = ({ data = [], searchQuery }) => {
  const {
    editTarget,
    editValues,
    openEdit,
    closeEdit,
    handleInputChange,
    saveEdit,
  } = useArchiveEdit();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">체험단 아카이브</h1>
      <ArchiveSearchSection searchQuery={searchQuery} />
      <ArchiveList list={data} openEdit={openEdit} />
      <ArchiveEditModal
        experience={editValues}
        onClose={closeEdit}
        onChange={handleInputChange}
        onSave={saveEdit}
      />
    </div>
  );
};

export default ArchivePage;
