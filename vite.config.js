import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0', // Доступ с Android приставки
    port: 5173
  },
  build: {
    target: 'esnext',
    outDir: 'dist'
  }
})
