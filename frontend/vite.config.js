import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg', 'og-image.jpg'],
      manifest: {
        name: 'YarnFlow - Tracker Tricot & Crochet',
        short_name: 'YarnFlow',
        description: 'Suivez vos projets tricot et crochet avec des stats avancées et l\'AI Photo Studio',
        theme_color: '#8b5cf6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff,woff2}'],
        globIgnores: ['**/style-examples/**'], // Exclure les images d'exemples trop volumineuses
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB max (au lieu de 2MB)
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\/projects/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-projects-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\/photos/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-photos-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /.*\.pdf$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pdf-patterns-cache',
              expiration: {
                maxEntries: 20, // Maximum 20 PDFs en cache
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 jours
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              // Plugin pour gérer les requêtes cross-origin (Dropbox, Google Drive, etc.)
              plugins: [
                {
                  cacheWillUpdate: async ({ response }) => {
                    // Ne cache que les réponses valides
                    if (response && response.type === 'opaque') {
                      return response
                    }
                    return response && response.status === 200 ? response : null
                  }
                }
              ]
            }
          }
        ]
      },
      devOptions: {
        enabled: false, // Désactivé en dev pour éviter les refresh en boucle
        type: 'module'
      }
    })
  ],
  server: {
    host: true, // Accepter les connexions depuis le réseau local
    port: 5173,
    // Configuration pour WSL (évite les faux positifs du file watcher)
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      '/api': {
        target: 'http://patron-maker.local',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://patron-maker.local',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
