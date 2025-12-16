import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5192,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
});
