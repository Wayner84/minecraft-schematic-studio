import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // GitHub project pages base path
  base: '/minecraft-schematic-studio/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Online-only mode: don't aggressively cache routes; keep it light.
      workbox: {
        navigateFallback: null,
      },
      manifest: {
        name: 'Minecraft Schematic Studio',
        short_name: 'Schematic',
        description: 'Minecraft 1.21.x Litematica schematic viewer/editor with 3D orbit + layers.',
        start_url: '/minecraft-schematic-studio/',
        scope: '/minecraft-schematic-studio/',
        display: 'standalone',
        background_color: '#0b0f14',
        theme_color: '#0b0f14',
        icons: [
          { src: '/minecraft-schematic-studio/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/minecraft-schematic-studio/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
