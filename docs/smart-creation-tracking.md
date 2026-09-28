# Tracking complémentaire Smart Creation

Aucune migration, dépendance, modification des règles métier ou du parcours visible.

## Corrélation

`attempt_id` est créé avant chaque requête `/analyze`, après validation locale. Le
backend le valide (ou en génère un pour les anciens clients), puis le conserve dans
`ai_pattern_imports.ai_response_json._analytics.attempt_id`. Un résultat en cache
reçoit le nouvel identifiant de tentative. `/pending` restitue cet identifiant ;
`project_created` le relit dans l'import appartenant à l'utilisatrice, sans faire
confiance aux métadonnées de confirmation envoyées par le client.

- `pattern_import_started` : `attempt_id`, `source_type`, ancien champ `source`.
- `pattern_import_completed` : mêmes champs, `status` (success/partial/error),
  `cached`, `processing_time_ms`, et seulement si connus : `import_id`,
  `error_code`, `gate_type`, `gate_types`.
- `smart_creation_analyzed` : ajout de `attempt_id`.
- `project_created` Smart : ajout de `attempt_id`, `import_id`, `source_type` ;
  conservation de `source=smart_import` et `import_source`.

Le temps du completed est le temps serveur entre started et completed (validation
de source/quota déjà passée), pas le temps réseau frontend ni le seul temps Gemini.
Une erreur avant started ne crée pas de completed orphelin. Une requête interrompue
brutalement peut laisser un started sans completed. Les anciens imports/événements
ne sont pas rétro-remplis. Ne pas les corréler artificiellement par proximité horaire.

## Un seul nouvel événement : smart_creation_progress

| stage | Déclenchement | Champs spécifiques |
| --- | --- | --- |
| source_selected | Clic explicite sur un choix de source | source_type ; pas encore d'attempt_id |
| left_during_analysis | Démontage de Smart Creation avec changement réel de pathname pendant la requête HTTP d'analyse | attempt_id, source_type, display_context=spa_navigation |
| gate_shown | Gate effectivement rendue à l'étape de vérification | attempt_id/import_id si disponibles, source_type, gate_type, display_context=foreground ou resume |
| notice_shown | Notification rendue en mode développé ou compact | identifiants disponibles, notice_kind, gate_type, display_context=expanded ou compact |
| notice_clicked | Clic sur le CTA ou Plus tard | mêmes champs, action=open_project, resume ou later |

Liste de stages contrôlée côté client et API. `gate_type` vaut `diagram`, `partial`
ou `translation`. Les gates annoncées par completed sont les gates pertinentes,
pas la preuve qu'elles ont été vues : utiliser gate_shown pour cela. Diagramme et
partiel priment sur traduction ; la traduction exige une langue cible connue.

Les impressions sont dédupliquées pendant le montage du composant, par import/gate
ou notice/mode. Un nouveau montage peut produire une nouvelle impression.
« Rendue » n'est pas une preuve de lecture humaine. Changement de visibilité,
fermeture d'onglet et rechargement ne sont pas inférés comme abandon. Le départ
après la réponse /analyze, pendant les traitements complémentaires, n'est pas
left_during_analysis. Le choix de source précédant la tentative se mesure par
utilisatrice/cohorte, sans lui attribuer un attempt_id par proximité temporelle.

## Activation backend

Définition : première augmentation réellement enregistrée du compteur (rangs ou
cm) d'un projet réel appartenant à l'utilisatrice, une seule fois par utilisatrice.
Les saisies directes croissantes et les rangs rejoués par la synchronisation hors
ligne comptent. Une valeur égale, une diminution, une ouverture, un changement de
section, une création, une initialisation « J'ai déjà commencé », une conversion
d'unité et un projet démo ne comptent pas.

Points d'entrée : ajout de rang, mise à jour du compteur du projet/de la section,
et progression de grille rattachée à une section. L'enregistrement passe par
ProgressActivationService puis AnalyticsService. L'API analytics n'accepte plus
activation_reached en provenance du frontend. Les événements historiques
first_row_counted, project_worked_again et real_project_started sont conservés.

Unicité : transaction InnoDB, verrou `SELECT ... FOR UPDATE` sur la ligne users,
lecture courante des activations existantes, puis insertion sous ce même verrou.
Deux projets simultanés d'une utilisatrice partagent ce verrou. Les activations
historiques empêchent une nouvelle insertion. Aucun index UNIQUE général ajouté.
L'événement porte `recorded_by=backend_progression` et conserve method/source.
Comme auparavant, une panne de stockage analytics est journalisée sans bloquer
la progression métier ; ce n'est pas une file transactionnelle avec rejeu garanti.

## Vérifications reproductibles (sans build)

Frontend : `node --test frontend/tests/smartCreationTracking.test.mjs`.
Les composants réels sont chargés en mémoire via Sucrase déjà installé, avec
hooks/router/réseau simulés : ce ne sont pas des tests E2E navigateur.

Backend : PHP 8.3, PHPUnit existant, bootstrap `backend/vendor/autoload.php`,
tests `backend/tests/SmartCreationTrackingServiceTest.php` et
`backend/tests/ProgressActivationServiceTest.php`, option `--do-not-cache-result`.
Définir `TRACKING_TEST_MYSQL_DSN=mysql:host=127.0.0.1;port=3306` et, si nécessaire,
TRACKING_TEST_MYSQL_USER/PASSWORD. Aucun nom de base applicative dans le DSN.
Les tests créent puis suppriment exclusivement leur schéma aléatoire
`yf_tracking_test_<identifiant>`. Ils testent les services après écritures réelles
et la concurrence avec deux processus PHP, pas les endpoints via HTTP.

