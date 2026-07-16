import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparé du reste : change rarement, se met en cache long terme
          // côté navigateur indépendamment du code applicatif.
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Regroupées ensemble : librairies d'animation, lourdes, déjà
          // chargées en différé (CursorEffect en lazy) pour les pages qui
          // n'en ont pas besoin (login, dashboard, admin…).
          'vendor-animations': ['gsap', 'framer-motion'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/pdfs': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
});
