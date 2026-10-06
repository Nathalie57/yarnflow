# Banc Flow V1

L’outil évalue les générations réelles sans passer par l’endpoint applicatif :
aucune authentification, lecture de compte/projet réel, écriture BDD, quota,
événement ou feedback. La clé Gemini est chargée uniquement avec `--run`.
Les appels sont facturables par Google et soumis à ses limites API.

Depuis la racine du dépôt, avec PHP 8.1 ou plus :

```powershell
& D:\wamp64\bin\php\php8.3.6\php.exe backend/evals/run-flow.php
& D:\wamp64\bin\php\php8.3.6\php.exe backend/evals/run-flow.php --run --scenario all --repeat 3
& D:\wamp64\bin\php\php8.3.6\php.exe backend/evals/run-flow.php --run --scenario 144-25-24 --repeat 1
```

Sans `--run`, seule la liste et le nombre maximal de générations sont affichés.
Les répétitions sont indépendantes. Dans chaque répétition, les tours suivants
reçoivent les réponses affichables réellement obtenues, sans remplacer une
mauvaise réponse par une réponse attendue. Le scénario de correction contient
intentionnellement une ancienne déduction erronée fixée dans sa fixture.

Le modèle et le plafond de sortie sont lus dans le contrôleur. Les paramètres
non configurés restent ceux de Flow : ce protocole ne garantit pas des sorties
identiques. Toute la suite représente 42 générations pour trois répétitions,
hors reprises HTTP du transport réel de Flow (au plus deux tentatives/appel).

## Réutilisation et limites

Le constructeur du contrôleur n’est pas appelé. La réflexion invoque son vrai
`getSystemPrompt`, son vrai `buildProjectContext` et son vrai transport
`postToGeminiWithRetry`. Un PDO de fixtures fournit les quatre lectures attendues
et refuse toute autre requête. Les services réels de sélection, extraction et
validation de contexte sont donc exécutés selon la version locale.

Le petit assemblage HTTP et le découpage de réponse restent dans l’adaptateur,
pour ne pas modifier Flow dans ce lot. Un changement du format du modèle ou du
plafond échoue explicitement ; si les rôles, le balisage ou le parsing de Flow
changent, mettre aussi l’adaptateur à jour. La V1 couvre les explications, pas
le service secondaire de traduction. Un marqueur de traduction est conservé et
signalé comme limitation technique de protocole, jamais évalué comme réponse
affichable inventée.

## Artefacts et revue humaine

Chaque lancement crée un répertoire unique sous `results/` (ignoré par Git).
`results.json` est la référence : fixtures, historique de chaque tour, contexte
effectivement envoyé, payload complet, empreinte du prompt, modèle/paramètres,
réponse HTTP brute (avec les métadonnées Gemini), réponse affichable,
suggestions, durée, erreurs et grille humaine. Sauvegarde après chaque tour ;
un résultat sans `completed_at` est incomplet. Ne pas prendre une interruption
pour un succès. Les secrets d’authentification et les traces HTTP sont exclus.

`report.md` présente les réponses et les critères à relire. Dans le JSON,
renseigner `human_review[].status` avec `conforme`, `non conforme` ou
`indéterminé`, et `evidence` avec l’extrait justificatif. Une erreur technique
laisse la qualité indéterminée ; les tours suivants de cette répétition ne sont
pas exécutés. Un échec de qualité n’interrompt pas la conversation.

Les contrôles automatiques portent seulement sur les sorties vides et les
marqueurs internes ; longueur et nombre de suggestions sont des avertissements.
Aucun score sémantique, ni interdiction naïve du nombre 152 : il peut désigner
légitimement la prochaine augmentation théorique. La réponse entière et le
contexte restent nécessaires pour juger les critères.

Pour régénérer le Markdown après annotation, sans réseau :

```php
require 'backend/evals/src/Runner.php';
$result = json_decode(file_get_contents('CHEMIN/results.json'), true, 512, JSON_THROW_ON_ERROR);
file_put_contents('CHEMIN/report.md', \FlowEval\Runner::report($result));
```

## Comparer deux versions

Les artefacts enregistrent le commit, le statut Git complet et les empreintes
des sources pertinentes (y compris le banc et les scénarios non commités).
Cela distingue la version publiée du lot local sans le committer. Conserver
les artefacts hors du checkout testé avant de changer de version.

Exécuter la même suite et le même nombre de répétitions sur chaque version,
avec le même protocole et les mêmes fixtures. Comparer chaque scénario et
critère, pas uniquement une moyenne. Une régression critique ne doit pas être
compensée par un meilleur résultat ailleurs. Vérifier les empreintes et
paramètres pour attribuer honnêtement une différence ; l’alias Gemini peut
évoluer, sa version retournée reste disponible dans la réponse brute.

Tests du banc, sans réseau :

```powershell
& D:\wamp64\bin\php\php8.3.6\php.exe backend/vendor/phpunit/phpunit/phpunit --configuration backend/phpunit.xml --filter FlowEvaluationHarnessTest
```
