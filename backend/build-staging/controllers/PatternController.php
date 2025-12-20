<?php
/**
 * @file PatternController.php
 * @brief Contrôleur pour la gestion des patrons
 * @author Superpictor Team + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-14 by [AI:Claude] - Génération asynchrone via queue
 *
 * @history
 *   2025-11-14 [AI:Claude] Ajout génération asynchrone avec queue de jobs
 *   2025-11-12 [AI:Claude] Création initiale
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Models\Pattern;
use App\Models\User;
use App\Models\Job;
use App\Services\AIPatternService;
use App\Services\PricingService;
use App\Services\PDFService;
use App\Middleware\AuthMiddleware;
use App\Utils\Response;
use App\Utils\Validator;

/**
 * [AI:Claude] Contrôleur de gestion des patrons
 */
class PatternController
{
    private Pattern $patternModel;
    private User $userModel;
    private Job $jobModel;
    private AIPatternService $aiService;
    private PricingService $pricingService;
    private PDFService $pdfService;
    private AuthMiddleware $authMiddleware;

    public function __construct()
    {
        $this->patternModel = new Pattern();
        $this->userModel = new User();
        $this->jobModel = new Job();
        $this->aiService = new AIPatternService();
        $this->pricingService = new PricingService();
        $this->pdfService = new PDFService();
        $this->authMiddleware = new AuthMiddleware();
    }

    /**
     * [AI:Claude] Calculer le prix d'un patron
     * POST /api/patterns/calculate-price
     */
    public function calculatePrice(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator();
        $validator
            ->required($data['type'] ?? null, 'type')
            ->in($data['type'] ?? null, [TYPE_HAT, TYPE_SCARF, TYPE_AMIGURUMI, TYPE_BAG, TYPE_GARMENT], 'type')
            ->required($data['level'] ?? null, 'level')
            ->in($data['level'] ?? null, [LEVEL_BEGINNER, LEVEL_INTERMEDIATE, LEVEL_ADVANCED], 'level');

        if ($validator->fails())
            Response::validationError($validator->getErrors());

        $breakdown = $this->pricingService->getPriceBreakdown(
            $data['type'],
            $data['level'],
            $data['options'] ?? []
        );

        Response::success($breakdown);
    }

    /**
     * [AI:Claude] Générer un nouveau patron (VERSION ASYNCHRONE)
     * POST /api/patterns/generate
     */
    public function generate(): void
    {
        $userData = $this->authMiddleware->authenticate();
        if ($userData === null) return;

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator();
        $validator
            ->required($data['type'] ?? null, 'type')
            ->in($data['type'] ?? null, [TYPE_HAT, TYPE_SCARF, TYPE_AMIGURUMI, TYPE_BAG, TYPE_GARMENT], 'type')
            ->required($data['level'] ?? null, 'level')
            ->in($data['level'] ?? null, [LEVEL_BEGINNER, LEVEL_INTERMEDIATE, LEVEL_ADVANCED], 'level');

        if ($validator->fails())
            Response::validationError($validator->getErrors());

        $user = $this->userModel->findById($userData['user_id']);
        $hasSubscription = $this->userModel->hasActiveSubscription($user['id']);
        $canGenerateFree = $this->pricingService->canGenerateFree(
            $user['patterns_generated_count'],
            $hasSubscription
        );

        $price = $this->pricingService->calculatePrice(
            $data['type'],
            $data['level'],
            $data['options'] ?? []
        );

        if (!$canGenerateFree && !$hasSubscription && !isset($data['payment_confirmed']))
            Response::error('Paiement requis', HTTP_FORBIDDEN, [
                'price' => $price,
                'requires_payment' => true
            ]);

        try {
            // [AI:Claude] Créer le patron en statut "generating"
            $patternId = $this->patternModel->createPattern(
                $user['id'],
                $data['level'],
                $data['type'],
                $data['size'] ?? null,
                $canGenerateFree ? 0 : $price
            );

            $this->patternModel->updateStatus($patternId, PATTERN_GENERATING);

            // [AI:Claude] Créer un job dans la queue pour génération asynchrone
            $jobId = $this->jobModel->createJob(
                Job::TYPE_GENERATE_PATTERN,
                [
                    'pattern_id' => $patternId,
                    'user_id' => $user['id'],
                    'params' => [
                        'type' => $data['type'],
                        'level' => $data['level'],
                        'size' => $data['size'] ?? 'adulte',
                        'custom_options' => $data['custom_options'] ?? null,
                        'specificRequest' => $data['specificRequest'] ?? null
                    ]
                ]
            );

            // [AI:Claude] Lier le job au patron
            $this->jobModel->linkToPattern($patternId, $jobId);

            // [AI:Claude] Retourner immédiatement avec l'ID du patron
            Response::created([
                'pattern_id' => $patternId,
                'job_id' => $jobId,
                'status' => PATTERN_GENERATING,
                'price_paid' => $canGenerateFree ? 0 : $price,
                'message' => 'Génération en cours... Vous serez notifié une fois terminé.'
            ], 'Patron en cours de génération');

        } catch (\Exception $e) {
            error_log('[PatternController] Erreur génération : '.$e->getMessage());
            Response::serverError('Erreur lors de la création de la génération');
        }
    }

