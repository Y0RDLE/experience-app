import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // ✅ Vercel에서 상대 경로 필요
  define: {
    'process.env': {}, // ✅ 환경변수 오류 방지
  },
});
