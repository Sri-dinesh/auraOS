import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@auraos/ui': resolve(__dirname, '../../packages/ui/src'),
      '@auraos/rules': resolve(__dirname, '../../packages/rules/src'),
      '@auraos/types': resolve(__dirname, '../../packages/types/src'),
      '@auraos/contracts': resolve(__dirname, '../../packages/contracts/src'),
      '@auraos/validation': resolve(__dirname, '../../packages/validation/src'),
    },
  },
});
