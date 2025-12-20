<?php
/**
 * @file PatternOption.php
 * @brief Modèle pour gérer les options de personnalisation des patrons
 * @author Superpictor Team + AI Assistants
 * @created 2025-11-13
 * @modified 2025-11-13 by [AI:Claude] - Création du modèle PatternOption
 *
 * @history
 *   2025-11-13 [AI:Claude] Création initiale avec méthodes de récupération et gestion
 */

namespace App\Models;

use App\Config\Database;
use PDO;

class PatternOption extends BaseModel
{
    protected string $table = 'pattern_options';

    /**
     * [AI:Claude] Récupérer toutes les options organisées par groupe
     *
     * @param string|null $categoryKey Filtrer par catégorie (optionnel)
     * @param string|null $level Filtrer par niveau (optionnel)
     * @return array Options groupées par groupe
     */
    public function getOptionsGrouped(?string $categoryKey = null, ?string $level = null): array
    {
        $query = "SELECT * FROM {$this->table} WHERE is_active = 1";

        // [AI:Claude] Filtrage optionnel par catégorie
        if ($categoryKey !== null) {
            $query .= " AND (applicable_categories IS NULL OR JSON_CONTAINS(applicable_categories, :category))";
        }

        // [AI:Claude] Filtrage optionnel par niveau
        if ($level !== null) {
            $query .= " AND (applicable_levels IS NULL OR JSON_CONTAINS(applicable_levels, :level))";
        }

        $query .= " ORDER BY option_group, display_order ASC";

        $stmt = $this->db->prepare($query);

        if ($categoryKey !== null) {
            $categoryJson = json_encode($categoryKey);
            $stmt->bindParam(':category', $categoryJson);
        }

        if ($level !== null) {
            $levelJson = json_encode($level);
            $stmt->bindParam(':level', $levelJson);
        }

        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // [AI:Claude] Organiser par groupes
        $grouped = [];
        foreach ($rows as $row) {
            $group = $row['option_group'];

            if (!isset($grouped[$group])) {
                $grouped[$group] = [
                    'group_key' => $group,
                    'group_label' => $this->getGroupLabel($group),
                    'group_icon' => $this->getGroupIcon($group),
                    'options' => []
                ];
            }

            // [AI:Claude] Décoder les valeurs JSON
            $row['available_values'] = json_decode($row['available_values'], true);
            $row['applicable_categories'] = json_decode($row['applicable_categories'], true);
            $row['applicable_levels'] = json_decode($row['applicable_levels'], true);
            $row['required_for_categories'] = json_decode($row['required_for_categories'], true);

            $grouped[$group]['options'][] = $row;
        }

        return array_values($grouped);
    }

    /**
     * [AI:Claude] Récupérer les options requises pour une catégorie
     *
     * @param string $categoryKey Clé de la catégorie
     * @return array Options obligatoires
     */
    public function getRequiredOptions(string $categoryKey): array
    {
        $query = "SELECT * FROM {$this->table}
                  WHERE is_active = 1
                  AND JSON_CONTAINS(required_for_categories, :category)
                  ORDER BY option_group, display_order ASC";

        $stmt = $this->db->prepare($query);
        $categoryJson = json_encode($categoryKey);
        $stmt->bindParam(':category', $categoryJson);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rows as &$row) {
            $row['available_values'] = json_decode($row['available_values'], true);
            $row['applicable_categories'] = json_decode($row['applicable_categories'], true);
            $row['applicable_levels'] = json_decode($row['applicable_levels'], true);
            $row['required_for_categories'] = json_decode($row['required_for_categories'], true);
        }

