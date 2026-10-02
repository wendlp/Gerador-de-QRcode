import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Vite config — https://vitejs.dev/config/
export default defineConfig({
  // Configurado para publicar corretamente no GitHub Pages
  base: '/Gerador-de-QRCode/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    minify: true,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})
