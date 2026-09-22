import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  let base = '/';

  return {
    root: __dirname,   // 👈 this tells Vite to use quote2cash-web as the root
    plugins: [react()],
    base,
    server: {
      port: 4173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5227',
          changeOrigin: true,
          secure: false,
        },
        '/logo.png': {
          target: 'http://localhost:5227',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: 4173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://192.168.8.103:5227',
          changeOrigin: true,
          secure: false,
        },
        '/logo.png': {
          target: 'http://192.168.8.103:5227',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist'
    }
  };
});
