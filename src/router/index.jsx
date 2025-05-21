import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '@/layout/MainLayout';
import Home from '@/pages/Home';
import CalendarPage from '@/pages/CalendarPage';

export default function AppRouter() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          }
        >
          <Route index element={<Home />} />
          <Route path="calendar" element={<CalendarPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