        return $rows;
    }

    /**
     * [AI:Claude] Récupérer une option par sa clé
     *
     * @param string $optionKey Clé de l'option
     * @return array|null Option trouvée ou null
     */
    public function findByKey(string $optionKey): ?array
    {
        $query = "SELECT * FROM {$this->table} WHERE option_key = :option_key";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':option_key', $optionKey);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $row['available_values'] = json_decode($row['available_values'], true);
            $row['applicable_categories'] = json_decode($row['applicable_categories'], true);
            $row['applicable_levels'] = json_decode($row['applicable_levels'], true);
            $row['required_for_categories'] = json_decode($row['required_for_categories'], true);
        }

        return $row ?: null;
    }

    /**
     * [AI:Claude] Créer une nouvelle option
     *
     * @param array $data Données de l'option
     * @return int|false ID de l'option créée ou false
     */
    public function createOption(array $data): int|false
    {
        $fields = [
            'option_key', 'option_group', 'option_label', 'option_description',
            'field_type', 'available_values', 'default_value', 'min_value',
            'max_value', 'step_value', 'applicable_categories', 'applicable_levels',
            'required_for_categories', 'display_order', 'icon', 'ai_prompt_template',
            'affects_price', 'price_modifier', 'is_active', 'is_premium',
            'help_text', 'placeholder'
        ];

        $placeholders = [];
        $values = [];

        foreach ($fields as $field) {
            if (isset($data[$field])) {
                $placeholders[] = ":$field";

                // [AI:Claude] Encoder les champs JSON
                if (in_array($field, ['available_values', 'applicable_categories', 'applicable_levels', 'required_for_categories'])) {
                    $values[":$field"] = is_string($data[$field]) ? $data[$field] : json_encode($data[$field]);
                } else {
                    $values[":$field"] = $data[$field];
                }
            }
        }

        $fieldsList = implode(', ', array_keys($values));
        $placeholdersList = implode(', ', $placeholders);

        $query = "INSERT INTO {$this->table} ($fieldsList) VALUES ($placeholdersList)";
        $stmt = $this->db->prepare($query);

        if ($stmt->execute($values)) {
            return (int) $this->db->lastInsertId();
        }

        return false;
    }

    /**
     * [AI:Claude] Mettre à jour une option
     *
     * @param int $id ID de l'option
     * @param array $data Nouvelles données
     * @return bool Succès de la mise à jour
     */
    public function updateOption(int $id, array $data): bool
    {
        $allowedFields = [
            'option_label', 'option_description', 'field_type', 'available_values',
            'default_value', 'min_value', 'max_value', 'step_value',
            'applicable_categories', 'applicable_levels', 'required_for_categories',
            'display_order', 'icon', 'ai_prompt_template', 'affects_price',
            'price_modifier', 'is_active', 'is_premium', 'help_text', 'placeholder'
        ];

        $fields = [];
        $params = [':id' => $id];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";

                // [AI:Claude] Encoder les champs JSON
                if (in_array($field, ['available_values', 'applicable_categories', 'applicable_levels', 'required_for_categories'])) {
                    $params[":$field"] = is_string($data[$field]) ? $data[$field] : json_encode($data[$field]);
                } else {
                    $params[":$field"] = $data[$field];
                }
            }
        }

        if (empty($fields))
            return false;

        $query = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($query);

        return $stmt->execute($params);
    }

    /**
     * [AI:Claude] Supprimer une option (soft delete)
     *
     * @param int $id ID de l'option
     * @return bool Succès de la suppression
     */
    public function deleteOption(int $id): bool
    {
        return $this->updateOption($id, ['is_active' => false]);
    }

    /**
     * [AI:Claude] Vérifier si une clé d'option existe
     *
     * @param string $optionKey Clé de l'option
     * @return bool Existe ou non
     */
    public function optionKeyExists(string $optionKey): bool
    {
        $query = "SELECT COUNT(*) as count FROM {$this->table} WHERE option_key = :option_key";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':option_key', $optionKey);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] > 0;
    }

    /**
     * [AI:Claude] Récupérer toutes les options d'un groupe
     *
     * @param string $group Nom du groupe
     * @return array Options du groupe
     */
    public function getOptionsByGroup(string $group): array
    {
        $query = "SELECT * FROM {$this->table}
                  WHERE option_group = :group AND is_active = 1
                  ORDER BY display_order ASC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':group', $group);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rows as &$row) {
            $row['available_values'] = json_decode($row['available_values'], true);
            $row['applicable_categories'] = json_decode($row['applicable_categories'], true);
            $row['applicable_levels'] = json_decode($row['applicable_levels'], true);
            $row['required_for_categories'] = json_decode($row['required_for_categories'], true);
        }

        return $rows;
    }

    /**
     * [AI:Claude] Construire le prompt IA avec les options sélectionnées
     *
     * @param array $selectedOptions Options choisies par l'utilisateur ['option_key' => 'value']
     * @return string Fragment de prompt à ajouter
     */
    public function buildPromptFragment(array $selectedOptions): string
    {
        $promptParts = [];

        foreach ($selectedOptions as $optionKey => $value) {
            if (empty($value) || $value === 'any' || $value === 'auto') {
                continue; // [AI:Claude] Ignorer les valeurs vides ou auto
            }

            $option = $this->findByKey($optionKey);

            if (!$option || !$option['ai_prompt_template']) {
                continue;
            }

            // [AI:Claude] Trouver le label et la description de la valeur
            $valueLabel = $value;
            $valueDescription = '';

            if ($option['available_values']) {
                foreach ($option['available_values'] as $availableValue) {
                    if ($availableValue['value'] === $value) {
                        $valueLabel = $availableValue['label'];
                        $valueDescription = $availableValue['description'] ?? '';
                        break;
                    }
                }
            }

            // [AI:Claude] Remplacer les placeholders dans le template
            $prompt = $option['ai_prompt_template'];
            $prompt = str_replace('{value}', $value, $prompt);
            $prompt = str_replace('{label}', $valueLabel, $prompt);
            $prompt = str_replace('{description}', $valueDescription, $prompt);

            $promptParts[] = $prompt;
        }

        return !empty($promptParts) ? "\n\nOPTIONS DE PERSONNALISATION :\n" . implode("\n", $promptParts) : '';
    }

    /**
     * [AI:Claude] Calculer le modificateur de prix total
     *
     * @param array $selectedOptions Options choisies
     * @return float Modificateur de prix total
     */
    public function calculatePriceModifier(array $selectedOptions): float
    {
        $totalModifier = 0.0;

        foreach ($selectedOptions as $optionKey => $value) {
            if (empty($value)) continue;

            $option = $this->findByKey($optionKey);

            if ($option && $option['affects_price'] && $option['price_modifier'] != 0) {
                $totalModifier += (float) $option['price_modifier'];
            }
        }

        return $totalModifier;
    }

    /**
     * [AI:Claude] Helper : Obtenir le label d'un groupe
     */
    private function getGroupLabel(string $group): string
    {
        $labels = [
            'dimensions' => 'Dimensions & Ajustement',
            'style' => 'Style & Esthétique',
            'material' => 'Fil & Matériel',
            'usage' => 'Usage & Praticité',
            'format' => 'Format du patron',
            'special' => 'Options spéciales',
            'creative' => 'Personnalisation créative'
        ];

        return $labels[$group] ?? ucfirst($group);
    }

    /**
     * [AI:Claude] Helper : Obtenir l'icône d'un groupe
     */
    private function getGroupIcon(string $group): string
    {
        $icons = [
            'dimensions' => '📐',
            'style' => '🎨',
            'material' => '🧶',
            'usage' => '🎯',
            'format' => '📋',
            'special' => '⭐',
            'creative' => '💡'
        ];

        return $icons[$group] ?? '📌';
    }
}
