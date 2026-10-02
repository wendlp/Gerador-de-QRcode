import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Nome exato com o 'c' minúsculo conforme a URL do seu GitHub Pages
  base: '/Gerador-de-QRcode/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    sourcemap: false,
    minify: true,
  },
})
