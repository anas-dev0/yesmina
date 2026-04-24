import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/yesmina/',
  server: {
    port: 3000,
    open: true,
    allowedHosts: ['cead-41-62-54-241.ngrok-free.app']
  },
})
