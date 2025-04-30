import React from 'react';
import AppRouter from './router';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';




function App() {
  return (
    <>
      <AppRouter />
      <ToastContainer
        position="bottom-center"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover={false}
        closeButton={false}
        icon
        theme="light"
        toastClassName="!w-auto !min-w-0 !max-w-max !px-3 !py-2 !rounded-lg !shadow-md !bg-white !border !border-gray-200"
        bodyClassName="text-sm text-gray-800"
      />
    </>
  );
}

export default App;