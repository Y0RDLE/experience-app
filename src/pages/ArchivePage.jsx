import React from 'react';
import ArchiveList from '@/components/ArchiveList';
import ArchiveEditModal from '@/components/ArchiveEditModal';
import { useArchiveModal } from '@/hooks/useArchiveEdit';
import ArchiveSearchSection from '@/components/ArchiveSearchSection';

const ArchivePage = ({ data = [], searchQuery = '' }) => {
  const {
    editTarget,
    editValues,
    openModal,
    closeModal,
    handleChange,
    handleSave,
  } = useArchiveModal();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">체험단 아카이브</h1>
      <ArchiveSearchSection searchQuery={searchQuery} />
      <ArchiveList list={data} openModal={openModal} />
      <ArchiveEditModal
        experience={editValues}
        onClose={closeModal}
        onChange={handleChange}
        onSave={handleSave}
      />
    </div>
  );
};

export default ArchivePage;