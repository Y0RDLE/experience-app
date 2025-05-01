import React from 'react';
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import FloatingIcon from './FloatingIcon';

const LoginForm = () => {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("✅ 로그인 성공:", result.user);
    } catch (error) {
      console.error("❌ 로그인 실패:", error);
    }
  };

  return (
    <div className="min-h-screen bg-customBg flex items-center justify-center px-4">
      <div className="relative w-full max-w-md">
        {/* 로그인 박스 */}
        <div className="relative z-10 bg-white shadow-xl rounded-2xl p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-accentOrange">《뭘 봐.》 초대권</h2>
            <p className="text-sm text-gray-500 mt-5">이 사이트는 실사용자가 2명이지만 아무튼</p>
          </div>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold py-3 border border-accentGray rounded-xl hover:bg-customBg transition duration-200 shadow-sm"
          >
            <img src="/google-icon.png" alt="Google" className="w-5 h-5" />
            Google 계정으로 로그인
          </button>
          <div className="mt-6 text-center text-sm text-gray-600">
            <p className="font-medium text-gray-00">
              <span className="text-accentOrange font-semibold">Google 계정으로만 로그인</span>할 수 있어요.
            </p>
            <p className="mt-1 text-gray-400 text-xs mt-2">비밀번호 없이 더 안전하게 이용하세요.</p>
          </div>
        </div>

        {/* 불규칙 아이콘 박스 */}
        <div className="absolute z-22 left-[-200px] top-[-15%] animate-[floatComplex_4s_linear_infinite] [animation-delay:0ms]">
          <div className="bg-white px-2 py-1 rounded-xl shadow">
            <FloatingIcon icon="/icons/맛집.ico" label="엄.근.진으로 평가한다" />
          </div>
        </div>
        <div className="absolute z-20 left-[-120px] top-[13%] animate-[floatComplex_3.5s_linear_infinite] [animation-delay:200ms]">
          <div className="bg-white px-2 py-1 rounded-xl shadow">
            <FloatingIcon icon="/icons/마감임박.png" label="허거덩허거덩스~~" />
          </div>
        </div>
        <div className="absolute z-20 left-[-145px] bottom-[25%] animate-[floatComplex_3.8s_linear_infinite] [animation-delay:400ms]">
          <div className="bg-white px-2 py-1 rounded-xl shadow">
            <FloatingIcon icon="/icons/단백질.ico" label="양질의 식사" />
          </div>
        </div>

        <div className="absolute z-20 right-[-180px] top-[-10%] animate-[floatComplex_4.2s_linear_infinite] [animation-delay:100ms]">
          <div className="bg-white px-2 py-1 rounded-xl shadow">
            <FloatingIcon icon="/icons/무쓰간식.ico" label="무쓰야 간식 낉여왔다,,," />
          </div>
        </div>
        <div className="absolute z-20 right-[-177px] top-[25%] animate-[floatComplex_3.2s_linear_infinite] [animation-delay:300ms]">
          <div className="bg-white px-2 py-1 rounded-xl shadow">
            <FloatingIcon icon="/icons/독약.png" label="커피를 낋여오거라‼️‼️‼️" />
          </div>
        </div>
        <div className="absolute z-20 right-[-100px] bottom-[11%] animate-[floatComplex_4.5s_linear_infinite] [animation-delay:500ms]">
          <div className="bg-white px-2 py-1 rounded-xl shadow">
            <FloatingIcon icon="/icons/챗지피티.png" label="ft. CGPT" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
