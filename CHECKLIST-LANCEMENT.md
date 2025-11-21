# ✅ CHECKLIST LANCEMENT - YarnFlow Option 1 (Waitlist)

## 📝 AVANT LE LANCEMENT

### 1. Pages Légales
- [x] Page CGU créée (`/cgu`)
- [x] Page Politique de Confidentialité créée (`/privacy`)
- [x] Page Mentions Légales créée (`/mentions`)
- [ ] **Remplacer `[Votre Nom/Société]` par vos vraies infos**
- [ ] **Ajouter SIRET, TVA, adresse dans Mentions Légales**
- [ ] **Ajouter email de contact partout**
- [ ] Liens footer testés

### 2. Hébergement & Déploiement
- [ ] Compte Vercel créé
- [ ] Compte Railway créé
- [ ] Repository GitHub créé et pushé
- [ ] Frontend déployé sur Vercel
- [ ] Backend déployé sur Railway
- [ ] Database MySQL Railway configurée
- [ ] Schemas SQL importés dans Railway DB
- [ ] URLs production notées :
  - Frontend : `_________________`
  - Backend : `_________________`

### 3. Variables d'Environnement

#### Vercel (Frontend)
- [ ] `VITE_API_URL` = URL backend Railway

#### Railway (Backend)
- [ ] Database credentials (auto depuis Railway MySQL)
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_URL` = URL backend Railway
- [ ] `FRONTEND_URL` = URL frontend Vercel
- [ ] `JWT_SECRET` = **GÉNÉRÉ ET SÉCURISÉ** (run `scripts/generate-jwt-secret.sh`)
- [ ] `GEMINI_API_KEY` = Clé API Gemini production
- [ ] Stripe keys (test OK pour waitlist)

### 4. Sécurité
- [ ] JWT Secret généré (≠ de celui en .env.example)
- [ ] CORS configuré pour URL Vercel uniquement
- [ ] `.env` ajouté dans `.gitignore`
- [ ] Aucun secret commité sur GitHub
- [ ] HTTPS activé (auto par Vercel/Railway)

### 5. Domaine (Optionnel mais recommandé)
- [ ] Domaine acheté (ex: yarnflow.com)
- [ ] DNS configuré sur Vercel
- [ ] SSL actif (auto)
- [ ] Redirection www → non-www (ou inverse)
- [ ] Emails `@yarnflow.com` configurés (optionnel)

---

## 🧪 TESTS AVANT LANCEMENT

### Frontend
- [ ] Landing page s'affiche correctement
- [ ] Formulaire waitlist visible
- [ ] Design responsive (mobile/tablet/desktop)
- [ ] Images chargent correctement
- [ ] Liens footer fonctionnent (`/cgu`, `/privacy`, `/mentions`)
- [ ] Scroll smooth fonctionne
- [ ] Early Bird banner visible
- [ ] Compteur waitlist fonctionne

### Backend
- [ ] API accessible : `https://BACKEND/api/health` → 200 OK
- [ ] Inscription waitlist fonctionne
- [ ] Email enregistré dans DB Railway
- [ ] Pas de duplicate email
- [ ] Logs d'erreurs vides (Railway Logs)

### Test Complet E2E
1. [ ] Ouvrir landing page production
2. [ ] S'inscrire à la waitlist avec email test
3. [ ] Vérifier dans Railway DB que l'email est enregistré
4. [ ] Vérifier compteur waitlist incrémente (+1)
5. [ ] Tester sur mobile
6. [ ] Tester sur différents navigateurs (Chrome, Firefox, Safari)

---

## 📊 ANALYTICS & TRACKING

### Option 1 : Plausible Analytics (Recommandé - RGPD friendly)
- [ ] Compte Plausible créé (trial gratuit)
- [ ] Script ajouté dans `frontend/index.html`
- [ ] Site vérifié sur Plausible
- [ ] Goal "Waitlist Signup" configuré

### Option 2 : Google Analytics 4 (Gratuit)
- [ ] Propriété GA4 créée
- [ ] `react-ga4` installé : `npm install react-ga4`
- [ ] GA tracking code ajouté
- [ ] Event "waitlist_signup" configuré
- [ ] Cookie banner ajouté (obligatoire RGPD)

---

## 🚀 JOUR DU LANCEMENT

### Matin (9h-12h)
- [ ] Dernier test complet E2E
- [ ] Vérifier Railway/Vercel status (pas de maintenance)
- [ ] Préparer posts réseaux sociaux
- [ ] Préparer email aux proches/early testers

### Lancement (12h-14h)
- [ ] Post sur Twitter/X
- [ ] Post sur Reddit (r/crochet, r/knitting, r/SideProject)
- [ ] Post sur LinkedIn
- [ ] Post sur Instagram/Facebook
- [ ] Email à liste personnelle
- [ ] Post sur ProductHunt (optionnel, attendre 50+ emails)

### Après-midi (14h-18h)
- [ ] Répondre aux commentaires/questions
- [ ] Monitorer analytics (trafic, conversions)
- [ ] Vérifier logs erreurs Railway
- [ ] Noter feedback utilisateurs

### Soir (18h-22h)
- [ ] Recap nombre d'inscrits waitlist
- [ ] Identifier problèmes/bugs
- [ ] Planifier hotfixes si nécessaire
- [ ] Préparer communication J+1

---

## 📈 SUIVI POST-LANCEMENT

### Semaine 1
- [ ] Check quotidien Analytics
- [ ] Répondre emails/messages
- [ ] Documenter feedback
- [ ] Ajuster landing si taux conversion <20%

### Objectifs Semaine 1
- [ ] 100 emails waitlist
- [ ] Identifier 10-20 beta testers potentiels
- [ ] 0 erreur critique

### Semaine 2-4
- [ ] 500 emails waitlist (objectif)
- [ ] Préparer transition vers BETA fermée
- [ ] Implémenter système d'invitation BETA
- [ ] Préparer onboarding BETA testers

---

## 🛑 PLAN DE CRISE

### Si le site est down
1. Check Vercel/Railway status
2. Vérifier logs Railway
3. Rollback si nécessaire (Vercel/Railway ont historique)
4. Communiquer sur Twitter

### Si trop de trafic (peu probable waitlist)
1. Railway auto-scale (payant)
2. Activer Vercel Pro si nécessaire ($20/mois)
3. Optimiser queries DB

### Si problème RGPD/légal
1. Consulter avocat/expert
2. Mettre page maintenance le temps de corriger
3. Informer utilisateurs si data breach

---

## 📞 CONTACTS UTILES

- **Support Vercel** : https://vercel.com/support
- **Support Railway** : https://railway.app/help
- **Support Stripe** : https://support.stripe.com
- **CNIL** : https://www.cnil.fr

---

## ✅ VALIDATION FINALE

**Je confirme avoir :**
- [ ] Testé E2E complet
- [ ] Remplacé tous les placeholders par vraies infos
- [ ] Vérifié sécurité (JWT, CORS, HTTPS)
- [ ] Préparé communication lancement
- [ ] Configuré analytics
- [ ] Noté toutes URLs production

**Prêt à lancer ?** → GO ! 🚀

---

**Date de lancement prévue** : _______________
**Signature** : _______________
