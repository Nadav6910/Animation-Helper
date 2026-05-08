import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-state': ['zustand'],
          'vendor-icons': ['lucide-react'],
          'vendor-share': ['lz-string'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  server: { port: 5173, host: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: false,
  },
});
