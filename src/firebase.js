import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase 콘솔에서 제공한 구성 값 사용 (비공개 값은 .env 파일로 관리하는 것도 추천합니다)
const firebaseConfig = {
  apiKey: "AIzaSyA2yP1tIYr8lbRDBzghoG2PNO423imnYrY",
  authDomain: "viewtalk-a3835.firebaseapp.com",
  projectId: "viewtalk-a3835",
  storageBucket: "viewtalk-a3835.firebasestorage.app", // Firebase 콘솔에 기재된 대로 사용
  messagingSenderId: "910382507978",
  appId: "1:910382507978:web:7a09d0c6db9d4c2763d133"
};

const app = initializeApp(firebaseConfig);

// Firebase 초기화 완료를 콘솔에 출력
console.log("Firebase 초기화 완료");

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
