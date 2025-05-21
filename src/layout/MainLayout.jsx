import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import ArchiveMiniSearchModal from '@/components/ArchiveMiniSearchModal';

const MainLayout = ({ searchQuery, setSearchQuery }) => (
  <div className="relative flex w-screen h-screen overflow-hidden">
    <div className="fixed top-0 left-0 w-[228px] h-screen z-20">
      <Sidebar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
    </div>
    <div className="flex-1 ml-[228px] overflow-y-auto bg-customBg p-6">
      <Outlet />
    </div>
    <ArchiveMiniSearchModal
      searchQuery={searchQuery}
      onClose={() => setSearchQuery('')}
    />
  </div>
);

export default MainLayout;
