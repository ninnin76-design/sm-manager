import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 현재 작업 폴더에서 환경 변수(API_KEY 등)를 로드합니다.
  // 세 번째 인자를 ''로 설정하면 접두사(VITE_)가 없는 변수도 모두 로드합니다.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // 코드 내에서 process.env.API_KEY로 접근할 수 있도록 정의합니다.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});