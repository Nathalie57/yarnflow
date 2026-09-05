-- [AI:Claude] 2026-09-04 — Rétention par cohorte hebdomadaire d'inscription (J+1/J+7/J+30).
-- "Revenue" = au moins une session (user_sessions) strictement après le jour d'inscription,
-- dans la fenêtre indiquée. Sert de baseline avant/après les changements d'empty state et
-- de personnification déployés cette semaine (commits 45c0baa, 8cb1937).

SELECT
    cohort_semaine,
    debut_semaine,
    nb_inscrites,
    revenues_j1,
    ROUND(100 * revenues_j1 / nb_inscrites, 1) AS pct_j1,
    revenues_j7,
    ROUND(100 * revenues_j7 / nb_inscrites, 1) AS pct_j7,
    revenues_j30,
    ROUND(100 * revenues_j30 / nb_inscrites, 1) AS pct_j30
FROM (
    SELECT
        YEARWEEK(u.created_at, 3) AS cohort_semaine,
        MIN(DATE(u.created_at)) AS debut_semaine,
        COUNT(DISTINCT u.id) AS nb_inscrites,
        COUNT(DISTINCT CASE WHEN EXISTS (
            SELECT 1 FROM user_sessions s
            WHERE s.user_id = u.id AND DATEDIFF(s.started_at, u.created_at) BETWEEN 1 AND 1
        ) THEN u.id END) AS revenues_j1,
        COUNT(DISTINCT CASE WHEN EXISTS (
            SELECT 1 FROM user_sessions s
            WHERE s.user_id = u.id AND DATEDIFF(s.started_at, u.created_at) BETWEEN 1 AND 7
        ) THEN u.id END) AS revenues_j7,
        COUNT(DISTINCT CASE WHEN EXISTS (
            SELECT 1 FROM user_sessions s
            WHERE s.user_id = u.id AND DATEDIFF(s.started_at, u.created_at) BETWEEN 1 AND 30
        ) THEN u.id END) AS revenues_j30
    FROM users u
    WHERE u.created_at >= '2026-06-01'
    GROUP BY cohort_semaine
) t
ORDER BY cohort_semaine;
