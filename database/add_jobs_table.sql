-- [AI:Claude] Table pour la queue asynchrone de génération de patrons
-- Créée le 2025-11-14

CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Type de job
    type VARCHAR(50) NOT NULL,

    -- Données du job en JSON
    payload LONGTEXT NOT NULL,

    -- Statut : pending, processing, completed, failed
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',

    -- Nombre de tentatives
    attempts INT DEFAULT 0,

    -- Nombre maximum de tentatives
    max_attempts INT DEFAULT 3,

    -- Erreur si échec
    error_message TEXT DEFAULT NULL,

    -- Réservation du job par un worker
    reserved_at DATETIME DEFAULT NULL,
    reserved_by VARCHAR(100) DEFAULT NULL,

    -- Timestamp de disponibilité (pour retry avec délai)
    available_at DATETIME NOT NULL,

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME DEFAULT NULL,

    INDEX idx_status_available (status, available_at),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- [AI:Claude] Table pour lier les jobs aux patrons
CREATE TABLE IF NOT EXISTS pattern_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pattern_id INT NOT NULL,
    job_id INT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (pattern_id) REFERENCES patterns(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,

    UNIQUE KEY unique_pattern_job (pattern_id, job_id),
    INDEX idx_pattern_id (pattern_id),
    INDEX idx_job_id (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
