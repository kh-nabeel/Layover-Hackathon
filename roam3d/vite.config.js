// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  // Allow the maplibre worker to be bundled correctly
  worker: {
    format: 'es',
  },
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
})
