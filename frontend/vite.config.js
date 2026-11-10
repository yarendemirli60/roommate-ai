import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Local presentation gateway; existing Django source is unchanged.
const backendTarget = 'http://127.0.0.1:8000'
const apiProxy = {
  target: backendTarget,
  changeOrigin: true,
  rewrite: (path) => path.startsWith('/api/session-csrf/') ? '/admin/login/' : path,
  configure(proxy) {
    // Match the loopback upstream origin. Django CSRF token checks remain enabled.
    proxy.on('proxyReq', (proxyReq, req) => {
      if (req.headers.origin) proxyReq.setHeader('Origin', backendTarget)
      if (req.headers.referer) proxyReq.setHeader('Referer', `${backendTarget}/`)
    })
  },
}

export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: { '/api': apiProxy } },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true, proxy: { '/api': apiProxy } },
})
