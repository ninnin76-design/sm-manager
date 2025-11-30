import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 현재 작업 폴더에서 환경 변수(API_KEY 등)를 로드합니다.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // 코드 내에서 process.env.API_KEY로 접근할 수 있도록 정의합니다.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    build: {
      // 청크 크기 경고 제한을 1600kB로 늘림 (Firebase 등 큰 라이브러리 사용 시 경고 방지)
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          // 라이브러리(node_modules) 코드를 별도의 'vendor' 파일로 분리하여 로딩 최적화
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    },
  };
});