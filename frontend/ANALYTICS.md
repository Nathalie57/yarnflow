# 📊 Guide Analytics - YarnFlow

## 🎯 Choix de la solution

### Option 1 : **Plausible Analytics** (Recommandé ⭐)

**Avantages** :
- ✅ 100% conforme RGPD (pas de cookie banner requis)
- ✅ Léger (< 1KB)
- ✅ Dashboard simple et clair
- ✅ Respect de la vie privée
- ✅ Hébergé en UE

**Inconvénients** :
- ❌ Payant : 9€/mois (gratuit 30 jours trial)

**Installation** :

1. **Créer compte** : https://plausible.io/register
2. **Ajouter site** : `yarnflow.com` ou votre domaine
3. **Obtenir le script** : Copier le code fourni
4. **Décommenter dans `index.html`** :
   ```html
   <script defer data-domain="yarnflow.com" src="https://plausible.io/js/script.js"></script>
   ```
5. **Deploy** : Push sur Git, Vercel redéploie automatiquement

**Tracking events waitlist** :

Dans `Landing.jsx`, après inscription waitlist réussie :
```javascript
// Après axios.post(...) réussi
if (window.plausible) {
  window.plausible('Waitlist Signup', { props: { email: email } });
}
```

**Dashboard** : https://plausible.io/yarnflow.com

---

### Option 2 : **Google Analytics 4** (Gratuit)

**Avantages** :
- ✅ Gratuit
- ✅ Puissant (rapports avancés, funnels, etc.)
- ✅ Intégration Google Ads/Search Console

**Inconvénients** :
- ❌ Cookie banner OBLIGATOIRE (RGPD)
- ❌ Complexe
- ❌ Google track les users

**Installation** :

1. **Créer propriété GA4** : https://analytics.google.com
2. **Obtenir Measurement ID** : Format `G-XXXXXXXXXX`
3. **Installer react-ga4** :
   ```bash
   cd frontend
   npm install react-ga4
   ```

4. **Initialiser dans `main.jsx`** :
   ```javascript
   import ReactGA from 'react-ga4';

   // Après le DOM load
   ReactGA.initialize('G-XXXXXXXXXX');
   ```

5. **Tracking events waitlist dans `Landing.jsx`** :
   ```javascript
   import ReactGA from 'react-ga4';

   // Après inscription réussie
   ReactGA.event({
     category: 'Waitlist',
     action: 'Signup',
     label: email
   });
   ```

6. **Cookie Banner** (OBLIGATOIRE RGPD) :
   Utiliser `react-cookie-consent` :
   ```bash
   npm install react-cookie-consent
   ```

   Dans `App.jsx` :
   ```javascript
   import CookieConsent from "react-cookie-consent";

   <CookieConsent
     location="bottom"
     buttonText="J'accepte"
     declineButtonText="Refuser"
     enableDeclineButton
     onAccept={() => {
       ReactGA.initialize('G-XXXXXXXXXX');
     }}
   >
     Nous utilisons des cookies pour analyser le trafic du site.
   </CookieConsent>
   ```

---

### Option 3 : **Aucun analytics** (Phase Waitlist)

**Avantages** :
- ✅ Simple
- ✅ Pas de config
- ✅ Pas de cookies

**Inconvénients** :
- ❌ Aucune donnée sur le trafic
- ❌ Impossible de mesurer conversion

**Alternative** : Compter manuellement les inscriptions depuis Database Railway

---

## 📊 Métriques à tracker (Waitlist)

### Essentielles
- **Visiteurs uniques** : Combien de personnes visitent la landing
- **Inscriptions waitlist** : Nombre d'emails collectés
- **Taux de conversion** : `(Inscriptions / Visiteurs) × 100`
- **Sources de trafic** : Reddit, Twitter, ProductHunt, Direct

### Objectifs Semaine 1
- 500-1000 visiteurs
- 100-200 inscriptions waitlist
- Taux conversion : 15-25%

### Objectifs Mois 1
- 5000+ visiteurs
- 500-1000 inscriptions waitlist
- Identifier top 3 sources trafic

---

## 🎯 Goals à configurer

### Plausible
- **Goal 1** : Waitlist Signup (event)
- **Goal 2** : Page CGU visitée (pageview)
- **Goal 3** : Scroll 75% de la landing (event custom)

### Google Analytics 4
- **Conversion 1** : waitlist_signup
- **Conversion 2** : legal_page_view
- **Conversion 3** : scroll_depth_75

---

## 🚨 Important RGPD

### Avec Plausible
- ✅ Pas de cookie banner requis
- ✅ Pas de consentement requis
- ✅ Mention dans Privacy Policy suffit

### Avec Google Analytics
- ⚠️ Cookie banner OBLIGATOIRE
- ⚠️ Consentement REQUIS avant tracking
- ⚠️ Opt-out facilement accessible
- ⚠️ Mentionner dans Privacy Policy + Cookie Policy

---

## 🔧 Test Analytics

1. **Déployer** avec script analytics
2. **Vérifier installation** :
   - Plausible : Console → `window.plausible` doit exister
   - GA4 : Console → `window.dataLayer` doit exister
3. **Tester event** :
   - S'inscrire à la waitlist
   - Vérifier dashboard analytics (délai ~30sec)
4. **Vérifier goal** :
   - Event "Waitlist Signup" doit apparaître

---

## 💡 Recommandation

**Pour Phase Waitlist** : **Plausible** ⭐

Pourquoi ?
- Simple
- RGPD-friendly (pas de cookie banner)
- Dashboard clair pour KPIs essentiels
- 9€/mois bien investi pour insights

**Si budget 0€** : Attendre Phase BETA et utiliser GA4 avec cookie banner.

---

## 📞 Support

- **Plausible** : https://plausible.io/docs
- **Google Analytics** : https://support.google.com/analytics
