export default {
  base: '/ol-esri-style/',
  build: {
    sourcemap: true,
  },
  resolve: {
    alias: {
      'ol-esri-styles': path.resolve(__dirname, '../src'),
    },
  },
};
