# Guide Web Fetch API

## 📋 Vue d'ensemble

Ce service permet de récupérer le contenu HTML de sites externes qui bloquent normalement les requêtes automatiques (curl, fetch sans headers). Il imite un navigateur réel pour contourner ces protections.

**Cas d'usage :**
- Récupérer des aperçus de liens de patrons (Ravelry, blogs tricot)
- Extraire les métadonnées OpenGraph (titre, description, image)
- Afficher des previews de sites dans l'app

---

## 🔧 Backend - Architecture

### Fichiers créés

```
backend/
├── services/WebFetchService.php       # Service de récupération avec headers navigateur
└── controllers/WebFetchController.php # Contrôleur API
```

### WebFetchService.php

**Fonctionnalités :**
- ✅ Headers réalistes de navigateur (Chrome sur Windows)
- ✅ Support des redirections (max 5)
- ✅ Timeout configurable (15s par défaut)
- ✅ Gestion SSL/TLS
- ✅ Support des cookies
- ✅ Cache fichier (1h par défaut)
- ✅ Validation d'URL (sécurité SSRF)
- ✅ Extraction de métadonnées OpenGraph

**Méthodes :**

```php
// Récupérer le HTML d'une URL
WebFetchService::fetchHTML($url, $options = []);
// Returns: ['success' => bool, 'html' => string, 'error' => string, 'status_code' => int]

// Extraire les métadonnées
WebFetchService::extractMetadata($html, $url);
// Returns: ['title' => string, 'description' => string, 'image' => string, 'site_name' => string]
```

---

## 🌐 API Endpoints

### 1. Récupérer le HTML brut

**Endpoint :** `POST /api/web-fetch`

**Body :**
```json
{
  "url": "https://www.ravelry.com/patterns/library/..."
}
```

**Response :**
```json
{
  "success": true,
  "html": "<!DOCTYPE html>...",
  "status_code": 200,
  "url": "https://www.ravelry.com/patterns/library/..."
}
```

**Erreur :**
```json
{
  "success": false,
  "error": "Erreur HTTP 403"
}
```

---

### 2. Récupérer les métadonnées

**Endpoint :** `POST /api/web-fetch/metadata`

**Body :**
```json
{
  "url": "https://www.ravelry.com/patterns/library/..."
}
```

**Response :**
```json
{
  "success": true,
  "url": "https://www.ravelry.com/patterns/library/...",
  "metadata": {
    "title": "Pull irlandais - Ravelry",
    "description": "Un magnifique pull avec torsades...",
    "image": "https://images.ravelry.com/...",
    "site_name": "Ravelry"
  }
}
```

---

## 💻 Frontend - Utilisation

### Depuis React (api.js)

```javascript
// Dans src/services/api.js
export const fetchExternalHTML = async (url) => {
  const response = await api.post('/web-fetch', { url });
  return response.data;
};

export const fetchExternalMetadata = async (url) => {
  const response = await api.post('/web-fetch/metadata', { url });
  return response.data;
};
```

### Exemple d'utilisation dans un composant

```jsx
import { fetchExternalMetadata } from '../services/api';

function PatternPreview({ url }) {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPreview() {
      try {
        const result = await fetchExternalMetadata(url);
        if (result.success) {
          setMetadata(result.metadata);
        }
      } catch (error) {
        console.error('Erreur chargement preview:', error);
      } finally {
        setLoading(false);
      }
    }

    if (url) loadPreview();
  }, [url]);

  if (loading) return <div>Chargement...</div>;
  if (!metadata) return null;

  return (
    <div className="pattern-preview">
      {metadata.image && (
        <img src={metadata.image} alt={metadata.title} />
      )}
      <h3>{metadata.title}</h3>
      <p>{metadata.description}</p>
      <span className="site-name">{metadata.site_name}</span>
    </div>
  );
}
```

---

## 🧪 Test

### Option 1 : Interface de test PHP

Ouvrez : `http://localhost:8000/test-web-fetch.php`

Interface web pour tester :
- Récupération HTML brut
- Extraction de métadonnées

### Option 2 : cURL

```bash
# Récupérer le HTML
curl -X POST http://localhost:8000/api/web-fetch \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.ravelry.com/"}'

# Récupérer les métadonnées
curl -X POST http://localhost:8000/api/web-fetch/metadata \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.ravelry.com/"}'
```

---

## ⚙️ Configuration

### Options disponibles

```php
$options = [
    'cache' => true,              // Activer le cache (défaut: true)
    'cache_timeout' => 3600,      // Durée du cache en secondes (défaut: 1h)
    'timeout' => 15,              // Timeout requête en secondes (défaut: 15s)
];

WebFetchService::fetchHTML($url, $options);
```

### Cache

Le cache est stocké dans `backend/cache/` avec un timeout de 1h par défaut.

Pour nettoyer le cache :
```bash
rm -rf backend/cache/webfetch_*.cache
```

---

## 🔒 Sécurité

**Protections implémentées :**

1. ✅ Validation d'URL (filter_var)
2. ✅ Whitelist protocoles (HTTP/HTTPS uniquement)
3. ✅ SSL verification activée
4. ✅ Pas d'accès localhost/127.0.0.1 (protection SSRF)
5. ✅ Timeout pour éviter les blocages

**À considérer pour la production :**
- Rate limiting (limiter le nombre de requêtes par utilisateur)
- Whitelist de domaines autorisés (ex: ravelry.com, blogspot.com)
- Logs des URLs récupérées
- Authentification requise sur les endpoints

---

## 📦 Headers envoyés

Le service imite Chrome 120 sur Windows 10 :

```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Upgrade-Insecure-Requests: 1
Sec-Fetch-Dest: document
Sec-Fetch-Mode: navigate
Sec-Fetch-Site: none
Sec-Fetch-User: ?1
```

---

## 🚀 Cas d'usage YarnFlow

### 1. Preview de liens de patrons

Quand l'utilisateur ajoute un lien Ravelry/blog à son projet, afficher automatiquement :
- Image du patron
- Titre
- Description
- Nom du site

### 2. Import de patrons depuis URL

Parser le contenu HTML pour extraire :
- Les informations du patron (titre, designer)
- Les images
- Les métadonnées utiles

### 3. Galerie de patrons communautaires

Créer une galerie avec previews automatiques des liens partagés par la communauté.

---

## 🐛 Troubleshooting

**Erreur: "URL invalide"**
- Vérifier que l'URL commence par http:// ou https://

**Erreur: "Erreur HTTP 403/429"**
- Le site bloque malgré les headers
- Solution: Ajouter plus de headers spécifiques au site (Referer, etc.)

**Timeout**
- Le site est trop lent
- Solution: Augmenter le timeout dans les options

**Pas de métadonnées**
- Le site n'utilise pas OpenGraph
- Solution: Parser manuellement le HTML avec DOMDocument

---

## 📝 Notes

- **Performance :** Le cache permet d'éviter de surcharger les sites externes
- **Légalité :** Vérifier les ToS des sites avant de scraper massivement
- **Respect :** Ne pas abuser du service (rate limiting recommandé)

---

**Créé le :** 2025-12-10
**Version :** 1.0.0
**Auteur :** YarnFlow Team + AI
