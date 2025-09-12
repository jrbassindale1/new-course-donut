import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/bsc-arch/',   // <- your subfolder, include leading & trailing slashes
})