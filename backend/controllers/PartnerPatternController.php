<?php
/**
 * @file PartnerPatternController.php
 * @brief Import de projets via QR code partenaire
 *
 * Flux :
 *   GET  /api/import/:code          → retourne les données du template (public)
 *   POST /api/import/:code          → crée le projet pour l'utilisateur connecté
 *   POST /api/admin/partner-patterns → crée un template (admin)
 *   GET  /api/admin/partner-patterns → liste les templates (admin)
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Middleware\AuthMiddleware;

class PartnerPatternController
{
    private AuthMiddleware $authMiddleware;

    public function __construct()
    {
        $this->authMiddleware = new AuthMiddleware();
    }

    // -------------------------------------------------------------------------
    // GET /api/import/:code — public, retourne les infos du template
    // -------------------------------------------------------------------------

    public function getByCode(string $code): void
    {
        try {
            $template = $this->findTemplate($code);
            if (!$template) {
                $this->sendResponse(404, ['success' => false, 'error' => 'Template introuvable']);
                return;
            }

            $this->incrementScanCount((int)$template['id']);

            $this->sendResponse(200, [
                'success'  => true,
                'template' => $this->formatTemplate($template),
            ]);
        } catch (\Throwable $e) {
            $this->sendResponse(500, ['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/import/:code — crée le projet pour l'utilisateur connecté
    // -------------------------------------------------------------------------

    public function importProject(string $code): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            $template = $this->findTemplate($code);
            if (!$template) {
                $this->sendResponse(404, ['success' => false, 'error' => 'Template introuvable']);
                return;
            }

            $db = $this->getDb();

            $db->beginTransaction();

            // Créer le projet
            $stmt = $db->prepare('
                INSERT INTO projects (user_id, name, type, technique, description, status, technical_details, created_at, updated_at)
                VALUES (:user_id, :name, :type, :technique, :description, "in_progress", :technical_details, NOW(), NOW())
            ');
            $stmt->execute([
                ':user_id'           => $userId,
                ':name'              => $template['title'],
                ':type'              => $template['type'],
                ':technique'         => $template['technique'],
                ':description'       => $template['description'],
                ':technical_details' => $template['technical_details'],
            ]);
            $projectId = (int)$db->lastInsertId();

            // Créer les sections si présentes
            $sections = json_decode($template['sections'] ?? 'null', true);
            if (is_array($sections) && count($sections) > 0) {
                $sectionStmt = $db->prepare('
                    INSERT INTO project_sections (project_id, title, total_rows, position, created_at, updated_at)
                    VALUES (:project_id, :title, :total_rows, :position, NOW(), NOW())
                ');
                foreach ($sections as $i => $section) {
                    $sectionStmt->execute([
                        ':project_id' => $projectId,
                        ':title'      => $section['title'] ?? 'Section ' . ($i + 1),
                        ':total_rows' => $section['row_count'] ?? null,
                        ':position'   => $i,
                    ]);
                }
            }

            $db->commit();

            // Retourner le projet créé
            $project = $db->query("SELECT * FROM projects WHERE id = $projectId")->fetch(\PDO::FETCH_ASSOC);

            $this->sendResponse(201, [
                'success' => true,
                'project' => $project,
            ]);
        } catch (\Throwable $e) {
            try { $this->getDb()->rollBack(); } catch (\Throwable $_) {}
            $this->sendResponse(500, ['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/admin/partner-patterns — liste les templates (admin)
    // -------------------------------------------------------------------------

    public function listTemplates(): void
    {
        try {
            $this->requireAdmin();

            $rows = $this->getDb()->query(
                'SELECT * FROM partner_patterns ORDER BY created_at DESC'
            )->fetchAll(\PDO::FETCH_ASSOC);

            $this->sendResponse(200, [
                'success'   => true,
                'templates' => array_map([$this, 'formatTemplate'], $rows),
            ]);
        } catch (\Throwable $e) {
            $this->sendResponse(500, ['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/admin/partner-patterns — crée un template (admin)
    // -------------------------------------------------------------------------

    public function createTemplate(): void
    {
        try {
            $this->requireAdmin();

            $data = $this->getJsonInput();

            if (empty($data['title']) || empty($data['partner_name'])) {
                $this->sendResponse(400, ['success' => false, 'error' => 'title et partner_name sont obligatoires']);
                return;
            }

            $code = $this->generateCode($data['partner_name']);

            $db   = $this->getDb();
            $stmt = $db->prepare('
                INSERT INTO partner_patterns (code, partner_name, title, type, technique, description, needle_size, yarn_weight, sections, technical_details, active)
                VALUES (:code, :partner_name, :title, :type, :technique, :description, :needle_size, :yarn_weight, :sections, :technical_details, 1)
            ');
            $stmt->execute([
                ':code'              => $code,
                ':partner_name'      => $data['partner_name'],
                ':title'             => $data['title'],
                ':type'              => $data['type']        ?? 'other',
                ':technique'         => $data['technique']   ?? 'tricot',
                ':description'       => $data['description'] ?? null,
                ':needle_size'       => $data['needle_size'] ?? null,
                ':yarn_weight'       => $data['yarn_weight'] ?? null,
                ':sections'          => isset($data['sections'])          ? json_encode($data['sections'])          : null,
                ':technical_details' => isset($data['technical_details']) ? json_encode($data['technical_details']) : null,
            ]);

            $template = $db->query('SELECT * FROM partner_patterns WHERE id = ' . $db->lastInsertId())->fetch(\PDO::FETCH_ASSOC);

            $this->sendResponse(201, [
                'success'  => true,
                'template' => $this->formatTemplate($template),
                'qr_url'   => 'https://yarnflow.fr/import/' . $code,
            ]);
        } catch (\Throwable $e) {
            $this->sendResponse(500, ['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // Helpers privés
    // -------------------------------------------------------------------------

    private function findTemplate(string $code): array|false
    {
        $stmt = $this->getDb()->prepare(
            'SELECT * FROM partner_patterns WHERE code = :code AND active = 1'
        );
        $stmt->execute([':code' => $code]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    private function incrementScanCount(int $id): void
    {
        $this->getDb()->exec("UPDATE partner_patterns SET scan_count = scan_count + 1 WHERE id = $id");
    }

    private function formatTemplate(array $row): array
    {
        return [
            'code'              => $row['code'],
            'partner_name'      => $row['partner_name'],
            'title'             => $row['title'],
            'type'              => $row['type'],
            'technique'         => $row['technique'],
            'description'       => $row['description'],
            'needle_size'       => $row['needle_size'],
            'yarn_weight'       => $row['yarn_weight'],
            'sections'          => json_decode($row['sections'] ?? 'null', true),
            'technical_details' => json_decode($row['technical_details'] ?? 'null', true),
            'scan_count'        => (int)$row['scan_count'],
        ];
    }

    private function generateCode(string $partnerName): string
    {
        $prefix = strtoupper(preg_replace('/[^a-zA-Z]/', '', $partnerName));
        $prefix = substr($prefix, 0, 4);
        return $prefix . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
    }

    private function requireAdmin(): void
    {
        $userData = $this->authMiddleware->authenticate();
        if (!$userData) {
            $this->sendResponse(401, ['success' => false, 'error' => 'Non authentifié']);
            exit;
        }
        if (($userData['role'] ?? '') !== 'admin') {
            $this->sendResponse(403, ['success' => false, 'error' => 'Accès refusé']);
            exit;
        }
    }

    private function getUserIdFromAuth(): int
    {
        $userData = $this->authMiddleware->authenticate();
        if (!$userData) {
            $this->sendResponse(401, ['success' => false, 'error' => 'Non authentifié']);
            exit;
        }
        return (int)$userData['id'];
    }

    private function getDb(): \PDO
    {
        static $db = null;
        if ($db === null) {
            $db = new \PDO(
                'mysql:host=' . ($_ENV['DB_HOST'] ?? 'localhost') . ';dbname=' . ($_ENV['DB_NAME'] ?? '') . ';charset=utf8mb4',
                $_ENV['DB_USER'] ?? '',
                $_ENV['DB_PASS'] ?? '',
                [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
            );
        }
        return $db;
    }

    private function getJsonInput(): array
    {
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?? [];
    }

    private function sendResponse(int $statusCode, array $data): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
    }
}