    /**
     * [AI:Claude] Vérifier le statut de génération d'un patron
     * GET /api/patterns/{id}/status
     */
    public function checkStatus(int $id): void
    {
        $userData = $this->authMiddleware->authenticate();
        if ($userData === null) return;

        $pattern = $this->patternModel->findById($id);

        if ($pattern === null)
            Response::notFound('Patron introuvable');

        if (!$this->patternModel->belongsToUser($id, $userData['user_id']))
            Response::forbidden('Vous n\'avez pas accès à ce patron');

        // [AI:Claude] Récupérer le job associé pour plus de détails
        $job = $this->jobModel->getJobByPattern($id);

        Response::success([
            'pattern_id' => $id,
            'status' => $pattern['status'],
            'job' => $job ? [
                'id' => $job['id'],
                'status' => $job['status'],
                'attempts' => $job['attempts'],
                'error_message' => $job['error_message']
            ] : null
        ]);
    }

    /**
     * [AI:Claude] Lister les patrons de l'utilisateur
     * GET /api/patterns
     */
    public function index(): void
    {
        $userData = $this->authMiddleware->authenticate();
        if ($userData === null) return;

        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 20);
        $offset = ($page - 1) * $limit;

        $patterns = $this->patternModel->findByUserId($userData['user_id'], $limit, $offset);
        $total = $this->patternModel->count(['user_id' => $userData['user_id']]);

        Response::success([
            'patterns' => $patterns,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * [AI:Claude] Obtenir un patron spécifique
     * GET /api/patterns/{id}
     */
    public function show(int $id): void
    {
        $userData = $this->authMiddleware->authenticate();
        if ($userData === null) return;

        $pattern = $this->patternModel->findById($id);

        if ($pattern === null)
            Response::notFound('Patron introuvable');

        if (!$this->patternModel->belongsToUser($id, $userData['user_id']))
            Response::forbidden('Vous n\'avez pas accès à ce patron');

        if ($pattern['materials'])
            $pattern['materials'] = json_decode($pattern['materials'], true);

        Response::success(['pattern' => $pattern]);
    }

    /**
     * [AI:Claude] Télécharger un patron en PDF
     * GET /api/patterns/{id}/pdf
     */
    public function downloadPDF(int $id): void
    {
        $userData = $this->authMiddleware->authenticate();
        if ($userData === null) return;

        $pattern = $this->patternModel->findById($id);

        if ($pattern === null)
            Response::notFound('Patron introuvable');

        if (!$this->patternModel->belongsToUser($id, $userData['user_id']))
            Response::forbidden('Vous n\'avez pas accès à ce patron');

        if ($pattern['status'] !== PATTERN_COMPLETED)
            Response::error('Le patron n\'est pas encore terminé', HTTP_BAD_REQUEST);

        try {
            $user = $this->userModel->findById($userData['user_id']);
            $result = $this->pdfService->generatePDF($id, $user['email']);

            $filepath = $result['filepath'];

            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="'.$result['filename'].'"');
            header('Content-Length: '.$result['size']);

            readfile($filepath);

            $this->pdfService->deletePDF($result['filename']);
            exit;

        } catch (\Exception $e) {
            error_log('[PatternController] Erreur PDF : '.$e->getMessage());
            Response::serverError('Erreur lors de la génération du PDF');
        }
    }

    /**
     * [AI:Claude] Supprimer un patron
     * DELETE /api/patterns/{id}
     */
    public function delete(int $id): void
    {
        $userData = $this->authMiddleware->authenticate();
        if ($userData === null) return;

        if (!$this->patternModel->belongsToUser($id, $userData['user_id']))
            Response::forbidden('Vous n\'avez pas accès à ce patron');

        $deleted = $this->patternModel->delete($id);

        if ($deleted)
            Response::success(null, HTTP_OK, 'Patron supprimé avec succès');
        else
            Response::serverError('Erreur lors de la suppression');
    }
}
