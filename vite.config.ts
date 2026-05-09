import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    // PWA: precache the app shell + Shiki WASM so the editor opens
    // offline; use a lightweight Workbox config (no runtime caching) so
    // the service worker stays small and updates auto-deploy.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false, // we ship public/manifest.webmanifest by hand
      includeAssets: [
        'manifest.webmanifest',
        'favicon.svg',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable.png',
      ],
      workbox: {
        // Precache the JS / CSS / HTML shell + Shiki WASM (the only
        // outsized non-JS asset we ship). 5 MB is comfortably above
        // current build size with headroom for new chunks.
        globPatterns: ['**/*.{js,css,html,svg,png,wasm,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Don't navigate-fallback to /index.html in dev — it confuses
        // the Vite dev server's HMR.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /\.[a-zA-Z0-9]+$/],
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        // Don't run the SW in `npm run dev`; it caches stale files
        // during HMR and the workbox runtime takes over fetches we want
        // Vite to handle. Re-enable per-machine via env if debugging.
        enabled: false,
      },
    }),
  ],
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
