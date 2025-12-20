# Système de satisfaction client - AI Photo Studio

## 🎯 Objectif
Protéger la satisfaction client et limiter les risques de remboursements/désabonnements.

## 1️⃣ Feedback immédiat après génération

### Frontend - Modal de satisfaction
Après chaque génération, afficher une modal :

```jsx
// Après génération HD
<SatisfactionModal>
  <h3>Êtes-vous satisfait du résultat ?</h3>

  <Button onClick={() => handleFeedback('satisfied')}>
    👍 Oui, c'est parfait !
  </Button>

  <Button onClick={() => handleFeedback('unsatisfied')}>
    👎 Non, ça ne correspond pas
  </Button>
</SatisfactionModal>
```

### Backend - Compensation automatique

```php
// Si utilisateur clique "Non satisfait" :
if ($feedback === 'unsatisfied') {
    // Rembourser 1 crédit automatiquement
    $this->creditManager->refundCredit($userId, 1, 'Génération insatisfaisante');

    // Logger pour analyse
    $this->logUnsatisfiedGeneration($userId, $photoId, $context);

    // Message rassurant
    return "Nous avons remboursé 1 crédit. Réessayez avec un autre contexte !";
}
```

**Avantage** : L'utilisateur n'a jamais l'impression de "perdre" ses crédits.

---

## 2️⃣ Exemples visuels AVANT génération

### Afficher des exemples par contexte

```jsx
// Avant de générer, montrer des exemples
<ContextSelector>
  {contexts.map(context => (
    <ContextCard
      context={context}
      exampleImage={`/examples/${context}_example.jpg`}
      description="Ce style convient pour : Instagram, Etsy, Facebook"
    />
  ))}
</ContextSelector>
```

**Texte d'avertissement** :
```
⚠️ L'IA s'inspire de votre photo pour créer une nouvelle mise en scène.
Les couleurs et détails de votre ouvrage seront préservés, mais le fond,
l'éclairage et la position changeront pour correspondre au style choisi.
```

---

## 3️⃣ Limite de remboursement raisonnable

### Politique claire dans CGU

```
Garantie satisfaction YarnFlow :
- Si vous n'êtes pas satisfait d'une génération, nous remboursons automatiquement 1 crédit.
- Limite : 3 remboursements par mois pour éviter les abus.
- Au-delà, contactez le support pour assistance personnalisée.
```

### Backend - Vérifier limite

```php
public function canRefund(int $userId): bool {
    $refundsThisMonth = $this->countRefundsThisMonth($userId);
    return $refundsThisMonth < 3;
}
```

---

## 4️⃣ Tableau de bord "Mes générations"

### Permettre de revoir l'historique

```jsx
<GenerationsHistory>
  {generations.map(gen => (
    <GenerationCard>
      <OriginalImage src={gen.original} />
      <GeneratedImage src={gen.generated} />
      <Context>{gen.context}</Context>

      {/* Bouton "Pas satisfait" disponible 24h */}
      {gen.canRefund && (
        <Button onClick={() => requestRefund(gen.id)}>
          Demander un remboursement
        </Button>
      )}
    </GenerationCard>
  ))}
</GenerationsHistory>
```

---

## 5️⃣ Communication proactive

### Email après première génération

```
Sujet : Comment s'est passée votre première génération AI Photo Studio ? 🎨

Bonjour [Prénom],

Nous espérons que votre première photo générée vous plaît !

Quelques astuces pour de meilleurs résultats :
✅ Utilisez la preview gratuite pour tester avant de générer
✅ Choisissez le contexte adapté à votre type d'ouvrage
✅ Générez plusieurs variations (pack 5 photos = -20%)

Pas satisfait ? Aucun problème !
Cliquez sur "👎 Pas satisfait" pour récupérer votre crédit.

À bientôt sur YarnFlow !
```

---

## 📊 Statistiques à surveiller

```sql
-- Taux de satisfaction
SELECT
    COUNT(CASE WHEN satisfied = 1 THEN 1 END) * 100.0 / COUNT(*) as satisfaction_rate
FROM photo_feedback;

-- Contextes les plus remboursés
SELECT
    context,
    COUNT(*) as refund_count
FROM credit_refunds
GROUP BY context
ORDER BY refund_count DESC;
```

---

## 🎯 Résultat attendu

Avec ces mécanismes :
- ✅ L'utilisateur se sent **protégé** (peut récupérer ses crédits)
- ✅ Tu **évites les demandes de remboursement** globales
- ✅ Tu **collectes des données** sur les problèmes récurrents
- ✅ Tu **fidélises** les clients déçus au lieu de les perdre

---

## 💡 Bonus : Feature "Régénérer similaire"

Si l'utilisateur aime **presque** le résultat mais veut réessayer :

```jsx
<Button onClick={() => regenerateSimilar(photoId, context)}>
  🔄 Régénérer avec ce même style (consomme 1 crédit)
</Button>
```

L'IA utilisera une `seed` légèrement différente pour varier le résultat tout en gardant le même contexte.

---

**Recommandation** : Commencer par le mécanisme 1 (feedback + remboursement auto). C'est le plus simple et le plus efficace.
