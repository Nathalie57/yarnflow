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
      // [AI:Claude] Désactivé : Vite-PWA générait son propre manifest.webmanifest
      // et injectait un second <link rel="manifest">, en concurrence avec notre
      // public/manifest.json (celui référencé par index.html et par Bubblewrap/
      // Play Store, seul à déclarer share_target). Un seul manifest doit rester.
      manifest: false,
      workbox: {
        // [AI:Claude] Le SW généré par generateSW écrase public/sw.js à chaque
        // build (même nom de fichier). Le partage (Web Share Target) et les
        // push notifications vivent donc dans public/share-handler.js à la
        // place, chargé ici via importScripts() pour survivre à tous les builds.
        importScripts: ['share-handler.js'],
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff,woff2}'],
        globIgnores: ['**/style-examples/**'], // Exclure les images d'exemples trop volumineuses
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB max (au lieu de 2MB)
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // [AI:Claude] Force la mise à jour immédiate du SW après déploiement
        skipWaiting: true,
        clientsClaim: true,
        // Nettoyer les anciens caches quand les noms de fichiers changent
        cleanupOutdatedCaches: true,
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
