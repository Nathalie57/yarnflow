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
     * [AI:Claude] Valider une URL
     *
     * @param string|null $url URL à valider
     * @param string $field Nom du champ
     * @return self
     */
    public function url(?string $url, string $field = 'url'): self
    {
        if ($url !== null && !filter_var($url, FILTER_VALIDATE_URL))
            $this->errors[$field][] = "L'URL n'est pas valide";

        return $this;
    }

    /**
     * [AI:Claude] Valider une URL sécurisée (HTTPS uniquement)
     *
     * @param string|null $url URL à valider
     * @param string $field Nom du champ
     * @return self
     */
    public function secureUrl(?string $url, string $field = 'url'): self
    {
        if ($url !== null) {
            if (!filter_var($url, FILTER_VALIDATE_URL)) {
                $this->errors[$field][] = "L'URL n'est pas valide";
            } elseif (!str_starts_with(strtolower($url), 'https://')) {
                $this->errors[$field][] = "L'URL doit utiliser HTTPS";
            }
        }

        return $this;
    }

    /**
     * [AI:Claude] Valider que l'URL ne contient pas de protocoles dangereux
     *
     * @param string|null $url URL à valider
     * @param string $field Nom du champ
     * @return self
     */
    public function safeUrl(?string $url, string $field = 'url'): self
    {
        if ($url !== null) {
            $dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
            $urlLower = strtolower(trim($url));

            foreach ($dangerousProtocols as $protocol) {
                if (str_starts_with($urlLower, $protocol)) {
                    $this->errors[$field][] = "Protocole d'URL non autorisé";
                    break;
                }
            }
        }

        return $this;
    }

    /**
     * [AI:Claude] Valider une valeur alphanumérique
     *
     * @param string|null $value Valeur à vérifier
     * @param string $field Nom du champ
     * @return self
     */
    public function alphanumeric(?string $value, string $field): self
    {
        if ($value !== null && !ctype_alnum(str_replace([' ', '-', '_'], '', $value)))
            $this->errors[$field][] = "Le champ {$field} ne doit contenir que des lettres et chiffres";

        return $this;
    }

    /**
     * [AI:Claude] Valider avec une expression régulière
     *
     * @param string|null $value Valeur à vérifier
     * @param string $pattern Pattern regex
     * @param string $field Nom du champ
     * @param string $message Message d'erreur personnalisé
     * @return self
     */
    public function regex(?string $value, string $pattern, string $field, string $message = null): self
    {
        if ($value !== null && !preg_match($pattern, $value)) {
            $this->errors[$field][] = $message ?? "Le champ {$field} ne correspond pas au format attendu";
        }

        return $this;
    }

    /**
     * [AI:Claude] Valider qu'une valeur est un JSON valide
     *
     * @param string|null $value Valeur à vérifier
     * @param string $field Nom du champ
     * @return self
     */
    public function json(?string $value, string $field): self
    {
        if ($value !== null) {
            json_decode($value);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->errors[$field][] = "Le champ {$field} doit être un JSON valide";
            }
        }

        return $this;
    }

    /**
     * [AI:Claude] Valider qu'une valeur est un tableau
     *
     * @param mixed $value Valeur à vérifier
     * @param string $field Nom du champ
     * @return self
     */
    public function array($value, string $field): self
    {
        if ($value !== null && !is_array($value))
            $this->errors[$field][] = "Le champ {$field} doit être un tableau";

        return $this;
    }

    /**
     * [AI:Claude] Valider qu'une date est valide (format Y-m-d)
     *
     * @param string|null $date Date à valider
     * @param string $field Nom du champ
     * @return self
     */
    public function date(?string $date, string $field = 'date'): self
    {
        if ($date !== null) {
            $d = \DateTime::createFromFormat('Y-m-d', $date);
            if (!$d || $d->format('Y-m-d') !== $date) {
                $this->errors[$field][] = "La date doit être au format YYYY-MM-DD";
            }
        }

        return $this;
    }

    /**
     * [AI:Claude] Sanitizer une chaîne (trim + strip tags)
     *
     * @param string|null $value Valeur à sanitizer
     * @return string|null Valeur sanitizée
     */
    public static function sanitizeString(?string $value): ?string
    {
        if ($value === null) return null;

        $value = trim($value);
        $value = strip_tags($value);

        return $value;
    }

    /**
     * [AI:Claude] Sanitizer un entier
     *
     * @param mixed $value Valeur à sanitizer
     * @return int|null Valeur sanitizée
     */
    public static function sanitizeInt($value): ?int
    {
        if ($value === null || $value === '') return null;

        return filter_var($value, FILTER_SANITIZE_NUMBER_INT);
    }

    /**
     * [AI:Claude] Sanitizer un email
     *
     * @param string|null $email Email à sanitizer
     * @return string|null Email sanitizé
     */
    public static function sanitizeEmail(?string $email): ?string
    {
        if ($email === null) return null;

        return filter_var(trim($email), FILTER_SANITIZE_EMAIL);
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
                    'url' => $this->url($value, $field),
                    'secureUrl' => $this->secureUrl($value, $field),
                    'safeUrl' => $this->safeUrl($value, $field),
                    'alphanumeric' => $this->alphanumeric($value, $field),
                    'json' => $this->json($value, $field),
                    'array' => $this->array($value, $field),
                    'date' => $this->date($value, $field),
                    'regex' => $this->regex($value, $params['pattern'], $field, $params['message'] ?? null),
                    default => null
                };
            }
        }

        return $this;
    }
}
