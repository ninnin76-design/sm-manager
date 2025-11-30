import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 사용자가 제공한 Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyApHQzRGAS22LxNSyqd4e0k_s7zUYpdlSs",
  authDomain: "sm-manager-d9d53.firebaseapp.com",
  projectId: "sm-manager-d9d53",
  storageBucket: "sm-manager-d9d53.firebasestorage.app",
  messagingSenderId: "188706569402",
  appId: "1:188706569402:web:c473932dfc6f13c75f9683",
  measurementId: "G-D2ZT9CR9FQ"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 데이터베이스(Firestore) 기능을 앱 전체에서 쓸 수 있도록 내보내기
export const db = getFirestore(app);