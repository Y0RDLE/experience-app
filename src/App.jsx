import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Sidebar from './Sidebar';
import Home from './Home';
import CalendarPage from './CalendarPage';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <div className="relative flex w-screen h-screen overflow-hidden">
        <div className="fixed top-0 left-0 w-[228px] h-screen z-20">
          <Sidebar />
        </div>
        <div className="flex-1 ml-[228px] overflow-y-auto bg-customBg p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/calendar" element={<CalendarPage />} />
          </Routes>
        </div>
      </div>
      <ToastContainer position="bottom-center" autoClose={2000} />
    </Router>
  );
}

export default App;
