<?php
/**
 * @file Validator.php
 * @brief Utilitaire de validation des données
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

namespace App\Utils;

/**
 * [AI:Claude] Classe utilitaire pour valider les données entrantes
 */
class Validator
{
    private array $errors = [];

    /**
     * [AI:Claude] Valider qu'un champ est requis
     *
     * @param mixed $value Valeur à vérifier
     * @param string $field Nom du champ
     * @return self
     */
    public function required($value, string $field): self
    {
        if ($value === null || $value === '')
            $this->errors[$field][] = "Le champ {$field} est requis";

        return $this;
    }

    /**
     * [AI:Claude] Valider un email
     *
     * @param string|null $email Email à valider
     * @param string $field Nom du champ
     * @return self
     */
    public function email(?string $email, string $field = 'email'): self
    {
        if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL))
            $this->errors[$field][] = "L'email n'est pas valide";

        return $this;
    }

    /**
     * [AI:Claude] Valider la longueur minimale
     *
     * @param string|null $value Valeur à vérifier
     * @param int $min Longueur minimale
     * @param string $field Nom du champ
     * @return self
     */
    public function minLength(?string $value, int $min, string $field): self
    {
        if ($value !== null && strlen($value) < $min)
            $this->errors[$field][] = "Le champ {$field} doit contenir au moins {$min} caractères";

        return $this;
    }

    /**
     * [AI:Claude] Valider la longueur maximale
     *
     * @param string|null $value Valeur à vérifier
     * @param int $max Longueur maximale
     * @param string $field Nom du champ
     * @return self
     */
    public function maxLength(?string $value, int $max, string $field): self
    {
        if ($value !== null && strlen($value) > $max)
            $this->errors[$field][] = "Le champ {$field} ne doit pas dépasser {$max} caractères";

        return $this;
    }

    /**
     * [AI:Claude] Valider qu'une valeur est dans une liste
     *
     * @param mixed $value Valeur à vérifier
     * @param array $allowed Valeurs autorisées
     * @param string $field Nom du champ
     * @return self
     */
    public function in($value, array $allowed, string $field): self
    {
        if ($value !== null && !in_array($value, $allowed, true))
            $this->errors[$field][] = "Le champ {$field} doit être l'une des valeurs : ".implode(', ', $allowed);

        return $this;
    }

    /**
     * [AI:Claude] Valider qu'une valeur est numérique
     *
     * @param mixed $value Valeur à vérifier
     * @param string $field Nom du champ
     * @return self
     */
    public function numeric($value, string $field): self
    {
        if ($value !== null && !is_numeric($value))
            $this->errors[$field][] = "Le champ {$field} doit être numérique";

        return $this;
    }

    /**
     * [AI:Claude] Valider qu'une valeur est un entier
     *
     * @param mixed $value Valeur à vérifier
     * @param string $field Nom du champ
     * @return self
     */
    public function integer($value, string $field): self
    {
        if ($value !== null && filter_var($value, FILTER_VALIDATE_INT) === false)
            $this->errors[$field][] = "Le champ {$field} doit être un entier";

        return $this;
    }

    /**
     * [AI:Claude] Valider qu'une valeur est positive
     *
     * @param mixed $value Valeur à vérifier
     * @param string $field Nom du champ
     * @return self
     */
    public function positive($value, string $field): self
    {
        if ($value !== null && (float)$value <= 0)
            $this->errors[$field][] = "Le champ {$field} doit être positif";

        return $this;
    }

    /**
     * [AI:Claude] Vérifier si la validation a échoué
     *
     * @return bool True si erreurs présentes
     */
    public function fails(): bool
    {
        return !empty($this->errors);
    }

    /**
     * [AI:Claude] Obtenir les erreurs de validation
     *
     * @return array Tableau des erreurs
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    /**
     * [AI:Claude] Valider plusieurs champs à la fois
     *
     * @param array $data Données à valider
     * @param array $rules Règles de validation
     * @return self
     */
    public function validate(array $data, array $rules): self
    {
        foreach ($rules as $field => $fieldRules) {
            $value = $data[$field] ?? null;

            foreach ($fieldRules as $rule => $params) {
                match($rule) {
                    'required' => $this->required($value, $field),
                    'email' => $this->email($value, $field),
                    'min' => $this->minLength($value, $params, $field),
                    'max' => $this->maxLength($value, $params, $field),
                    'in' => $this->in($value, $params, $field),
                    'numeric' => $this->numeric($value, $field),
                    'integer' => $this->integer($value, $field),
                    'positive' => $this->positive($value, $field),
                    default => null
                };
            }
        }

        return $this;
    }
}
