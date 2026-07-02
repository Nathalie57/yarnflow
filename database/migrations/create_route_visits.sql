-- Log léger d'une ligne par requête API authentifiée, pour savoir quelles
-- pages/routes un utilisateur sollicite le plus (complète user_sessions,
-- qui ne donne qu'une fenêtre d'activité sans détail de ce qui est consulté).

CREATE TABLE IF NOT EXISTS route_visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    route VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_user_route (user_id, route),
    INDEX idx_created_at (created_at)
);
