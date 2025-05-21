import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';
import AppRouter from '@/router';
import LoginForm from '@/components/LoginForm';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return unsub;
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-customBg">
        <div className="text-center animate-fadeInHighlight">
          <img src="/my-icon.png" className="w-12 h-12 mb-3 mx-auto" alt="로고" />
          <p className="text-accentOrange text-base font-medium">입장중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {user ? <AppRouter /> : <LoginForm />}
      <ToastContainer
        position="bottom-center"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover={false}
        closeButton={false}
        theme="light"
        toastClassName="!w-auto !min-w-0 !max-w-max !px-3 !py-2 !rounded-lg !shadow-md !bg-white !border !border-gray-200"
        bodyClassName="text-sm text-gray-800"
      />
    </>
  );
}

export default App;
