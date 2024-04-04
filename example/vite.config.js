import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/ol-esri-styles/',
  build: {
    sourcemap: true,
  },
  resolve: {
    alias: {
      'ol-esri-styles': path.resolve(__dirname, '../src'),
    },
  },
});

