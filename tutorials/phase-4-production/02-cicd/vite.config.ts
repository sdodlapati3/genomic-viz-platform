import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Build configuration
  build: {
    // Output directory
    outDir: 'dist',
    
    // Generate source maps for debugging (disable for production)
    sourcemap: process.env.NODE_ENV !== 'production',
    
    // Use esbuild for minification (default, faster)
    minify: 'esbuild',
    
    // Rollup options for chunking
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        // Chunk naming for cache busting
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        
        // Manual chunks for better caching
        manualChunks: {
          // Vendor chunk for third-party libraries
          vendor: ['d3'],
        },
      },
    },
    
    // Asset size warnings
    chunkSizeWarningLimit: 500,
    
    // Report compressed sizes
    reportCompressedSize: true,
  },
  
  // Development server
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  
  // Preview server (for testing production builds)
  preview: {
    port: 4173,
  },
  
  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@components': resolve(__dirname, 'src/components'),
      '@data': resolve(__dirname, 'src/data'),
    },
  },
  
  // Define environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  
  // Optimization
  optimizeDeps: {
    include: ['d3'],
  },
  
  // Test configuration (Vitest)
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
