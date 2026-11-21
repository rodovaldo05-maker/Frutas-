import { defineConfig } from 'vite';

// base relativa: o mesmo build roda no navegador, offline e dentro do APK (Capacitor)
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    chunkSizeWarningLimit: 4000,
    assetsInlineLimit: 0,
  },
  server: { host: true },
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
  },
});
