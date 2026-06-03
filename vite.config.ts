import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    // When VITE_API_URL points to an external host, proxy is not needed.
    // But for localhost dev we need the proxy to avoid CORS.
    const isLocalDev = !env.VITE_API_URL || env.VITE_API_URL.includes('localhost') || env.VITE_API_URL.includes('127.0.0.1')
    const proxyTarget = isLocalDev ? 'https://speakvn-backend-379382117476.asia-southeast1.run.app' : env.VITE_API_URL?.replace('/api/v1', '') ?? 'https://speakvn-backend-379382117476.asia-southeast1.run.app'

    return {
        plugins: [react()],
        define: {
            global: 'window',
        },
        server: {
            proxy: {
                '/api': {
                    target: proxyTarget,
                    changeOrigin: true,
                },
                '/ws': {
                    target: proxyTarget,
                    changeOrigin: true,
                    ws: true,
                },
            },
        },
    }
})

