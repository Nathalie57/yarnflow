<?php
/**
 * @file Database.php
 * @brief Classe de connexion à la base de données MySQL
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

namespace App\Config;

use PDO;
use PDOException;

/**
 * [AI:Claude] Classe singleton pour gérer la connexion à MySQL
 * Utilise PDO avec des requêtes préparées pour la sécurité
 */
class Database
{
    private static ?Database $instance = null;
    private ?PDO $connection = null;

    private string $host;
    private string $dbName;
    private string $username;
    private string $password;
    private string $charset;

    /**
     * [AI:Claude] Constructeur privé (pattern Singleton)
     */
    private function __construct()
    {
        $this->host = $_ENV['DB_HOST'] ?? 'localhost';
        $this->dbName = $_ENV['DB_NAME'] ?? 'patron_maker';
        $this->username = $_ENV['DB_USER'] ?? 'root';
        $this->password = $_ENV['DB_PASSWORD'] ?? '';
        $this->charset = $_ENV['DB_CHARSET'] ?? 'utf8mb4';
    }

    /**
     * [AI:Claude] Obtenir l'instance unique de la classe (Singleton)
     *
     * @return Database Instance unique
     */
    public static function getInstance(): Database
    {
        if (self::$instance === null)
            self::$instance = new self();

        return self::$instance;
    }

    /**
     * [AI:Claude] Obtenir la connexion PDO à la base de données
     * Crée la connexion si elle n'existe pas encore
     *
     * @return PDO Connexion PDO active
     * @throws PDOException Si la connexion échoue
     */
    public function getConnection(): PDO
    {
        if ($this->connection === null) {
            try {
                $dsn = "mysql:host={$this->host};dbname={$this->dbName};charset={$this->charset}";

                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$this->charset}"
                ];

                $this->connection = new PDO($dsn, $this->username, $this->password, $options);
            } catch (PDOException $e) {
                error_log("[Database] Erreur de connexion : ".$e->getMessage());
                throw new PDOException("Impossible de se connecter à la base de données");
            }
        }

        return $this->connection;
    }

    /**
     * [AI:Claude] Tester la connexion à la base de données
     *
     * @return bool True si la connexion fonctionne
     */
    public function testConnection(): bool
    {
        try {
            $conn = $this->getConnection();
            $stmt = $conn->query("SELECT 1");
            return $stmt !== false;
        } catch (PDOException $e) {
            error_log("[Database] Test de connexion échoué : ".$e->getMessage());
            return false;
        }
    }

    /**
     * [AI:Claude] Empêcher le clonage de l'instance (Singleton)
     */
    private function __clone() {}

    /**
     * [AI:Claude] Empêcher la désérialisation (Singleton)
     */
    public function __wakeup()
    {
        throw new \Exception("Cannot unserialize singleton");
    }
}
