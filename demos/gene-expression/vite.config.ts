import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5191,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
});
