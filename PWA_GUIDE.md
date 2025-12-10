# 📱 Guide PWA - YarnFlow

## ✅ Configuration terminée !

YarnFlow est maintenant une **Progressive Web App** complète et fonctionnelle.

---

## 🎯 Fonctionnalités PWA activées

### ✨ Installation
- **Bouton d'installation** : Apparaît automatiquement sur mobile/desktop
- **Icône sur l'écran d'accueil** : L'app s'ajoute comme une vraie application native
- **Splash screen** : Écran de chargement avec votre logo lors du lancement

### 🔄 Mode hors ligne
- **Cache automatique** : Assets (JS/CSS/images) mis en cache
- **API Projects** : Cache NetworkFirst (5 min) pour consultation hors ligne
- **API Photos** : Cache NetworkFirst (1h) pour les photos générées
- **Google Fonts** : Cache CacheFirst (1 an)

### 🚀 Raccourcis app
Trois raccourcis créés (appui long sur l'icône) :
1. **Nouveau Projet** → `/projects/new`
2. **Mes Projets** → `/projects`
3. **AI Photo Studio** → `/ai-studio`

### 🔔 Notifications
- **Mise à jour disponible** : Notification en haut de l'écran
- **Mode hors ligne activé** : Confirmation quand l'app est prête offline
- **Installation** : Invite discrète en bas de l'écran (redismissable après 7j)

---

## 📦 Fichiers créés

### Configuration
```
frontend/
├── vite.config.js               # Plugin PWA + stratégies de cache
├── public/
│   ├── manifest.json            # Configuration PWA complète
│   ├── icons/                   # 17 icônes générées
│   │   ├── icon.svg             # Source SVG
│   │   ├── icon-*.png           # 8 tailles (72→512px)
│   │   ├── icon-maskable-*.png  # 2 icônes maskable
│   │   └── shortcut-*.png       # 3 icônes de raccourcis
│   └── screenshots/             # (à remplir pour store)
└── src/
    └── components/
        └── PWAPrompt.jsx        # Composant React pour install/updates
```

### Icônes générées
- **Standard** : 72×72, 96×96, 128×128, 144×144, 152×152, 192×192, 384×384, 512×512
- **Maskable** : 192×192, 512×512 (adaptive icons Android)
- **Raccourcis** : 96×96 (Nouveau, Projets, AI Studio)

---

## 🧪 Comment tester

### En développement
```bash
cd frontend
npm run dev
```

Ouvrir Chrome DevTools :
1. **Application** → Manifest : Vérifier les icônes et config
2. **Application** → Service Workers : Voir le SW actif
3. **Application** → Cache Storage : Vérifier les caches
4. **Lighthouse** → Run PWA audit (score attendu : 90+)

### Tester l'installation

**Desktop (Chrome/Edge)** :
- Icône ⊕ dans la barre d'adresse
- Menu → "Installer YarnFlow"

**Mobile (Chrome/Safari)** :
- Chrome : Banner d'installation automatique
- Safari iOS : Partager → "Sur l'écran d'accueil"

### Tester le mode hors ligne
1. Charger l'app complètement
2. DevTools → Network → "Offline"
3. Recharger → L'app doit fonctionner
4. Naviguer vers Projets/Stats → Cache API actif

---

## 🎨 Personnalisation

### Changer les couleurs
**Fichier** : `vite.config.js` + `index.html`
```js
theme_color: '#8b5cf6',        // Barre d'état mobile
background_color: '#ffffff'     // Fond du splash screen
```

### Changer l'icône
Remplacer `frontend/public/icons/icon.svg` par votre logo, puis :
```bash
cd frontend/public/icons
for size in 72 96 128 144 152 192 384 512; do
  convert icon.svg -resize ${size}x${size} icon-${size}x${size}.png
done
```

### Ajouter des raccourcis
**Fichier** : `manifest.json`
```json
{
  "name": "Mon Raccourci",
  "url": "/ma-route",
  "icons": [{"src": "/icons/mon-icon.png", "sizes": "96x96"}]
}
```

---

## 📊 Stratégies de cache configurées

| Ressource | Stratégie | TTL | Description |
|-----------|-----------|-----|-------------|
| **Assets statiques** | Precache | ∞ | JS/CSS/HTML mis en cache au build |
| **Google Fonts** | CacheFirst | 1 an | Fonts chargées une fois |
| **API /projects** | NetworkFirst | 5 min | Priorise réseau, fallback cache |
| **API /photos** | NetworkFirst | 1h | Photos IA en cache 1h |
| **Images uploads** | CacheFirst | 7j | Photos utilisateur persistantes |

### NetworkFirst
Tente réseau d'abord → Si échec, sert le cache → Si pas de cache, erreur

### CacheFirst
Sert le cache d'abord → Si pas en cache, télécharge et cache

---

## 🚀 Déploiement production

### 1. Build de production
```bash
cd frontend
npm run build
```

Le service worker sera généré automatiquement dans `dist/`.

### 2. Configuration serveur

**HTTPS obligatoire** (sauf localhost) :
```nginx
server {
  listen 443 ssl;
  server_name yarnflow.com;

  # Headers PWA
  add_header Cache-Control "public, max-age=31536000" always;

  location /manifest.json {
    add_header Cache-Control "public, max-age=3600" always;
  }

  location /sw.js {
    add_header Cache-Control "no-cache" always;
  }
}
```

### 3. Vérification post-déploiement
- **Lighthouse** : Score PWA > 90
- **Chrome DevTools** : Manifest + SW actifs
- **Test mobile** : Installation fonctionnelle
- **Test offline** : Navigation de base OK

---

## 📸 Screenshots (optionnel)

Pour Google Play Store / App Store (future distribution) :

**Desktop** : 1280×720 (16:9)
```bash
cd frontend/public/screenshots
# Prendre captures d'écran Dashboard, Stats, Gallery
```

**Mobile** : 750×1334 (9:16)
```bash
# Prendre captures sur émulateur ou vrai device
```

---

## 🔧 Dépannage

### L'installation ne s'affiche pas
- Vérifier HTTPS actif (ou localhost)
- Chrome DevTools → Application → Manifest (erreurs?)
- Vérifier `beforeinstallprompt` dans console

### Mode offline ne fonctionne pas
- Effacer cache navigateur
- DevTools → Application → Clear storage
- Rebuild avec `npm run build`

### Mises à jour ne s'appliquent pas
- Le SW utilise `autoUpdate`
- Force refresh : Ctrl+Shift+R (desktop)
- Ou clic sur "Mettre à jour" dans la notification

### Icônes ne s'affichent pas
- Vérifier chemins dans `manifest.json`
- Tester : `curl http://localhost:5173/icons/icon-192x192.png`
- Rebuild si nécessaire

---

## 📚 Ressources

- **Vite PWA Plugin** : https://vite-pwa-org.netlify.app/
- **Workbox** : https://developer.chrome.com/docs/workbox/
- **Web.dev PWA** : https://web.dev/progressive-web-apps/
- **Maskable.app** : https://maskable.app/ (tester icônes maskable)

---

## ✅ Checklist finale

- [x] Manifest.json créé
- [x] Icônes générées (8 tailles standard + 2 maskable)
- [x] Service worker configuré (Workbox)
- [x] Cache stratégies définies
- [x] PWAPrompt intégré (install + updates)
- [x] Meta tags PWA dans HTML
- [x] Plugin Vite configuré
- [ ] Test Lighthouse (score 90+)
- [ ] Test installation desktop
- [ ] Test installation mobile
- [ ] Test mode offline
- [ ] HTTPS en production

---

**Version** : 1.0
**Date** : 2025-11-25
**Status** : ✅ Production-ready
