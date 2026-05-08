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
        // Only split things heavy enough that an isolated chunk pays for
        // its own request. Tree-shakeable libs (lucide-react) are left
        // for Rollup to co-locate so unused icons don't ship together;
        // tiny libs (lz-string, zustand) inline into the main bundle.
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  server: { port: 5173, host: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: false,
  },
});
