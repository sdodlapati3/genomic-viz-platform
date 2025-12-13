import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3007,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  optimizeDeps: {
    include: ['d3']
  }
});
