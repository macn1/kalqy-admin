import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The browser calls /api/... on the dev server, which forwards to the KALQY backend (no CORS setup needed).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: { proxy: { '/api': { target: env.VITE_API_URL || 'http://localhost:8080', changeOrigin: true } } },
  };
});
