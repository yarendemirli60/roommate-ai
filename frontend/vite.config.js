import process from 'node:process'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const backendTarget = process.env.ROOMMATE_BACKEND_URL || 'http://127.0.0.1:8000'
const apiProxy = {
  target: backendTarget,
  changeOrigin: true,
  configure(proxy) {
    // Match the loopback upstream origin. Django CSRF token checks remain enabled.
    proxy.on('proxyReq', (proxyReq, req) => {
      if (req.headers.origin) proxyReq.setHeader('Origin', backendTarget)
      if (req.headers.referer) proxyReq.setHeader('Referer', `${backendTarget}/`)
    })
  },
}

export default defineConfig({
  envDir: fileURLToPath(new URL('..', import.meta.url)),
  plugins: [react()],
  optimizeDeps: { include: ['leaflet'] },
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: { '/api': apiProxy } },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true, proxy: { '/api': apiProxy } },
})
