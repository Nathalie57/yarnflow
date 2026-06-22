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

            // Réservations actives par entrée (projets non clôturés)
            $stmtRes = $this->db->prepare(
                'SELECT a.stash_entry_id,
                        COALESCE(SUM(a.quantity_reserved), 0) AS quantity_reserved,
                        GROUP_CONCAT(p.name ORDER BY p.name SEPARATOR ", ") AS project_names
                 FROM stash_allocations a
                 JOIN projects p ON p.id = a.project_id
                 WHERE p.status != "completed" AND p.user_id = :uid
                 GROUP BY a.stash_entry_id'
            );
            $stmtRes->execute([':uid' => $userId]);
            $reservations = [];
            foreach ($stmtRes->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $reservations[(int)$r['stash_entry_id']] = [
                    'quantity_reserved' => (int)$r['quantity_reserved'],
                    'project_names'     => $r['project_names'],
                ];
            }

            // Calcul des totaux à la volée
            $totalSkeins   = 0;
            $totalWeightG  = 0.0;
            $totalYardageM = 0.0;
            foreach ($entries as &$e) {
                $e['total_weight_g']    = round((float)$e['weight_per_skein_g']    * (int)$e['quantity'], 1);
                $e['total_yardage_m']   = round((float)$e['yardage_per_skein_m']  * (int)$e['quantity'], 1);
                $res = $reservations[(int)$e['id']] ?? null;
                $e['quantity_reserved'] = $res ? $res['quantity_reserved'] : 0;
                $e['reserved_by']       = $res ? $res['project_names']     : null;
                $e['quantity_available'] = max(0, (int)$e['quantity'] - $e['quantity_reserved']);
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
                $limit = $isPlus ? 50 : 5;
                if ($count >= $limit) {
                    $error = $isPlus
                        ? 'Limite de 50 références atteinte. Passez à Pro pour un stock illimité.'
                        : 'Limite de 5 références atteinte. Passez à Plus ou Pro pour plus de stock.';
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
    // POST /api/stash/scan-label  — lecture IA d'une étiquette de pelote
    // -------------------------------------------------------------------------

    public function scanLabel(): void
    {
        try {
            $this->getUserIdFromAuth();

            if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
                $this->sendResponse(400, ['success' => false, 'error' => 'Fichier photo manquant ou invalide']);
                return;
            }

            $file = $_FILES['photo'];
            $this->validateImageFile($file);

            $apiKey = $_ENV['GEMINI_API_KEY'] ?? '';
            if (empty($apiKey)) {
                $this->sendResponse(503, ['success' => false, 'error' => 'Service IA non configuré']);
                return;
            }

            $imageData = base64_encode(file_get_contents($file['tmp_name']));
            $mimeType  = (new \finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);

            $prompt = <<<PROMPT
Analyse cette étiquette de pelote de laine et extrais les informations suivantes.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans bloc markdown.

Champs à extraire (retourne null si non trouvé sur l'étiquette) :
- brand: marque/fabricant (string)
- yarn_name: nom de la gamme ou du fil (string)
- color_name: nom du coloris (string)
- dye_lot: numéro de bain/lot (string)
- composition: matières, ex: "100% Mérinos" (string)
- weight_per_skein_g: poids par pelote en grammes (number)
- yardage_per_skein_m: métrage par pelote en mètres (number, convertir yards en mètres si besoin : 1 yard = 0.9144 m)
- needle_size_mm: taille d'aiguille recommandée en mm (number, valeur médiane si plage)
- yarn_weight_category: parmi "lace","fingering","sport","dk","worsted","aran","bulky","super_bulky" ou null

Exemple: {"brand":"Drops","yarn_name":"Merino Extra Fine","color_name":"Teal","dye_lot":"2024A","composition":"100% Mérinos","weight_per_skein_g":50,"yardage_per_skein_m":190,"needle_size_mm":3.5,"yarn_weight_category":"dk"}
PROMPT;

            $model    = 'gemini-2.5-flash';
            $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

            $payload = json_encode([
                'contents' => [[
                    'parts' => [
                        ['text' => $prompt],
                        ['inline_data' => ['mime_type' => $mimeType, 'data' => $imageData]],
                    ]
                ]],
                'generationConfig' => ['temperature' => 0.1, 'topK' => 10, 'topP' => 0.8],
            ]);

            $ch = curl_init($endpoint);
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $payload,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
                CURLOPT_TIMEOUT        => 30,
                CURLOPT_CONNECTTIMEOUT => 10,
            ]);
            $raw      = curl_exec($ch);
            $curlErr  = curl_error($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200 || $raw === false) {
                $this->sendResponse(502, ['success' => false, 'error' => 'Erreur lors de l\'analyse IA']);
                return;
            }

            $response  = json_decode($raw, true);
            $textPart  = $response['candidates'][0]['content']['parts'][0]['text'] ?? '';

            // Nettoyer les blocs markdown si présents
            $json = trim(preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($textPart)));
            $data = json_decode($json, true);

            if (!$data || !isset($data['brand'])) {
                $this->sendResponse(422, ['success' => false, 'error' => 'Impossible de lire l\'étiquette. Essaie avec une photo plus nette.']);
                return;
            }

            // Validation légère des types numériques
            foreach (['weight_per_skein_g', 'yardage_per_skein_m', 'needle_size_mm'] as $field) {
                if (isset($data[$field])) $data[$field] = is_numeric($data[$field]) ? (float)$data[$field] : null;
            }

            $allowed = ['lace','fingering','sport','dk','worsted','aran','bulky','super_bulky'];
            if (!in_array($data['yarn_weight_category'] ?? '', $allowed)) $data['yarn_weight_category'] = null;

            $this->sendResponse(200, ['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            $this->sendResponse(500, ['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/stash/{id}/photo
    // -------------------------------------------------------------------------

    public function uploadPhoto(int $id): void
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

            if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
                $this->sendResponse(400, ['success' => false, 'error' => 'Fichier photo manquant ou invalide']);
                return;
            }

            $file = $_FILES['photo'];
            $this->validateImageFile($file);
            $photoPath = $this->saveStashPhoto($file, $userId);

            if (!empty($entry['photo_url'])) {
                $oldPath = __DIR__ . '/../public' . $entry['photo_url'];
                if (file_exists($oldPath)) @unlink($oldPath);
            }

            $stmt = $this->db->prepare(
                'UPDATE yarn_stash SET photo_url = :photo WHERE id = :id AND user_id = :uid'
            );
            $stmt->execute([':photo' => $photoPath, ':id' => $id, ':uid' => $userId]);

            $this->sendResponse(200, ['success' => true, 'photo_url' => $photoPath]);
        } catch (\InvalidArgumentException $e) {
            $this->sendResponse(400, ['success' => false, 'error' => $e->getMessage()]);
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

    private function validateImageFile(array $file): void
    {
        $maxSize = 10 * 1024 * 1024;
        if ($file['size'] > $maxSize)
            throw new \InvalidArgumentException('Fichier trop volumineux. Maximum : 10 MB');
        if ($file['size'] === 0)
            throw new \InvalidArgumentException('Fichier vide');

        $mimeType = (new \finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);

        if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/webp']))
            throw new \InvalidArgumentException('Format invalide. Acceptés : JPEG, PNG, WebP');

        $imageInfo = @getimagesize($file['tmp_name']);
        if ($imageInfo === false)
            throw new \InvalidArgumentException('Image corrompue ou invalide');
    }

    private function saveStashPhoto(array $file, int $userId): string
    {
        $uploadsDir = __DIR__ . '/../public/uploads/stash';
        if (!is_dir($uploadsDir))
            mkdir($uploadsDir, 0755, true);

        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) ?: 'jpg';
        $filename  = sprintf('%d_%s_%s.%s', $userId, date('Ymd_His'), bin2hex(random_bytes(6)), $extension);
        $filepath  = $uploadsDir . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $filepath))
            throw new \Exception('Impossible de sauvegarder la photo');

        return '/uploads/stash/' . $filename;
    }

    private function sendResponse(int $statusCode, array $data): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
