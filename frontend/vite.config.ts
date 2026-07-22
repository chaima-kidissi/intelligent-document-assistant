import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/chat': 'http://backend:8000',
      '/documents': 'http://backend:8000',
      '/upload': 'http://backend:8000',
      '/admin': 'http://backend:8000',
      '/me': 'http://backend:8000',
    },
  },
})