## SQL de lecture — MySQL 8

Adapter les bornes de cohorte et la fin d'observation. Les requêtes suivantes
n'effectuent aucune écriture. La fin d'observation doit être identique entre
cohortes si l'on compare leurs taux. Les tables utilisent leur fuseau habituel.

### Une ligne par tentative, corrélation exacte

```sql
WITH cohort AS (
  SELECT id FROM users
  WHERE created_at >= '2026-09-28' AND created_at < '2026-09-29'
), events AS (
  SELECT e.*, JSON_UNQUOTE(JSON_EXTRACT(e.event_data, '$.attempt_id')) AS attempt_id
  FROM analytics_events e JOIN cohort c ON c.id = e.user_id
  WHERE e.created_at < '2026-10-06'
), attempts AS (
  SELECT user_id, attempt_id,
    MIN(CASE WHEN event_name = 'pattern_import_started' THEN created_at END) AS started_at,
    MIN(CASE WHEN event_name = 'pattern_import_completed' THEN created_at END) AS completed_at,
    MAX(CASE WHEN event_name = 'pattern_import_completed' THEN JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.status')) END) AS status,
    MAX(CASE WHEN event_name = 'pattern_import_completed' THEN JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.source_type')) END) AS source_type,
    MAX(CASE WHEN event_name = 'pattern_import_completed' THEN JSON_EXTRACT(event_data, '$.import_id') END) AS import_id,
    MAX(CASE WHEN event_name = 'pattern_import_completed' THEN JSON_EXTRACT(event_data, '$.processing_time_ms') END) AS processing_time_ms,
    MAX(CASE WHEN event_name = 'project_created' THEN project_id END) AS project_id
  FROM events
  WHERE attempt_id IS NOT NULL
  GROUP BY user_id, attempt_id
)
SELECT * FROM attempts WHERE started_at IS NOT NULL ORDER BY user_id, started_at;
```

### Funnel de cohorte (utilisatrices distinctes, pas nombre d'événements)

```sql
WITH cohort AS (
  SELECT id FROM users
  WHERE created_at >= '2026-09-28' AND created_at < '2026-09-29'
), flags AS (
  SELECT c.id,
    MAX(CASE WHEN e.event_name = 'smart_creation_progress' AND JSON_UNQUOTE(JSON_EXTRACT(e.event_data, '$.stage')) = 'source_selected' THEN 1 ELSE 0 END) AS selected_source,
    MAX(CASE WHEN e.event_name = 'pattern_import_started' THEN 1 ELSE 0 END) AS started,
    MAX(CASE WHEN e.event_name = 'pattern_import_completed' AND JSON_UNQUOTE(JSON_EXTRACT(e.event_data, '$.status')) IN ('success', 'partial') THEN 1 ELSE 0 END) AS analyzed,
    MAX(CASE WHEN e.event_name = 'project_created' AND JSON_UNQUOTE(JSON_EXTRACT(e.event_data, '$.source')) = 'smart_import' THEN 1 ELSE 0 END) AS smart_project_created,
    MAX(CASE WHEN e.event_name = 'activation_reached' THEN 1 ELSE 0 END) AS activated
  FROM cohort c LEFT JOIN analytics_events e ON e.user_id = c.id AND e.created_at < '2026-10-06'
  GROUP BY c.id
)
SELECT COUNT(*) AS registered, SUM(selected_source) AS selected_source,
  SUM(started) AS started, SUM(analyzed) AS analyzed,
  SUM(smart_project_created) AS smart_project_created, SUM(activated) AS activated
FROM flags;
```

Ce deuxième tableau donne les jalons de la cohorte, sans attribuer toute activation
à Smart (une utilisatrice peut aussi progresser sur un projet manuel). Pour une
conversion stricte d'une tentative vers activation, joindre son project_id à
analytics_events avec event_name='activation_reached' et le même user_id.

### Gates, départs et interactions de notification

```sql
SELECT JSON_UNQUOTE(JSON_EXTRACT(e.event_data, '$.stage')) AS stage,
  JSON_UNQUOTE(JSON_EXTRACT(e.event_data, '$.gate_type')) AS gate_type,
  JSON_UNQUOTE(JSON_EXTRACT(e.event_data, '$.display_context')) AS display_context,
  JSON_UNQUOTE(JSON_EXTRACT(e.event_data, '$.action')) AS action,
  COUNT(*) AS events, COUNT(DISTINCT e.user_id) AS users,
  COUNT(DISTINCT CONCAT(e.user_id, ':', JSON_UNQUOTE(JSON_EXTRACT(e.event_data, '$.attempt_id')))) AS attempts
FROM analytics_events e JOIN users u ON u.id = e.user_id
WHERE u.created_at >= '2026-09-28' AND u.created_at < '2026-09-29'
  AND e.created_at < '2026-10-06' AND e.event_name = 'smart_creation_progress'
GROUP BY stage, gate_type, display_context, action;
```

La rétention reste calculée depuis user_sessions ; aucun événement J+1/J+3/J+7.
