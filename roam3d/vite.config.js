// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages publishes this repository at /Layover-Hackathon/.
  base: process.env.GITHUB_ACTIONS ? '/Layover-Hackathon/' : '/',
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
