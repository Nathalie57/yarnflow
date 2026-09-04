-- [AI:Claude] 2026-09-04 — Requêtes de comptage des questions posées à l'assistant IA
-- (event_name = 'ai_question_asked' dans analytics_events, event_data JSON avec
-- 'contextual' et 'plan'). Lecture seule, à lancer dans phpMyAdmin.

-- 1) Total contextuelles vs générales, ce mois-ci
SELECT
    JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.contextual')) AS contextuelle,
    COUNT(*) AS nb_questions
FROM analytics_events
WHERE event_name = 'ai_question_asked'
  AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
GROUP BY contextuelle;

-- 2) Répartition par plan, questions contextuelles uniquement, ce mois-ci
SELECT
    JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.plan')) AS plan,
    COUNT(*) AS nb_questions_contextuelles
FROM analytics_events
WHERE event_name = 'ai_question_asked'
  AND JSON_EXTRACT(event_data, '$.contextual') = true
  AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
GROUP BY plan
ORDER BY nb_questions_contextuelles DESC;

-- 3) Top utilisatrices par nombre de questions contextuelles, ce mois-ci
SELECT
    user_id,
    COUNT(*) AS nb_questions_contextuelles,
    MIN(created_at) AS premiere_question,
    MAX(created_at) AS derniere_question
FROM analytics_events
WHERE event_name = 'ai_question_asked'
  AND JSON_EXTRACT(event_data, '$.contextual') = true
  AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
GROUP BY user_id
ORDER BY nb_questions_contextuelles DESC
LIMIT 20;
