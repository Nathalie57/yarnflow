<?php
/**
 * @file YarnStashController.php
 * @brief Contrôleur REST pour le stock de laine (Le Stash)
 * @author Nathalie + AI Assistants
 * @created 2026-06-09
 * @modified 2026-06-09 by [AI:Claude] - Création Phase 1 : CRUD stock + limite FREE (10 entrées)
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;
use App\Middleware\AuthMiddleware;
use App\Config\Database;
use PDO;

class YarnStashController
{
    private AuthMiddleware $authMiddleware;
    private User $userModel;
    private PDO $db;

    public function __construct()
    {
        $this->authMiddleware = new AuthMiddleware();
        $this->userModel = new User();

        $this->db = Database::getInstance()->getConnection();
    }

    // -------------------------------------------------------------------------
    // GET /api/stash
    // -------------------------------------------------------------------------

    /**
     * Liste le stock de l'utilisateur connecté, avec stats globales.
     */
    public function index(array $params = []): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            $sortMap = [
                'brand_asc'   => 'brand ASC, yarn_name ASC',
                'quantity_desc' => 'quantity DESC',
                'quantity_asc'  => 'quantity ASC',
                'date_desc'   => 'created_at DESC',
                'date_asc'    => 'created_at ASC',
            ];
            $sort = $sortMap[$params['sort'] ?? 'date_desc'] ?? 'created_at DESC';

            $where  = ['user_id = :uid'];
            $bind   = [':uid' => $userId];

            if (!empty($params['brand'])) {
                $where[] = 'brand = :brand';
                $bind[':brand'] = $params['brand'];
            }

            if (!empty($params['yarn_weight_category'])) {
                $where[] = 'yarn_weight_category = :cat';
                $bind[':cat'] = $params['yarn_weight_category'];
            }

            if (!empty($params['search'])) {
                $where[] = '(brand LIKE :q OR yarn_name LIKE :q OR color_name LIKE :q)';
                $bind[':q'] = '%' . $params['search'] . '%';
            }

            $sql = 'SELECT * FROM yarn_stash WHERE ' . implode(' AND ', $where)
                 . ' ORDER BY ' . $sort;

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bind);
            $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Calcul des totaux à la volée
            $totalSkeins   = 0;
            $totalWeightG  = 0.0;
            $totalYardageM = 0.0;
            foreach ($entries as &$e) {
                $e['total_weight_g']    = round((float)$e['weight_per_skein_g']    * (int)$e['quantity'], 1);
                $e['total_yardage_m']   = round((float)$e['yardage_per_skein_m']  * (int)$e['quantity'], 1);
                $totalSkeins            += (int)$e['quantity'];
                $totalWeightG           += $e['total_weight_g'];
                $totalYardageM          += $e['total_yardage_m'];
            }
            unset($e);

            // Marques distinctes (pour les filtres frontend)
            $stmtBrands = $this->db->prepare(
                'SELECT DISTINCT brand FROM yarn_stash WHERE user_id = :uid ORDER BY brand'
            );
            $stmtBrands->execute([':uid' => $userId]);
            $brands = $stmtBrands->fetchAll(PDO::FETCH_COLUMN);

            $this->sendResponse(200, [
                'success' => true,
                'entries' => $entries,
                'count'   => count($entries),
                'stats'   => [
                    'total_references' => count($entries),
                    'total_skeins'     => $totalSkeins,
                    'total_weight_g'   => round($totalWeightG, 1),
                    'total_yardage_m'  => round($totalYardageM, 1),
                ],
                'brands' => $brands,
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, ['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/stash/{id}
    // -------------------------------------------------------------------------

    public function show(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $entry  = $this->findEntry($id);

            if (!$entry) {
                $this->sendResponse(404, ['success' => false, 'error' => 'Entrée introuvable']);
                return;
            }

            if ((int)$entry['user_id'] !== $userId) {
                $this->sendResponse(403, ['success' => false, 'error' => 'Accès non autorisé']);
                return;
            }

            $entry['total_weight_g']  = round((float)$entry['weight_per_skein_g']   * (int)$entry['quantity'], 1);
            $entry['total_yardage_m'] = round((float)$entry['yardage_per_skein_m'] * (int)$entry['quantity'], 1);

            $this->sendResponse(200, ['success' => true, 'entry' => $entry]);
        } catch (\Exception $e) {
            $this->sendResponse(500, ['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/stash
    // -------------------------------------------------------------------------

    public function create(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            // Vérification limite FREE (10 entrées max)
            $user = $this->userModel->findById($userId);
            if (!$user) {
                $this->sendResponse(404, ['success' => false, 'error' => 'Utilisateur introuvable']);
                return;
            }

            $plan   = $user['subscription_type'] ?? 'free';
            $isPro  = in_array($plan, ['pro', 'pro_annual', 'early_bird']);
            $isPlus = in_array($plan, ['plus', 'plus_annual']);

            if (!$isPro) {
                $count = $this->getStashCount($userId);
                $limit = $isPlus ? 50 : 10;
                if ($count >= $limit) {
                    $error = $isPlus
                        ? 'Limite de 50 références atteinte. Passez à Pro pour un stock illimité.'
                        : 'Limite de 10 références atteinte. Passez à Plus ou Pro pour plus de stock.';
                    $this->sendResponse(403, [
                        'success'          => false,
                        'error'            => $error,
                        'upgrade_required' => true,
                        'current_count'    => $count,
                        'max_count'        => $limit,
                    ]);
                    return;
                }
            }

            $data = $this->getJsonInput();
            $this->validateRequired($data, ['brand', 'yarn_name', 'weight_per_skein_g', 'yardage_per_skein_m', 'quantity']);

            $stmt = $this->db->prepare(
                'INSERT INTO yarn_stash
                    (user_id, brand, yarn_name, color_name, dye_lot, composition,
                     weight_per_skein_g, yardage_per_skein_m, quantity,
                     needle_size_mm, yarn_weight_category, color_hex, photo_url, purchase_url, notes)
                 VALUES
                    (:uid, :brand, :yarn_name, :color_name, :dye_lot, :composition,
                     :weight_g, :yardage_m, :qty,
                     :needle, :cat, :hex, :photo, :purchase_url, :notes)'
            );

            $stmt->execute([
                ':uid'        => $userId,
                ':brand'      => trim($data['brand']),
                ':yarn_name'  => trim($data['yarn_name']),
                ':color_name' => isset($data['color_name'])  ? trim($data['color_name'])  : null,
                ':dye_lot'    => isset($data['dye_lot'])     ? trim($data['dye_lot'])     : null,
                ':composition'=> isset($data['composition']) ? trim($data['composition']) : null,
                ':weight_g'   => (float)$data['weight_per_skein_g'],
                ':yardage_m'  => (float)$data['yardage_per_skein_m'],
                ':qty'        => max(1, (int)$data['quantity']),
                ':needle'     => isset($data['needle_size_mm'])       ? (float)$data['needle_size_mm']   : null,
                ':cat'        => isset($data['yarn_weight_category']) ? trim($data['yarn_weight_category']) : null,
                ':hex'        => isset($data['color_hex'])  ? trim($data['color_hex'])  : null,
                ':photo'        => isset($data['photo_url'])    ? trim($data['photo_url'])    : null,
                ':purchase_url' => isset($data['purchase_url']) ? trim($data['purchase_url']) : null,
                ':notes'        => isset($data['notes'])        ? trim($data['notes'])        : null,
            ]);

            $newId = (int)$this->db->lastInsertId();
            $entry = $this->findEntry($newId);
            $entry['total_weight_g']  = round((float)$entry['weight_per_skein_g']   * (int)$entry['quantity'], 1);
            $entry['total_yardage_m'] = round((float)$entry['yardage_per_skein_m'] * (int)$entry['quantity'], 1);

            $this->sendResponse(201, [
                'success' => true,
                'message' => 'Entrée ajoutée au stock',
                'entry'   => $entry,
            ]);
        } catch (\InvalidArgumentException $e) {
            $this->sendResponse(400, ['success' => false, 'error' => $e->getMessage()]);
        } catch (\Exception $e) {
            $this->sendResponse(500, ['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // PUT /api/stash/{id}
    // -------------------------------------------------------------------------

    public function update(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $entry  = $this->findEntry($id);

            if (!$entry) {
                $this->sendResponse(404, ['success' => false, 'error' => 'Entrée introuvable']);
                return;
            }

            if ((int)$entry['user_id'] !== $userId) {
                $this->sendResponse(403, ['success' => false, 'error' => 'Accès non autorisé']);
                return;
            }

            $data = $this->getJsonInput();
            $this->validateRequired($data, ['brand', 'yarn_name', 'weight_per_skein_g', 'yardage_per_skein_m', 'quantity']);

            $stmt = $this->db->prepare(
                'UPDATE yarn_stash SET
                    brand = :brand, yarn_name = :yarn_name, color_name = :color_name,
                    dye_lot = :dye_lot, composition = :composition,
                    weight_per_skein_g = :weight_g, yardage_per_skein_m = :yardage_m,
                    quantity = :qty, needle_size_mm = :needle,
                    yarn_weight_category = :cat, color_hex = :hex,
                    photo_url = :photo, purchase_url = :purchase_url, notes = :notes
                 WHERE id = :id AND user_id = :uid'
            );

            $stmt->execute([
                ':brand'      => trim($data['brand']),
                ':yarn_name'  => trim($data['yarn_name']),
                ':color_name' => isset($data['color_name'])  ? trim($data['color_name'])  : null,
                ':dye_lot'    => isset($data['dye_lot'])     ? trim($data['dye_lot'])     : null,
                ':composition'=> isset($data['composition']) ? trim($data['composition']) : null,
                ':weight_g'   => (float)$data['weight_per_skein_g'],
                ':yardage_m'  => (float)$data['yardage_per_skein_m'],
                ':qty'        => max(1, (int)$data['quantity']),
                ':needle'     => isset($data['needle_size_mm'])       ? (float)$data['needle_size_mm']   : null,
                ':cat'        => isset($data['yarn_weight_category']) ? trim($data['yarn_weight_category']) : null,
                ':hex'        => isset($data['color_hex'])  ? trim($data['color_hex'])  : null,
                ':photo'        => isset($data['photo_url'])    ? trim($data['photo_url'])    : null,
                ':purchase_url' => isset($data['purchase_url']) ? trim($data['purchase_url']) : null,
                ':notes'        => isset($data['notes'])        ? trim($data['notes'])        : null,
                ':id'           => $id,
                ':uid'        => $userId,
            ]);

            $updated = $this->findEntry($id);
            $updated['total_weight_g']  = round((float)$updated['weight_per_skein_g']   * (int)$updated['quantity'], 1);
            $updated['total_yardage_m'] = round((float)$updated['yardage_per_skein_m'] * (int)$updated['quantity'], 1);

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Entrée mise à jour',
                'entry'   => $updated,
            ]);
        } catch (\InvalidArgumentException $e) {
            $this->sendResponse(400, ['success' => false, 'error' => $e->getMessage()]);
        } catch (\Exception $e) {
            $this->sendResponse(500, ['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // DELETE /api/stash/{id}
    // -------------------------------------------------------------------------

    public function delete(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $entry  = $this->findEntry($id);

            if (!$entry) {
                $this->sendResponse(404, ['success' => false, 'error' => 'Entrée introuvable']);
                return;
            }

            if ((int)$entry['user_id'] !== $userId) {
                $this->sendResponse(403, ['success' => false, 'error' => 'Accès non autorisé']);
                return;
            }

            $stmt = $this->db->prepare('DELETE FROM yarn_stash WHERE id = :id AND user_id = :uid');
            $stmt->execute([':id' => $id, ':uid' => $userId]);

            $this->sendResponse(200, ['success' => true, 'message' => 'Entrée supprimée']);
        } catch (\Exception $e) {
            $this->sendResponse(500, ['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // Helpers privés
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

    private function getJsonInput(): array
    {
        $json = file_get_contents('php://input');
        if (empty($json) || trim($json) === '') {
            return [];
        }
        $data = json_decode($json, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \InvalidArgumentException('JSON invalide : ' . json_last_error_msg());
        }
        return $data ?? [];
    }

    private function validateRequired(array $data, array $fields): void
    {
        foreach ($fields as $field) {
            if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                throw new \InvalidArgumentException("Champ obligatoire manquant : {$field}");
            }
        }
    }

    private function findEntry(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM yarn_stash WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    private function getStashCount(int $userId): int
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM yarn_stash WHERE user_id = :uid');
        $stmt->execute([':uid' => $userId]);
        return (int)$stmt->fetchColumn();
    }

    private function sendResponse(int $statusCode, array $data): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
