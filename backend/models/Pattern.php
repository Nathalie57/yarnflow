<?php
/**
 * @file Pattern.php
 * @brief Modèle pour la gestion des patrons de crochet
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

namespace App\Models;

/**
 * [AI:Claude] Modèle Pattern pour gérer les patrons de crochet générés
 */
class Pattern extends BaseModel
{
    protected string $table = 'patterns';

    /**
     * [AI:Claude] Créer un nouveau patron (draft initial)
     *
     * @param int $userId ID de l'utilisateur
     * @param string $level Niveau (beginner, intermediate, advanced)
     * @param string $type Type de projet (hat, scarf, etc.)
     * @param string|null $size Taille demandée
     * @param float $price Prix du patron
     * @return int ID du nouveau patron
     */
    public function createPattern(
        int $userId,
        string $level,
        string $type,
        ?string $size = null,
        float $price = 0.0
    ): int {
        $data = [
            'user_id' => $userId,
            'level' => $level,
            'type' => $type,
            'size' => $size,
            'status' => PATTERN_DRAFT,
            'price_paid' => $price,
            'is_paid' => $price > 0
        ];

        return $this->create($data);
    }

    /**
     * [AI:Claude] Récupérer tous les patrons d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @param int $limit Limite de résultats
     * @param int $offset Décalage pour pagination
     * @return array Liste des patrons
     */
    public function findByUserId(int $userId, int $limit = 50, int $offset = 0): array
    {
        return $this->findBy(['user_id' => $userId], $limit, $offset);
    }

    /**
     * [AI:Claude] Mettre à jour le statut d'un patron
     *
     * @param int $patternId ID du patron
     * @param string $status Nouveau statut (draft, generating, completed, error)
     * @return bool Succès de la mise à jour
     */
    public function updateStatus(int $patternId, string $status): bool
    {
        return $this->update($patternId, ['status' => $status]);
    }

    /**
     * [AI:Claude] Sauvegarder le contenu généré par l'IA
     *
     * @param int $patternId ID du patron
     * @param array $generatedData Données générées (title, content, materials, etc.)
     * @return bool Succès de la mise à jour
     */
    public function saveGeneratedContent(int $patternId, array $generatedData): bool
    {
        $data = [
            'title' => $generatedData['title'] ?? 'Patron sans titre',
            'content' => $generatedData['content'] ?? '',
            'materials' => isset($generatedData['materials'])
                ? json_encode($generatedData['materials'])
                : null,
            'yarn_weight' => $generatedData['yarn_weight'] ?? null,
            'hook_size' => $generatedData['hook_size'] ?? null,
            'estimated_time' => $generatedData['estimated_time'] ?? null,
            'status' => PATTERN_COMPLETED
        ];

        return $this->update($patternId, $data);
    }

    /**
     * [AI:Claude] Enregistrer une erreur de génération
     *
     * @param int $patternId ID du patron
     * @param string $errorMessage Message d'erreur
     * @return bool Succès de la mise à jour
     */
    public function saveError(int $patternId, string $errorMessage): bool
    {
        return $this->update($patternId, [
            'status' => PATTERN_ERROR,
            'error_message' => $errorMessage
        ]);
    }

    /**
     * [AI:Claude] Enregistrer les métadonnées de génération IA
     *
     * @param int $patternId ID du patron
     * @param string $aiProvider Provider IA (claude ou openai)
     * @param string $prompt Prompt envoyé à l'IA
     * @param int|null $tokensUsed Nombre de tokens utilisés
     * @return bool Succès de la mise à jour
     */
    public function saveAiMetadata(
        int $patternId,
        string $aiProvider,
        string $prompt,
        ?int $tokensUsed = null
    ): bool {
        return $this->update($patternId, [
            'ai_provider' => $aiProvider,
            'generation_prompt' => $prompt,
            'tokens_used' => $tokensUsed
        ]);
    }

    /**
     * [AI:Claude] Définir le filigrane pour un patron
     *
     * @param int $patternId ID du patron
     * @param string $watermark Texte du filigrane (généralement l'email)
     * @return bool Succès de la mise à jour
     */
    public function setWatermark(int $patternId, string $watermark): bool
    {
        return $this->update($patternId, ['watermark' => $watermark]);
    }

    /**
     * [AI:Claude] Vérifier si un patron appartient à un utilisateur
     *
     * @param int $patternId ID du patron
     * @param int $userId ID de l'utilisateur
     * @return bool True si le patron appartient à l'utilisateur
     */
    public function belongsToUser(int $patternId, int $userId): bool
    {
        $pattern = $this->findById($patternId);
        return $pattern !== null && (int)$pattern['user_id'] === $userId;
    }

    /**
     * [AI:Claude] Récupérer les statistiques des patrons par type
     *
     * @return array Statistiques par type
     */
    public function getStatsByType(): array
    {
        $sql = "SELECT type, COUNT(*) as count, AVG(price_paid) as avg_price
                FROM {$this->table}
                WHERE status = :status
                GROUP BY type";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['status' => PATTERN_COMPLETED]);

        return $stmt->fetchAll();
    }

    /**
     * [AI:Claude] Récupérer les derniers patrons complétés
     *
     * @param int $limit Nombre de patrons à récupérer
     * @return array Liste des derniers patrons
     */
    public function getRecentCompleted(int $limit = 10): array
    {
        $sql = "SELECT * FROM {$this->table}
                WHERE status = :status
                ORDER BY created_at DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':status', PATTERN_COMPLETED);
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}
