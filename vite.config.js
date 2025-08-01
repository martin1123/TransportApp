import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'TransportApp',
        short_name: 'Transport',
        description: 'Tu app de transporte moderna',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
  {
    src: '/pwa-192x192.png',
    sizes: '192x192',
    type: 'image/png'
  },
  {
    src: '/pwa-512x512.png',
    sizes: '512x512',
    type: 'image/png'
  },
  {
    src: '/pwa-512x512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any maskable'
  }
]
      }
    })
  ], 
  resolve: {
    alias: {
      '@': '/src', 
    },
  },
  server: {
    port: 4000, 
    open: true, 
  },
})