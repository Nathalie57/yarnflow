<?php
/**
 * @file StashAllocationController.php
 * @brief Liaison projets ↔ stock de laine (Phase 3 Stash)
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Config\Database;
use PDO;

class StashAllocationController
{
    private AuthMiddleware $authMiddleware;
    private PDO $db;

    public function __construct()
    {
        $this->authMiddleware = new AuthMiddleware();
        $this->db = Database::getInstance()->getConnection();
    }

    // -------------------------------------------------------------------------
    // GET /api/projects/{id}/allocations
    // -------------------------------------------------------------------------

    public function listByProject(int $projectId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $this->assertProjectOwner($projectId, $userId);

            $stmt = $this->db->prepare(
                'SELECT a.id, a.stash_entry_id, a.quantity_reserved, a.quantity_used,
                        s.brand, s.yarn_name, s.color_name, s.color_hex, s.photo_url,
                        s.weight_per_skein_g, s.yardage_per_skein_m, s.quantity AS stock_quantity
                 FROM stash_allocations a
                 JOIN yarn_stash s ON s.id = a.stash_entry_id
                 WHERE a.project_id = :pid
                 ORDER BY a.created_at ASC'
            );
            $stmt->execute([':pid' => $projectId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($rows as &$r) {
                $r['quantity_reserved'] = (int)$r['quantity_reserved'];
                $r['stock_quantity']    = (int)$r['stock_quantity'];
                $r['quantity_used']     = $r['quantity_used'] !== null ? (float)$r['quantity_used'] : null;
                $r['total_reserved_g']  = round((float)$r['weight_per_skein_g']  * $r['quantity_reserved'], 1);
                $r['total_reserved_m']  = round((float)$r['yardage_per_skein_m'] * $r['quantity_reserved'], 1);
            }
            unset($r);

            $this->sendResponse(200, ['success' => true, 'allocations' => $rows]);
        } catch (\Exception $e) {
            $this->sendResponse(500, ['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/projects/{id}/allocations
    // body: { stash_entry_id, quantity_reserved }
    // -------------------------------------------------------------------------

    public function create(int $projectId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $this->assertProjectOwner($projectId, $userId);

            $data = $this->getJsonInput();
            if (empty($data['stash_entry_id']) || empty($data['quantity_reserved'])) {
                $this->sendResponse(400, ['success' => false, 'error' => 'stash_entry_id et quantity_reserved sont requis']);
                return;
            }

            $stashEntryId     = (int)$data['stash_entry_id'];
            $quantityReserved = max(1, (int)$data['quantity_reserved']);

            // Vérifier que l'entrée stash appartient bien à l'utilisateur
            $stmtCheck = $this->db->prepare('SELECT id, quantity FROM yarn_stash WHERE id = :id AND user_id = :uid');
            $stmtCheck->execute([':id' => $stashEntryId, ':uid' => $userId]);
            $stashEntry = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if (!$stashEntry) {
                $this->sendResponse(404, ['success' => false, 'error' => 'Entrée de stock introuvable']);
                return;
            }

            // Vérifier la disponibilité (quantité totale - déjà réservée ailleurs)
            $stmtReserved = $this->db->prepare(
                'SELECT COALESCE(SUM(quantity_reserved), 0) FROM stash_allocations
                 WHERE stash_entry_id = :sid AND project_id != :pid'
            );
            $stmtReserved->execute([':sid' => $stashEntryId, ':pid' => $projectId]);
            $alreadyReserved = (int)$stmtReserved->fetchColumn();
            $available = (int)$stashEntry['quantity'] - $alreadyReserved;

            if ($quantityReserved > $available) {
                $this->sendResponse(409, [
                    'success'   => false,
                    'error'     => "Stock insuffisant. {$available} pelote(s) disponible(s).",
                    'available' => $available,
                ]);
                return;
            }

            $stmt = $this->db->prepare(
                'INSERT INTO stash_allocations (project_id, stash_entry_id, quantity_reserved)
                 VALUES (:pid, :sid, :qty)
                 ON DUPLICATE KEY UPDATE quantity_reserved = :qty2, updated_at = NOW()'
            );
            $stmt->execute([
                ':pid'  => $projectId,
                ':sid'  => $stashEntryId,
                ':qty'  => $quantityReserved,
                ':qty2' => $quantityReserved,
            ]);

            $this->sendResponse(201, ['success' => true, 'message' => 'Pelotes réservées pour ce projet']);
        } catch (\Exception $e) {
            $this->sendResponse(500, ['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // PUT /api/projects/{id}/allocations/{stash_entry_id}
    // body: { quantity_reserved }
    // -------------------------------------------------------------------------

    public function update(int $projectId, int $stashEntryId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $this->assertProjectOwner($projectId, $userId);

            $data             = $this->getJsonInput();
            $quantityReserved = max(1, (int)($data['quantity_reserved'] ?? 1));

            $stmt = $this->db->prepare(
                'UPDATE stash_allocations SET quantity_reserved = :qty
                 WHERE project_id = :pid AND stash_entry_id = :sid'
            );
            $stmt->execute([':qty' => $quantityReserved, ':pid' => $projectId, ':sid' => $stashEntryId]);

            $this->sendResponse(200, ['success' => true, 'message' => 'Allocation mise à jour']);
        } catch (\Exception $e) {
            $this->sendResponse(500, ['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // DELETE /api/projects/{id}/allocations/{stash_entry_id}
    // -------------------------------------------------------------------------

    public function delete(int $projectId, int $stashEntryId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $this->assertProjectOwner($projectId, $userId);

            $stmt = $this->db->prepare(
                'DELETE FROM stash_allocations WHERE project_id = :pid AND stash_entry_id = :sid'
            );
            $stmt->execute([':pid' => $projectId, ':sid' => $stashEntryId]);

            $this->sendResponse(200, ['success' => true, 'message' => 'Allocation supprimée']);
        } catch (\Exception $e) {
            $this->sendResponse(500, ['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/projects/{id}/close
    // body: [{ stash_entry_id, quantity_used }]  — une ligne par allocation
    // Décrémente le stock, remet les restes, marque le projet completed.
    // -------------------------------------------------------------------------

    public function closeProject(int $projectId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $this->assertProjectOwner($projectId, $userId);

            $data = $this->getJsonInput();
            // $data est un tableau d'objets { stash_entry_id, quantity_used }
            if (!is_array($data)) {
                $this->sendResponse(400, ['success' => false, 'error' => 'Format invalide']);
                return;
            }

            $this->db->beginTransaction();

            $remainders = [];

            foreach ($data as $item) {
                $stashEntryId = (int)$item['stash_entry_id'];
                $quantityUsed = max(0, (float)$item['quantity_used']);

                // Récupérer l'allocation
                $stmtAlloc = $this->db->prepare(
                    'SELECT quantity_reserved FROM stash_allocations
                     WHERE project_id = :pid AND stash_entry_id = :sid'
                );
                $stmtAlloc->execute([':pid' => $projectId, ':sid' => $stashEntryId]);
                $alloc = $stmtAlloc->fetch(PDO::FETCH_ASSOC);
                if (!$alloc) continue;

                $reserved  = (int)$alloc['quantity_reserved'];
                $remainder = max(0, $reserved - $quantityUsed);

                // Enregistrer la quantité utilisée
                $stmtUpdate = $this->db->prepare(
                    'UPDATE stash_allocations SET quantity_used = :used
                     WHERE project_id = :pid AND stash_entry_id = :sid'
                );
                $stmtUpdate->execute([':used' => $quantityUsed, ':pid' => $projectId, ':sid' => $stashEntryId]);

                // Décrémenter le stock (enlever les pelotes réservées)
                $stmtDecr = $this->db->prepare(
                    'UPDATE yarn_stash SET quantity = GREATEST(0, quantity - :reserved)
                     WHERE id = :sid AND user_id = :uid'
                );
                $stmtDecr->execute([':reserved' => $reserved, ':sid' => $stashEntryId, ':uid' => $userId]);

                // Remettre le reste si > 0 (en pelotes entières arrondies vers le bas)
                $remainderInt = (int)floor($remainder);
                if ($remainderInt > 0) {
                    $stmtRemainder = $this->db->prepare(
                        'UPDATE yarn_stash SET quantity = quantity + :rem, notes = CONCAT(COALESCE(notes, ""), :note)
                         WHERE id = :sid AND user_id = :uid'
                    );
                    $note = "\n[Reste du projet #{$projectId}]";
                    $stmtRemainder->execute([
                        ':rem'  => $remainderInt,
                        ':note' => $note,
                        ':sid'  => $stashEntryId,
                        ':uid'  => $userId,
                    ]);
                    $remainders[] = ['stash_entry_id' => $stashEntryId, 'returned' => $remainderInt];
                }
            }

            // Marquer le projet comme terminé
            $stmtClose = $this->db->prepare(
                "UPDATE projects SET status = 'completed', completed_at = NOW() WHERE id = :pid AND user_id = :uid"
            );
            $stmtClose->execute([':pid' => $projectId, ':uid' => $userId]);

            $this->db->commit();

            $this->sendResponse(200, [
                'success'    => true,
                'message'    => 'Projet clôturé, stock mis à jour',
                'remainders' => $remainders,
            ]);
        } catch (\Exception $e) {
            $this->db->rollBack();
            $this->sendResponse(500, ['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function getUserIdFromAuth(): int
    {
        $userData = $this->authMiddleware->authenticate();
        if ($userData === null) {
            $this->sendResponse(401, ['success' => false, 'error' => 'Non authentifié']);
            exit;
        }
        return (int)$userData['user_id'];
    }

    private function assertProjectOwner(int $projectId, int $userId): void
    {
        $stmt = $this->db->prepare('SELECT id FROM projects WHERE id = :id AND user_id = :uid');
        $stmt->execute([':id' => $projectId, ':uid' => $userId]);
        if (!$stmt->fetch()) {
            $this->sendResponse(403, ['success' => false, 'error' => 'Projet introuvable ou accès non autorisé']);
            exit;
        }
    }

    private function getJsonInput(): array
    {
        $json = file_get_contents('php://input');
        if (empty($json) || trim($json) === '') return [];
        $data = json_decode($json, true);
        if (json_last_error() !== JSON_ERROR_NONE)
            throw new \InvalidArgumentException('JSON invalide : ' . json_last_error_msg());
        return $data ?? [];
    }

    private function sendResponse(int $statusCode, array $data): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
