// src/Login.jsx
import React from 'react';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const Login = () => {
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      console.log("로그인 성공");
    } catch (error) {
      console.error("로그인 실패:", error);
    }
  };

  return (
    <div>
      <h1>로그인 페이지</h1>
      <button onClick={handleGoogleLogin}>구글로 로그인</button>
    </div>
  );
};

export default Login;
