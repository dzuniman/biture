import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    origin: 'https://arcade-scroll-orange-enclosure.trycloudflare.com',
    port: 4173,
    host: true, // This allows access via your network IP (0.0.0.0)
    proxy: {
      '/api': {
        target: 'http://192.168.1.72:5227',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    port: 4173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://192.168.1.72:5227',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
