import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // ✅ Vercel에서 상대 경로 필요
  define: {
    'process.env': {}, // ✅ 환경변수 오류 방지
  },
  server: {
    port: 8888, // ✅ 여기에 원하는 포트 지정
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // ✅ @를 src 폴더로 매핑
    },
  },
});