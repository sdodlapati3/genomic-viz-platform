import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use happy-dom for DOM testing (faster than jsdom)
    environment: 'happy-dom',
    
    // Global test utilities
    globals: true,
    
    // Setup files run before each test
    setupFiles: ['./src/__tests__/setup.js'],
    
    // Include patterns
    include: ['src/**/*.{test,spec}.{js,ts}'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.js'],
      exclude: ['src/__tests__/**', 'src/**/*.test.js', 'src/**/*.spec.js']
    },
    
    // Watch mode exclusions
    watchExclude: ['node_modules', 'coverage']
  },
  
  // Vite dev server for demo
  server: {
    port: 3012
  }
});
