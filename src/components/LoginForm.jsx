// src/components/LoginForm.jsx
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
    <div className="min-h-screen bg-customBg flex items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-md">
        {/* 로그인 박스 */}
        <div className="relative z-10 bg-white shadow-xl rounded-2xl p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-accentOrange">《뭘 봐.》 초대권</h2>
            <p className="text-sm text-gray-500 mt-4">
              이 사이트는 실사용자가 2명이지만 아무튼
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="
              w-full flex items-center justify-center gap-2
              bg-white text-gray-700 font-semibold
              py-3 border border-accentGray rounded-xl
              hover:bg-customBg transition duration-200 shadow-sm
            "
          >
            <img src="/google-icon.png" alt="Google" className="w-5 h-5" />
            Google 계정으로 로그인
          </button>

          <div className="mt-6 text-center text-sm text-gray-600 space-y-1">
            <p className="font-medium">
              <span className="text-accentOrange font-semibold">
                Google 계정으로만 로그인
              </span>
              할 수 있어요.
            </p>
            <p className="text-xs text-gray-400">
              비밀번호 없이 더 안전하게 이용하세요.
            </p>
          </div>
        </div>

        {/* 플로팅 아이콘들: 모바일(sm) 미노출, md 이상부터 보여줌 */}
        {[
          { icon: "/icons/맛집.ico", label: "엄.근.진으로 평가한다", pos: "-left-20 top-[-10%]", delay: "0ms" },
          { icon: "/icons/마감임박.png", label: "허거덩허거덩스~~", pos: "-left-16 top-1/4", delay: "200ms" },
          { icon: "/icons/단백질.ico", label: "양질의 식사", pos: "-left-18 bottom-1/4", delay: "400ms" },
          { icon: "/icons/무쓰간식.ico", label: "무쓰야 간식 낉여왔다", pos: "right-[-18%] top-[-8%]", delay: "100ms" },
          { icon: "/icons/카페인.png", label: "커피를 낋여오거라‼️", pos: "right-[-17%] top-1/3", delay: "300ms" },
          { icon: "/icons/챗지피티.png", label: "ft. CGPT", pos: "right-[-12%] bottom-1/5", delay: "500ms" }
        ].map(({ icon, label, pos, delay }, i) => (
          <div
            key={i}
            className={`hidden md:block absolute z-${20 + i % 3} ${pos} animate-[floatComplex_4s_linear_infinite]`}
            style={{ animationDelay: delay }}
          >
            <div className="bg-white px-2 py-1 rounded-xl shadow">
              <FloatingIcon icon={icon} label={label} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoginForm;
