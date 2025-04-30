import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from '@/pages/Home';
import CalendarPage from '@/pages/CalendarPage';
import ArchivePage from '@/pages/ArchivePage';

// 예시용 dummy data (실제 Firestore fetch로 대체 필요)
const dummyArchive = [];

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />, // ✅ 기존 Home.jsx로 복구
  },
  {
    path: '/calendar',
    element: <CalendarPage />,
  },
  {
    path: '/archive',
    element: <ArchivePage data={dummyArchive} />,
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;