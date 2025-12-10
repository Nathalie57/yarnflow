# Questions à poser à l'utilisatrice - Bug création de projet

**Date** : 2025-12-07
**Bug** : Erreur lors de la création d'un projet avec section et patron PDF
**Statut** : Non reproductible par l'admin

---

## 📋 Questions à poser

### 1. **Nombre de projets existants** ⭐ PRIORITÉ MAX

> Combien de projets avez-vous déjà créés dans YarnFlow ?

**Pourquoi** : Les comptes FREE sont limités à **3 projets**. Si elle en a déjà 3, c'est normal qu'elle ne puisse pas en créer un 4ème.

**Si elle a 3 projets ou plus** :
- C'est la cause du bug ✅
- Lui proposer de :
  - Supprimer un ancien projet pour en créer un nouveau
  - Ou passer à l'abonnement PRO (4.99€/mois, projets illimités)

---

### 2. **Type d'abonnement**

> Quel est votre type d'abonnement actuellement ?
> - [ ] Gratuit (FREE)
> - [ ] Pro (4.99€/mois)
> - [ ] Early Bird (2.99€/mois)

**Pourquoi** : Vérifier qu'elle n'a pas un abonnement expiré qui la remet en FREE.

---

### 3. **Appareil et navigateur**

> Pouvez-vous me donner ces informations sur votre appareil :
> - Téléphone : ________________ (ex: Samsung Galaxy S21, iPhone 13, etc.)
> - Système : Android ou iOS ? Quelle version ? ________________
> - Navigateur : Chrome, Firefox, Safari, Samsung Internet, autre ? ________________
> - Avez-vous installé YarnFlow comme application (PWA) ? Oui / Non

**Pourquoi** : Certains navigateurs mobiles ont des bugs spécifiques avec les uploads de fichiers.

---

### 4. **Connexion internet**

> Quelle était votre connexion internet au moment de l'erreur ?
> - [ ] WiFi
> - [ ] 4G/5G
> - [ ] 3G ou réseau lent

**Pourquoi** : Les uploads de fichiers PDF peuvent échouer sur connexions lentes ou instables.

---

### 5. **Taille du fichier PDF**

> Quelle est la taille du fichier PDF "Comment tricoter des chaussettes facilement.pdf" ?
> (Regarder dans les propriétés du fichier)

**Pourquoi** : La limite est de **10MB**. Au-delà, l'upload échoue.

---

### 6. **Le bug se reproduit-il ?**

> Avez-vous réessayé depuis ? Le problème persiste-t-il ?
> - [ ] Oui, j'ai le même problème à chaque fois
> - [ ] Non, ça a fonctionné la 2ème fois
> - [ ] Je n'ai pas réessayé

**Si ça fonctionne maintenant** : C'était probablement un problème temporaire (réseau, serveur surchargé).

---

### 7. **Détails techniques (IMPORTANT pour debug)**

> Pouvez-vous ouvrir la console du navigateur et refaire exactement la même manipulation ?
>
> **Instructions** :
> 1. Sur Chrome mobile : Menu (⋮) → Plus d'outils → Outils de développement → Console
> 2. Sur Firefox mobile : Menu → Paramètres → À propos de Firefox → Appuyer 5 fois sur le logo → Activer le débogage
> 3. Refaire la création de projet exactement comme sur les captures
> 4. Faire une capture d'écran de la console avec tous les messages d'erreur
> 5. M'envoyer la capture

**Pourquoi** : Avec les nouvelles améliorations, les logs `[PROJECT CREATE]` montreront **exactement** quelle étape échoue.

---

## 🎯 Diagnostic rapide

### ✅ Si elle a 3 projets FREE
**Cause** : Quota atteint
**Solution** : Supprimer un projet ou passer PRO

### ✅ Si le fichier PDF fait >10MB
**Cause** : Fichier trop volumineux
**Solution** : Compresser le PDF ou utiliser un lien web à la place

### ✅ Si elle utilise un vieux navigateur Android
**Cause** : Bug navigateur
**Solution** : Mettre à jour Chrome ou utiliser Firefox

### ✅ Si connexion 3G/réseau lent
**Cause** : Timeout pendant l'upload
**Solution** : Réessayer en WiFi

### ✅ Si aucune de ces conditions
**Cause** : Bug serveur temporaire
**Solution** : Les améliorations que j'ai faites permettront de diagnostiquer la prochaine fois

---

## 📝 Message à envoyer à l'utilisatrice

Bonjour,

Merci beaucoup pour votre retour et vos captures d'écran ! 🙏

J'ai analysé le problème et j'ai fait des améliorations pour mieux identifier l'erreur. Cependant, j'ai besoin de quelques informations pour comprendre ce qui s'est passé :

**Question la plus importante** : Combien de projets avez-vous actuellement dans YarnFlow ? (Les comptes gratuits sont limités à 3 projets)

Pourriez-vous également me préciser :
- Quel navigateur utilisez-vous ? (Chrome, Firefox, Safari...)
- Quelle taille fait le fichier PDF que vous essayiez d'ajouter ?
- Le problème persiste-t-il si vous réessayez ?

Si vous pouvez ouvrir la console du navigateur (Menu → Plus d'outils → Console) et refaire la même manipulation, les nouveaux logs m'indiqueront exactement où se situe le problème.

Merci encore et désolé pour ce désagrément ! 🧶

---

## 🔧 Correctifs appliqués (même si bug non reproductible)

Même si je n'ai pas pu reproduire le bug, j'ai quand même amélioré la gestion d'erreurs :

✅ Messages d'erreur **détaillés** selon l'étape qui échoue
✅ Indicateur visuel de **progression** (Création du projet... → Création des sections... → Upload du patron...)
✅ Logging complet `[PROJECT CREATE]` pour faciliter le debug
✅ **Récupération intelligente** : si le projet est créé mais section/patron échoue, le projet reste accessible

Ces améliorations seront utiles pour tous les futurs bugs et amélioreront l'expérience utilisateur. 👍
