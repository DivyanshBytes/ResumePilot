import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Any request to /api is forwarded to our backend
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
});