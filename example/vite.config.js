import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    sourcemap: true,
  },
  resolve: {
    alias: {
      'ol-esri-styles': path.resolve(__dirname, '../src'), // Alias for your local module
    },
  },
});
