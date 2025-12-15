import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5183,
  },
  build: {
    outDir: 'dist',
  },
});
