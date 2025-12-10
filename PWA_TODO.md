# 📋 PWA - Prochaines étapes recommandées

## ✅ Déjà fait (Configuration de base)

- [x] Plugin vite-plugin-pwa installé
- [x] Manifest.json créé avec config complète
- [x] 13 icônes générées (standard + maskable + raccourcis)
- [x] Service Worker configuré (auto-update)
- [x] Stratégies de cache Workbox (API, fonts, assets)
- [x] PWAPrompt React (install + updates notifications)
- [x] Meta tags PWA dans index.html
- [x] Script de validation PWA (npm run pwa:validate)

---

## 🎯 Améliorations recommandées (Optionnel)

### 1. 📸 Screenshots pour stores

**Pourquoi ?** : Si vous souhaitez distribuer sur Google Play (Trusted Web Activity) ou App Store

**Action** :
```bash
# Desktop (1280x720)
cd frontend/public/screenshots
# Prendre 3-5 captures : Dashboard, Projets, Stats, Gallery

# Mobile (750x1334 ou 1080x1920)
# Utiliser émulateur Chrome DevTools ou vrai appareil
```

**Mettre à jour** : `manifest.json` → `screenshots[]`

---

### 2. 🔔 Notifications Push (optionnel)

**Pourquoi ?** : Rappels de rangs, nouvelles photos IA générées, etc.

**Action** :
```bash
# Installer Firebase ou OneSignal
npm install firebase

# Configurer dans src/firebase.js
# Demander permission : Notification.requestPermission()
```

**Use cases YarnFlow** :
- Rappel : "N'oubliez pas de terminer votre projet Écharpe !"
- Nouveauté : "Vos 3 crédits IA mensuels sont renouvelés"
- Social : "Marie a aimé votre photo de bonnet"

---

### 3. 🔄 Background Sync

**Pourquoi ?** : Sync projets/photos quand connexion revient (après mode offline)

**Action** :
```js
// Dans vite.config.js → workbox
workbox: {
  backgroundSync: {
    options: {
      maxRetentionTime: 24 * 60 // 24 heures
    }
  }
}
```

**Use cases YarnFlow** :
- User crée un projet hors ligne → Sync auto au retour online
- User upload photo hors ligne → Upload auto + génération IA

---

### 4. ⚡ Preload/Prefetch routes

**Pourquoi ?** : Chargement instantané des pages fréquentes

**Action** :
```js
// Dans vite.config.js → workbox → navigationPreload
navigationPreload: true,
runtimeCaching: [
  {
    urlPattern: /^\/(projects|stats|gallery)$/,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'pages-cache',
      networkTimeoutSeconds: 3
    }
  }
]
```

---

### 5. 🎨 Splash Screen personnalisé

**Pourquoi ?** : Branding + meilleure UX au lancement

**Actuellement** : Android génère auto avec `background_color` + icône

**Améliorer (iOS)** :
```html
<!-- index.html -->
<link rel="apple-touch-startup-image"
      href="/splash/iphone-x.png"
      media="(device-width: 375px) and (device-height: 812px)" />
<!-- Répéter pour chaque taille iPhone/iPad -->
```

**Générer** : https://progressier.com/pwa-splash-screen-generator

---

### 6. 📊 Analytics PWA

**Pourquoi ?** : Mesurer taux d'installation, usage offline, etc.

**Action** :
```js
// Tracker installation
window.addEventListener('appinstalled', () => {
  gtag('event', 'pwa_installed');
});

// Tracker usage offline
window.addEventListener('online', () => {
  gtag('event', 'pwa_back_online');
});
```

**Métriques à suivre** :
- Taux d'installation (install / visiteurs)
- Retention 7j/30j (users actifs)
- Temps de session (PWA vs Web)
- Usage offline (% requêtes servies par cache)

---

### 7. 🏪 Google Play Store (TWA)

**Pourquoi ?** : Distribuer YarnFlow comme app Android native

**Prérequis** :
- HTTPS activé
- Manifest.json valide (✅ déjà fait)
- Service Worker actif (✅ déjà fait)
- Digital Asset Links

**Action** :
```bash
# Générer APK avec Bubblewrap
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://yarnflow.com/manifest.json
bubblewrap build

# Upload sur Google Play Console
```

**Coût** : 25$ one-time (compte développeur Google)

---

### 8. 🍎 App Store (iOS)

**Pourquoi ?** : Distribuer sur iOS (plus complexe que Android)

**Options** :
1. **PWABuilder** : Génère app iOS depuis PWA (https://pwabuilder.com)
2. **Capacitor/Ionic** : Wrapper natif
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init
   npx cap add ios
   ```

**Coût** : 99€/an (Apple Developer Program)

---

### 9. 🔐 Share API (partage natif)

**Pourquoi ?** : Partager photos IA via share sheet native

**Action** :
```jsx
// Dans Gallery.jsx
const handleShare = async (photo) => {
  if (navigator.share) {
    await navigator.share({
      title: 'Ma création YarnFlow',
      text: 'Regarde ma création tricot !',
      url: `https://yarnflow.com/photos/${photo.id}`,
      files: [photoFile] // File object
    });
  }
};
```

**Support** : iOS Safari, Android Chrome, Windows Edge

---

### 10. 📦 Periodic Background Sync (future)

**Pourquoi ?** : Sync auto données même app fermée (Android uniquement)

**Status** : Experimental API, pas encore recommandé prod

**Use case** : Auto-sync projets toutes les 12h

---

## 🚀 Priorités suggérées

### Phase 1 (Lancement BETA) - Déjà fait ✅
- [x] Configuration PWA de base
- [x] Installation fonctionnelle
- [x] Mode offline basique

### Phase 2 (Public launch) - 1-2 semaines
- [ ] Screenshots (3 desktop + 3 mobile)
- [ ] Analytics PWA (install rate, retention)
- [ ] Share API (partage photos IA)
- [ ] Test Lighthouse score 95+

### Phase 3 (Croissance) - 1-3 mois
- [ ] Notifications push (rappels + engagement)
- [ ] Background Sync (offline first)
- [ ] Google Play Store (TWA)

### Phase 4 (Maturité) - 6+ mois
- [ ] App Store iOS (si traction)
- [ ] Splash screens custom
- [ ] Preload avancé

---

## 📚 Ressources utiles

**Outils de test** :
- Lighthouse : https://web.dev/measure/
- PWA Builder : https://pwabuilder.com
- Maskable.app : https://maskable.app/

**Documentation** :
- web.dev PWA : https://web.dev/progressive-web-apps/
- MDN Service Workers : https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- Workbox : https://developer.chrome.com/docs/workbox/

**Communauté** :
- r/PWA : https://reddit.com/r/PWA
- PWA Slack : https://pwa-slack.herokuapp.com/

---

**Dernière mise à jour** : 2025-11-25
**Version YarnFlow** : 0.11.0
