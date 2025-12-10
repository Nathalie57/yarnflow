# Guide d'installation Google Analytics 4 pour YarnFlow

Ce guide explique comment configurer Google Analytics 4 (GA4) pour tracker les visiteurs et conversions sur yarnflow.fr.

---

## 📋 Étape 1 : Créer un compte Google Analytics

### 1.1 Créer le compte

1. Va sur **https://analytics.google.com/**
2. Clique sur **"Commencer"** (ou "Start measuring")
3. Connecte-toi avec ton compte Google (crée-en un si nécessaire)

### 1.2 Créer une propriété

1. **Nom du compte** : `YarnFlow`
2. **Nom de la propriété** : `YarnFlow - Production`
3. **Fuseau horaire** : `Europe/Paris`
4. **Devise** : `Euro (EUR)`
5. Clique sur **"Suivant"**

### 1.3 Informations sur l'activité

1. **Secteur d'activité** : `Arts & Entertainment` ou `Software`
2. **Taille de l'entreprise** : `Petite (1-10 employés)`
3. **Objectifs** : Coche :
   - ✅ Examiner le comportement des utilisateurs
   - ✅ Mesurer les conversions
4. Clique sur **"Créer"**
5. Accepte les conditions d'utilisation

### 1.4 Configurer le flux de données

1. Sélectionne **"Web"**
2. **URL du site web** : `https://yarnflow.fr`
3. **Nom du flux** : `YarnFlow Landing`
4. **Mesure améliorée** : Laisse tout coché (scroll, clics, etc.)
5. Clique sur **"Créer un flux"**

---

## 🔑 Étape 2 : Récupérer ton ID de mesure

Après avoir créé le flux, tu verras un écran avec :

```
ID de mesure : G-XXXXXXXXXX
```

**Copie cet ID**, tu en auras besoin à l'étape suivante.

Exemple : `G-ABC123DEF4`

---

## ⚙️ Étape 3 : Ajouter l'ID dans le code

### 3.1 Modifier index.html

1. Ouvre le fichier `frontend/index.html`
2. Trouve la ligne 73 :
   ```javascript
   var GA_ID = 'GA_MEASUREMENT_ID_PLACEHOLDER';
   ```
3. Remplace par ton vrai ID :
   ```javascript
   var GA_ID = 'G-ABC123DEF4'; // ← TON ID ICI
   ```
4. Sauvegarde le fichier

### 3.2 Rebuild et déployer

```bash
cd frontend
npm run build
```

Puis upload le contenu de `frontend/dist/` sur ton serveur.

---

## 📊 Étape 4 : Configurer les conversions (objectifs)

### 4.1 Créer un événement de conversion "waitlist_signup"

1. Dans Google Analytics, va dans **Admin** (roue dentée en bas à gauche)
2. Dans la colonne **Propriété**, clique sur **Événements**
3. Clique sur **Créer un événement**
4. Nom : `waitlist_signup`
5. Clique sur **Marquer comme conversion**

Maintenant, chaque fois qu'une personne s'inscrit à la waitlist, ça sera compté comme une conversion !

### 4.2 (Optionnel) Configurer Google Ads

Si tu veux lancer des pubs Google Ads plus tard, tu devras :

1. Lier ton compte Google Ads à Google Analytics
2. Importer la conversion `waitlist_signup` dans Google Ads
3. Remplacer dans `frontend/src/hooks/useAnalytics.js` ligne 57 :
   ```javascript
   send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL' // Par ton vrai ID de conversion
   ```

---

## ✅ Étape 5 : Vérifier que ça fonctionne

### 5.1 Test en temps réel

1. Va dans **Rapports** → **Temps réel**
2. Ouvre ta landing page : https://yarnflow.fr
3. Tu devrais voir **1 utilisateur actif** apparaître dans les 30 secondes

### 5.2 Test de conversion

1. Inscris-toi à la waitlist avec un email de test
2. Dans **Temps réel**, va dans l'onglet **Événements**
3. Tu devrais voir apparaître : `waitlist_signup` avec +1

---

## 📈 Où voir les statistiques ?

### Taux de rebond (Bounce Rate)

1. Va dans **Rapports** → **Engagement** → **Pages et écrans**
2. Regarde la colonne **"Taux de rebond"**
3. **Objectif : < 60%**

### Conversions (Inscriptions waitlist)

1. Va dans **Rapports** → **Engagement** → **Conversions**
2. Tu verras le nombre de `waitlist_signup`
3. **Objectif : 3-5% des visiteurs**

### Scroll Depth (Jusqu'où les gens lisent)

1. Va dans **Rapports** → **Engagement** → **Événements**
2. Clique sur `scroll`
3. Tu verras combien de gens scrollent à 25%, 50%, 75%, 100%

### Temps passé sur la page

1. Va dans **Rapports** → **Engagement** → **Pages et écrans**
2. Regarde **"Durée d'engagement moyenne"**
3. **Objectif : > 2 minutes**

---

## 🎯 KPIs à surveiller pour YarnFlow

| Métrique | Objectif | Où la voir |
|----------|----------|------------|
| Taux de rebond | < 60% | Engagement > Pages |
| Taux de conversion | 3-5% | Conversions |
| Temps moyen | > 2 min | Engagement > Pages |
| Scroll 50% | > 60% | Événements > scroll |
| Scroll 100% | > 30% | Événements > scroll |

---

## 🔐 Conformité RGPD

Le code GA4 installé inclut déjà :

✅ `anonymize_ip: true` - Anonymisation des IPs
✅ `cookie_flags: SameSite=None;Secure` - Cookies sécurisés

**Ce qu'il te reste à faire (avant lancement officiel) :**

1. Ajouter un **bandeau cookies** (ex: CookieConsent, Tarteaucitron)
2. Créer une **Politique de confidentialité** mentionnant Google Analytics
3. Permettre aux utilisateurs de **refuser le tracking**

---

## 🆘 Problèmes courants

### "Je ne vois pas de visiteurs en temps réel"

- Vérifie que l'ID Google Analytics est bien remplacé dans `index.html`
- Vérifie que tu as bien rebuild et déployé le frontend
- Ouvre la console du navigateur (F12), cherche des erreurs
- Désactive ton bloqueur de pub (uBlock, AdBlock)

### "Les événements ne s'enregistrent pas"

- Vérifie dans la console : tu devrais voir `[Analytics] Event tracked: ...`
- Attends 24h, parfois GA4 met du temps à apparaître dans les rapports
- Vérifie que l'événement est bien marqué comme **conversion**

### "Les conversions ne s'affichent pas"

- Va dans **Admin** → **Événements**
- Vérifie que `waitlist_signup` a le toggle **"Marquer comme conversion"** activé

---

## 📞 Support

Si tu as des problèmes, pose-moi des questions ou consulte :
- Documentation GA4 : https://support.google.com/analytics
- Communauté GA4 : https://www.en.advertisercommunity.com/t5/Google-Analytics-4/bd-p/google-analytics-4

---

**Fichiers modifiés :**
- `frontend/index.html` - Script GA4
- `frontend/src/hooks/useAnalytics.js` - Hook de tracking
- `frontend/src/pages/Landing.jsx` - Tracking inscriptions et scroll

**Créé le** : 2025-11-27
**Version** : 1.0
