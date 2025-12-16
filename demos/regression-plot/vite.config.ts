import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5193,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
