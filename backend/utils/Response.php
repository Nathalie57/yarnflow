<?php
/**
 * @file Response.php
 * @brief Utilitaire pour formater les réponses JSON de l'API
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

namespace App\Utils;

/**
 * [AI:Claude] Classe utilitaire pour générer des réponses JSON standardisées
 */
class Response
{
    /**
     * [AI:Claude] Envoyer une réponse JSON de succès
     *
     * @param mixed $data Données à retourner
     * @param int $statusCode Code HTTP (200 par défaut)
     * @param string|null $message Message optionnel
     */
    public static function success($data = null, int $statusCode = HTTP_OK, ?string $message = null): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');

        $response = [
            'success' => true,
            'status' => $statusCode
        ];

        if ($message !== null)
            $response['message'] = $message;

        if ($data !== null)
            $response['data'] = $data;

        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * [AI:Claude] Envoyer une réponse JSON d'erreur
     *
     * @param string $message Message d'erreur
     * @param int $statusCode Code HTTP (400 par défaut)
     * @param array|null $errors Détails des erreurs optionnels
     */
    public static function error(
        string $message,
        int $statusCode = HTTP_BAD_REQUEST,
        ?array $errors = null
    ): void {
        http_response_code($statusCode);
        header('Content-Type: application/json');

        $response = [
            'success' => false,
            'status' => $statusCode,
            'message' => $message
        ];

        if ($errors !== null)
            $response['errors'] = $errors;

        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * [AI:Claude] Envoyer une réponse de création réussie
     *
     * @param mixed $data Données créées
     * @param string|null $message Message optionnel
     */
    public static function created($data, ?string $message = 'Ressource créée avec succès'): void
    {
        self::success($data, HTTP_CREATED, $message);
    }

    /**
     * [AI:Claude] Envoyer une réponse de ressource non trouvée
     *
     * @param string $message Message personnalisé
     */
    public static function notFound(string $message = 'Ressource introuvable'): void
    {
        self::error($message, HTTP_NOT_FOUND);
    }

    /**
     * [AI:Claude] Envoyer une réponse d'erreur de validation
     *
     * @param array $errors Tableau des erreurs de validation
     */
    public static function validationError(array $errors): void
    {
        self::error('Erreur de validation', HTTP_UNPROCESSABLE, $errors);
    }

    /**
     * [AI:Claude] Envoyer une réponse d'erreur serveur
     *
     * @param string $message Message d'erreur
     */
    public static function serverError(string $message = 'Erreur serveur'): void
    {
        self::error($message, HTTP_SERVER_ERROR);
    }

    /**
     * [AI:Claude] Envoyer une réponse non autorisée
     *
     * @param string $message Message personnalisé
     */
    public static function unauthorized(string $message = 'Non autorisé'): void
    {
        self::error($message, HTTP_UNAUTHORIZED);
    }

    /**
     * [AI:Claude] Envoyer une réponse interdite
     *
     * @param string $message Message personnalisé
     */
    public static function forbidden(string $message = 'Accès interdit'): void
    {
        self::error($message, HTTP_FORBIDDEN);
    }
}
