<?php
/**
 * @file EmailService.php
 * @brief Service d'envoi d'emails via SMTP (PHPMailer)
 * @author YarnFlow Team + AI Assistants
 * @created 2025-11-25
 */

declare(strict_types=1);

namespace App\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

/**
 * Service d'envoi d'emails avec PHPMailer
 */
class EmailService
{
    private PHPMailer $mailer;

    /**
     * Constructeur - Configure PHPMailer avec les paramètres SMTP
     */
    public function __construct()
    {
        $this->mailer = new PHPMailer(true);

        try {
            // Configuration SMTP
            $this->mailer->isSMTP();
            $this->mailer->Host = $_ENV['SMTP_HOST'] ?? 'localhost';
            $this->mailer->SMTPAuth = true;
            $this->mailer->Username = $_ENV['SMTP_USER'] ?? '';
            $this->mailer->Password = $_ENV['SMTP_PASSWORD'] ?? '';
            $this->mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $this->mailer->Port = (int)($_ENV['SMTP_PORT'] ?? 587);
            $this->mailer->CharSet = 'UTF-8';

            // Debug en mode développement
            if (($_ENV['APP_DEBUG'] ?? 'false') === 'true') {
                $this->mailer->SMTPDebug = SMTP::DEBUG_SERVER;
            }

            // Expéditeur par défaut
            $this->mailer->setFrom(
                $_ENV['SMTP_FROM_EMAIL'] ?? 'noreply@yarnflow.fr',
                $_ENV['SMTP_FROM_NAME'] ?? 'YarnFlow'
            );

        } catch (Exception $e) {
            error_log("[EmailService] Erreur configuration SMTP: {$e->getMessage()}");
            throw new \Exception("Impossible de configurer le service email");
        }
    }

    /**
     * Envoyer un email simple
     *
     * @param string $to Email du destinataire
     * @param string $subject Sujet de l'email
     * @param string $body Contenu HTML de l'email
     * @param string|null $toName Nom du destinataire (optionnel)
     * @return bool True si envoyé avec succès
     */
    public function sendEmail(
        string $to,
        string $subject,
        string $body,
        ?string $toName = null
    ): bool {
        try {
            // Réinitialiser pour chaque email
            $this->mailer->clearAddresses();
            $this->mailer->clearAttachments();

            // Destinataire
            $this->mailer->addAddress($to, $toName ?? '');

            // Contenu
            $this->mailer->isHTML(true);
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $body;
            $this->mailer->AltBody = strip_tags($body);

            // Envoi
            $result = $this->mailer->send();

            if ($result) {
                error_log("[EmailService] Email envoyé avec succès à {$to}");
            }

            return $result;

        } catch (Exception $e) {
            error_log("[EmailService] Erreur envoi email: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Envoyer un email de bienvenue (waitlist)
     *
     * @param string $to Email du destinataire
     * @param string|null $name Prénom du destinataire
     * @return bool
     */
    public function sendWelcomeEmail(string $to, ?string $name = null): bool
    {
        $firstName = $name ?? 'Tricoteur/Crocheteur';

        $subject = "🧶 Bienvenue sur la waitlist YarnFlow !";

        $body = $this->getWelcomeEmailTemplate($firstName);

        return $this->sendEmail($to, $subject, $body, $name);
    }

    /**
     * Template HTML pour l'email de bienvenue
     */
    private function getWelcomeEmailTemplate(string $name): string
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #8b5cf6; }
        .content { padding: 30px 0; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .cta-button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .emoji { font-size: 48px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">🧶</div>
            <h1 style="color: #8b5cf6; margin: 0;">YarnFlow</h1>
        </div>

        <div class="content">
            <h2>Bienvenue dans l'aventure, {$name} ! 🎉</h2>

            <p>Vous êtes maintenant inscrit·e à la <strong>waitlist YarnFlow</strong>.</p>

            <p>On prépare quelque chose de spécial pour vous :</p>

            <ul>
                <li>🧶 <strong>Compteur de rangs intelligent</strong> avec timer automatique</li>
                <li>📊 <strong>Stats avancées</strong> en temps réel</li>
                <li>📸 <strong>AI Photo Studio</strong> pour sublimer vos créations</li>
                <li>📚 <strong>Bibliothèque de patrons</strong> centralisée</li>
            </ul>

            <p><strong>🔥 Offre Early Bird réservée aux inscrits waitlist :</strong></p>
            <ul>
                <li>Places 1-100 : <strong>2,99€/mois pendant 12 mois</strong> (au lieu de 4,99€)</li>
                <li>Places 101-200 : <strong>10 crédits IA offerts</strong> + Badge Membre Fondateur</li>
            </ul>

            <p>On vous tient au courant très bientôt pour le lancement de la beta privée ! 💌</p>

            <p style="margin-top: 30px;">À très vite,<br><strong>L'équipe YarnFlow</strong></p>
        </div>

        <div class="footer">
            <p>&copy; 2025 YarnFlow. Tous droits réservés.</p>
            <p><a href="https://yarnflow.fr" style="color: #8b5cf6;">yarnflow.fr</a></p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Tester la connexion SMTP
     *
     * @return array{success: bool, message: string}
     */
    public function testConnection(): array
    {
        try {
            $this->mailer->smtpConnect();
            $this->mailer->smtpClose();

            return [
                'success' => true,
                'message' => 'Connexion SMTP réussie'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => "Erreur SMTP: {$e->getMessage()}"
            ];
        }
    }
}
