# Guide de Debug - Erreur Création de Projet

**Date** : 2025-12-07
**Bug reporté** : Erreur lors de la création d'un projet avec patron PDF et section

---

## 📋 Résumé du problème

L'utilisateur a rempli correctement le formulaire de création de projet :
- ✅ Nom : "Chaussettes petit pas"
- ✅ Technique : Tricot
- ✅ Catégorie : Vêtements
- ✅ Description : "Première réalisation de chaussettes"
- ✅ Section : "2 ème chaussette"
- ✅ Patron PDF : "Comment tricoter des chaussettes facilement.pdf"

Mais reçoit une erreur générique : **"❌ Erreur - Erreur lors de la création du projet"**

---

## 🔧 Modifications apportées

### 1. Amélioration de la gestion d'erreurs (frontend/src/pages/MyProjects.jsx)

**Avant** :
```javascript
catch (err) {
  showAlert('❌ Erreur', err.response?.data?.error || 'Erreur lors de la création du projet', 'error')
}
```

**Après** :
- ✅ **Détection de l'étape qui échoue** : création projet / sections / patron
- ✅ **Messages d'erreur détaillés** selon l'étape
- ✅ **Logging complet dans la console** pour debug
- ✅ **Indicateur visuel** de l'étape en cours
- ✅ **Récupération intelligente** : si le projet est créé mais section/patron échoue, le projet est quand même affiché

### 2. Indicateurs de progression

Le bouton "Créer le projet" affiche maintenant l'étape en cours :
- "Création du projet..."
- "Création de 1 section(s)..."
- "Upload du patron..."
- "Enregistrement du lien patron..."
- "Liaison du patron..."

### 3. Logging détaillé

Tous les logs commencent par `[PROJECT CREATE]` pour faciliter le debug :
```javascript
console.log('[PROJECT CREATE] Étape 1: Création du projet...', formData)
console.log('[PROJECT CREATE] ✓ Projet créé avec ID:', newProject.id)
console.log('[PROJECT CREATE] Étape 2: Création de 1 section(s)...')
console.log('[PROJECT CREATE] Création section 1/1:', sections[0].name)
console.log('[PROJECT CREATE] ✓ Sections créées')
console.log('[PROJECT CREATE] Étape 3: Upload du patron (fichier)...', {
  name: patternFile.name,
  type: patternFile.type,
  size: patternFile.size
})
console.log('[PROJECT CREATE] ✓ Patron uploadé')
```

---

## 🧪 Comment reproduire et obtenir les détails du bug

### Étape 1 : Déployer la nouvelle version

```bash
# Frontend (depuis /frontend)
npm run build
# Puis déployer sur Vercel/Railway
```

### Étape 2 : Reproduire le bug avec la console ouverte

1. **Ouvrir la console du navigateur** (F12 ou Cmd+Option+I)
2. **Aller dans l'onglet "Console"**
3. **Remplir le formulaire de création de projet** comme sur les captures d'écran
4. **Cliquer sur "Créer le projet"**
5. **Observer l'étape qui s'affiche** dans le bouton (Création du projet... / Création de sections... / Upload du patron...)
6. **Noter le message d'erreur exact** qui apparaît dans :
   - La popup de l'application
   - La console du navigateur (logs `[PROJECT CREATE]`)

### Étape 3 : Partager les informations

**Copier tous les logs de la console** qui commencent par `[PROJECT CREATE]` et les envoyer.

Exemple de ce qu'on devrait voir :
```
[PROJECT CREATE] Étape 1: Création du projet... {name: "Chaussettes petit pas", technique: "tricot", ...}
[PROJECT CREATE] ✓ Projet créé avec ID: 123
[PROJECT CREATE] Étape 2: Création de 1 section(s)...
[PROJECT CREATE] Création section 1/1: 2 ème chaussette
[PROJECT CREATE] ❌ Erreur lors de la création des sections: Error: ...
[PROJECT CREATE] Détails erreur: {error: "...", message: "..."}
```

---

## 🔍 Messages d'erreur possibles

### Si l'erreur est à l'étape "Création du projet"
```
❌ Erreur
Impossible de créer le projet. Vérifiez votre connexion internet.
```
**Cause probable** : Problème réseau, quota atteint, ou erreur serveur

### Si l'erreur est à l'étape "Création des sections"
```
❌ Erreur
Le projet a été créé mais erreur lors de la création des sections.
Vous pouvez ajouter les sections manuellement depuis le projet.
```
**Cause probable** : Nom de section invalide, problème BDD

### Si l'erreur est à l'étape "Upload du patron"
```
❌ Erreur
Le projet a été créé mais erreur lors de l'upload du fichier patron.
Vous pouvez ajouter le patron manuellement depuis le projet.
```
**Cause probable** :
- Fichier trop volumineux (>10MB)
- Type de fichier non autorisé
- Dossier `uploads/patterns/` n'existe pas ou permissions insuffisantes
- Problème de timeout

---

## 🛠️ Vérifications à faire sur le serveur O2Switch

### 1. Vérifier que le dossier uploads existe

```bash
# SSH sur O2Switch
cd /home/yarnflow/public_html/api/public
ls -la uploads/patterns/
```

Si le dossier n'existe pas :
```bash
mkdir -p uploads/patterns
chmod 755 uploads/patterns
```

### 2. Vérifier les permissions

```bash
# Les dossiers doivent avoir 755, les fichiers 644
find uploads -type d -exec chmod 755 {} \;
find uploads -type f -exec chmod 644 {} \;
```

### 3. Vérifier la taille max d'upload PHP

```bash
php -i | grep upload_max_filesize
php -i | grep post_max_size
```

Doit être au minimum 10M. Si ce n'est pas le cas, modifier `.htaccess` :
```apache
php_value upload_max_filesize 10M
php_value post_max_size 10M
```

### 4. Vérifier les logs d'erreur PHP sur le serveur

```bash
tail -f ~/logs/error_log
# ou
tail -f /home/yarnflow/public_html/api/error_log
```

---

## 📊 Prochaines étapes

1. ✅ **Déployer la nouvelle version** avec gestion d'erreurs améliorée
2. ⏳ **Reproduire le bug** avec la console ouverte
3. ⏳ **Analyser les logs** pour identifier l'étape exacte qui échoue
4. ⏳ **Corriger le problème** selon l'étape identifiée
5. ⏳ **Tester** que tout fonctionne correctement

---

## 💡 Hypothèse la plus probable

Basé sur les captures d'écran, le problème vient probablement de :

1. **Upload du fichier patron PDF** qui échoue sur le serveur de production
   - Dossier `uploads/patterns/` inexistant
   - Permissions insuffisantes
   - Taille max d'upload trop petite

2. **Création de la section** avec un caractère spécial
   - Le nom "2 ème chaussette" contient un espace insécable (è) qui pourrait poser problème

---

## 📝 Notes

- Le code local WAMP fonctionne correctement (logs du 5 décembre montrent des uploads réussis)
- Le problème est spécifique à l'environnement de PRODUCTION (yarnflow.fr)
- Les améliorations permettront d'identifier rapidement le problème exact
