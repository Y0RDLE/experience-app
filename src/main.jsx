import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';   // Tailwind + 태그 CSS 한 번만 불러오기

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
