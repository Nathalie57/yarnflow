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
use PDO;

/**
 * Service d'envoi d'emails avec PHPMailer
 */
class EmailService
{
    private PHPMailer $mailer;
    private ?PDO $db = null;

    /**
     * Constructeur - Configure PHPMailer avec les paramètres SMTP
     */
    public function __construct(?PDO $db = null)
    {
        $this->db = $db;
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

            // Désactiver debug SMTP (les erreurs vont dans error_log)
            $this->mailer->SMTPDebug = 0;

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
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #fef8f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .header {
            text-align: center;
            padding: 40px 20px;
            background: linear-gradient(135deg, #dd7a4a 0%, #c86438 100%);
        }
        .header h1 {
            color: white;
            margin: 10px 0 0 0;
            font-size: 32px;
            font-weight: 700;
        }
        .emoji {
            font-size: 56px;
            margin: 0;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #884024;
            font-size: 24px;
            margin-top: 0;
        }
        .content p {
            color: #4b5563;
            margin: 16px 0;
            font-size: 16px;
        }
        .footer {
            text-align: center;
            padding: 30px 20px;
            background: #fef8f4;
            color: #6b7280;
            font-size: 14px;
        }
        .footer a {
            color: #dd7a4a;
            text-decoration: none;
        }
        .signature {
            margin-top: 30px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div style="background-color: #fef8f4; padding: 20px 0;">
        <div class="container">
            <div class="header">
                <div class="emoji">🧶</div>
                <h1>YarnFlow</h1>
            </div>

            <div class="content">
                <h2>Bienvenue sur YarnFlow !</h2>

                <p>Merci de rejoindre la waitlist. Tu fais maintenant partie des early birds !</p>

                <p>On te contacte très bientôt avec tous les détails de l'offre exclusive et ton accès en avant-première.</p>

                <p>D'ici là, garde tes aiguilles et tes crochets à portée de main 😊</p>

                <div class="signature">
                    <p style="margin: 0;">À très vite,</p>
                    <p style="margin: 8px 0 0 0;"><strong>Nathalie</strong></p>
                </div>
            </div>

            <div class="footer">
                <p style="margin: 0 0 8px 0;">&copy; 2025 YarnFlow</p>
                <p style="margin: 0;"><a href="https://yarnflow.fr">yarnflow.fr</a></p>
            </div>
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

    /**
     * [AI:Claude] Ajouter les headers anti-spam recommandés
     *
     * @param PHPMailer $mail Instance de PHPMailer
     * @param string $emailType Type d'email (transactional, marketing, etc.)
     * @return void
     */
    private function addAntiSpamHeaders(PHPMailer $mail, string $emailType = 'transactional'): void
    {
        // Headers anti-spam recommandés
        $mail->addCustomHeader('X-Mailer', 'YarnFlow v1.0');
        $mail->addCustomHeader('X-Priority', '3'); // Normal priority
        $mail->addCustomHeader('X-MSMail-Priority', 'Normal');
        $mail->addCustomHeader('Importance', 'Normal');

        // Type de message
        if ($emailType === 'transactional') {
            $mail->addCustomHeader('X-Auto-Response-Suppress', 'OOF, DR, RN, NRN, AutoReply');
            $mail->addCustomHeader('Precedence', 'bulk');
        }

        // Lien de désinscription (List-Unsubscribe)
        $unsubscribeUrl = 'https://yarnflow.fr/profile'; // Page où l'utilisateur peut gérer ses préférences
        $mail->addCustomHeader('List-Unsubscribe', "<{$unsubscribeUrl}>");
        $mail->addCustomHeader('List-Unsubscribe-Post', 'List-Unsubscribe=One-Click');
    }

    /**
     * [AI:Claude] Logger l'envoi d'un email dans la base de données
     *
     * @param string $recipientEmail Email du destinataire
     * @param string $recipientName Nom du destinataire
     * @param string $emailType Type d'email
     * @param string $subject Sujet de l'email
     * @param bool $success Statut d'envoi
     * @param string|null $errorMessage Message d'erreur si échec
     * @param int|null $userId ID utilisateur (si applicable)
     * @return void
     */
    private function logEmail(
        string $recipientEmail,
        string $recipientName,
        string $emailType,
        string $subject,
        bool $success,
        ?string $errorMessage = null,
        ?int $userId = null
    ): void {
        // Si pas de connexion DB, ne pas logger (mode dégradé)
        if ($this->db === null) {
            return;
        }

        try {
            $sql = "
                INSERT INTO emails_sent_log
                (user_id, recipient_email, recipient_name, email_type, subject, status, error_message, sent_at)
                VALUES (:user_id, :recipient_email, :recipient_name, :email_type, :subject, :status, :error_message, NOW())
            ";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'user_id' => $userId,
                'recipient_email' => $recipientEmail,
                'recipient_name' => $recipientName,
                'email_type' => $emailType,
                'subject' => $subject,
                'status' => $success ? 'sent' : 'failed',
                'error_message' => $errorMessage
            ]);

        } catch (\Exception $e) {
            // Logger l'erreur mais ne pas bloquer l'envoi d'email
            error_log("[EmailService] Erreur logging email: " . $e->getMessage());
        }
    }

    /**
     * [AI:Claude] Envoyer un email de bienvenue après inscription
     *
     * @param string $email Email du destinataire
     * @param string $name Prénom de l'utilisateur
     * @return bool True si envoi réussi
     */
    public function sendRegistrationWelcomeEmail(string $email, string $name, ?int $userId = null): bool
    {
        $subject = 'Votre compte YarnFlow est prêt';
        $success = false;
        $errorMessage = null;

        try {
            $mail = clone $this->mailer;
            $mail->addAddress($email, $name);
            $mail->Subject = $subject;

            // Headers anti-spam
            $this->addAntiSpamHeaders($mail, 'transactional');

            // Corps HTML
            $mail->isHTML(true);
            $mail->Body = $this->getRegistrationWelcomeEmailTemplate($name);

            // Version texte
            $mail->AltBody = "Bonjour $name,\n\nVotre compte est actif.\n\nUne seule chose à faire maintenant : ajouter votre projet en cours.\n\nNotez votre rang actuel. La prochaine fois que vous reprenez votre tricot, vous saurez exactement où vous en êtes — même si vous avez été interrompue trois fois entre-temps.\n\nAjouter mon projet : https://yarnflow.fr/my-projects\n\nBonne création,\nNathalie\nYarnFlow";

            $mail->send();
            $success = true;
            error_log("[EMAIL] Email de bienvenue envoyé à: $email");

        } catch (Exception $e) {
            $errorMessage = $mail->ErrorInfo;
            error_log("[EMAIL ERROR] Erreur envoi email de bienvenue: {$errorMessage}");
        }

        // Logger dans la BDD
        $this->logEmail($email, $name, 'registration_welcome', $subject, $success, $errorMessage, $userId);

        return $success;
    }

    /**
     * [AI:Claude] Template HTML pour email de bienvenue inscription
     *
     * @param string $name Prénom utilisateur
     * @return string HTML de l'email
     */
    private function getEmailHeader(string $subtitle = ''): string
    {
        $sub = $subtitle ? "<p style=\"color:#fde8d8;font-size:14px;margin:8px 0 0;\">{$subtitle}</p>" : '';
        return <<<HTML
<tr>
    <td style="background:#c86438;padding:32px 40px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.5px;">YarnFlow</h1>
        {$sub}
    </td>
</tr>
HTML;
    }

    private function getEmailFooter(): string
    {
        return <<<HTML
<tr>
    <td style="background-color:#fef8f4;padding:24px 40px;border-radius:0 0 12px 12px;border-top:1px solid #f3e8dd;text-align:center;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">
            <a href="https://yarnflow.fr" style="color:#c86438;text-decoration:none;">yarnflow.fr</a> &nbsp;·&nbsp;
            <a href="https://yarnflow.fr/contact" style="color:#c86438;text-decoration:none;">Contact</a> &nbsp;·&nbsp;
            <a href="https://yarnflow.fr/cgu" style="color:#c86438;text-decoration:none;">CGU</a>
        </p>
    </td>
</tr>
HTML;
    }

    private function getRegistrationWelcomeEmailTemplate(string $name): string
    {
        $header = $this->getEmailHeader('YarnFlow');
        $footer = $this->getEmailFooter();
        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#fef8f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef8f4;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
{$header}
<tr><td style="padding:40px 40px 32px;">
    <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 8px;">Bonjour <strong>{$name}</strong>,</p>
    <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Votre compte est actif.</p>

    <h2 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 12px;">Vous avez un projet en cours ?</h2>
    <p style="color:#4b5563;font-size:16px;line-height:1.7;margin:0 0 32px;">
        Notez votre rang maintenant. La prochaine fois que vous reprenez votre tricot, vous saurez exactement où vous en êtes — même si vous avez été interrompue trois fois entre-temps.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
        <tr><td align="center">
            <a href="https://yarnflow.fr/my-projects" style="display:inline-block;background:#c86438;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600;">
                Ajouter mon projet en cours
            </a>
        </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3e8dd;border-radius:8px;margin:0 0 32px;">
        <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #f3e8dd;">
                <p style="margin:0;font-size:15px;color:#374151;"><strong style="color:#111827;">Interrompue à mi-rang</strong> — Un clic pour sauvegarder. Vous retrouvez exactement là où vous étiez.</p>
            </td>
        </tr>
        <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #f3e8dd;">
                <p style="margin:0;font-size:15px;color:#374151;"><strong style="color:#111827;">Plusieurs projets en parallèle</strong> — Chacun a son compteur, ses notes, son patron.</p>
            </td>
        </tr>
        <tr>
            <td style="padding:16px 20px;">
                <p style="margin:0;font-size:15px;color:#374151;"><strong style="color:#111827;">Votre patron toujours avec vous</strong> — PDF ou lien, attaché directement au projet.</p>
            </td>
        </tr>
    </table>

    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 4px;">Bonne création,</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;"><strong style="color:#374151;">Nathalie</strong> — YarnFlow</p>
</td></tr>
{$footer}
</table>
</td></tr>
</table>
</body>
</html>
HTML;
    }

    /**
     * [AI:Claude] Envoyer un email de réinitialisation de mot de passe
     *
     * @param string $email Email du destinataire
     * @param string $name Prénom de l'utilisateur
     * @param string $resetLink Lien de réinitialisation
     * @return bool True si envoi réussi
     */
    public function sendPasswordResetEmail(string $email, string $name, string $resetLink): bool
    {
        try {
            $mail = clone $this->mailer;
            $mail->addAddress($email, $name);
            $mail->Subject = '🔑 Réinitialisation de votre mot de passe YarnFlow';

            // Headers anti-spam
            $this->addAntiSpamHeaders($mail, 'transactional');

            // Corps HTML
            $mail->isHTML(true);
            $mail->Body = $this->getPasswordResetEmailTemplate($name, $resetLink);

            // Version texte
            $mail->AltBody = "Bonjour $name,\n\nVous avez demandé à réinitialiser votre mot de passe YarnFlow.\n\nCliquez sur ce lien pour créer un nouveau mot de passe :\n$resetLink\n\nCe lien est valide pendant 1 heure.\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\nL'équipe YarnFlow 🧶";

            $mail->send();
            error_log("[EMAIL] Email de reset password envoyé à: $email");
            return true;

        } catch (Exception $e) {
            error_log("[EMAIL ERROR] Erreur envoi reset password: {$mail->ErrorInfo}");
            return false;
        }
    }

    /**
     * [AI:Claude] Template HTML pour email de réinitialisation
     *
     * @param string $name Prénom utilisateur
     * @param string $resetLink Lien de réinitialisation
     * @return string HTML de l'email
     */
    private function getPasswordResetEmailTemplate(string $name, string $resetLink): string
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                                🧶 YarnFlow
                            </h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 40px 20px;">
                            <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">
                                Réinitialisation de mot de passe
                            </h2>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Bonjour <strong>{$name}</strong>,
                            </p>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Vous avez demandé à réinitialiser votre mot de passe YarnFlow.
                            </p>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <a href="{$resetLink}" style="display: inline-block; background-color: #667eea; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                                            🔑 Réinitialiser mon mot de passe
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Info Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 0 0 30px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
                                            ⏱️ <strong>Ce lien est valide pendant 1 heure.</strong><br>
                                            Après ce délai, vous devrez demander un nouveau lien.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Security Warning -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fee2e2; border-left: 4px solid #ef4444; border-radius: 4px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="color: #991b1b; font-size: 14px; line-height: 1.6; margin: 0;">
                                            🔒 <strong>Vous n'avez pas demandé cette réinitialisation ?</strong><br>
                                            Ignorez cet email. Votre mot de passe actuel reste inchangé.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px; text-align: center;">
                                L'équipe YarnFlow 🧶
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                                © 2025 YarnFlow - Votre tracker tricot/crochet préféré
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }

    /**
     * [AI:Claude] Envoyer un email d'onboarding J+3 (aucun projet créé)
     *
     * @param string $email Email du destinataire
     * @param string $name Prénom de l'utilisateur
     * @return bool True si envoi réussi
     */
    public function sendOnboardingDay3Email(string $email, string $name, ?int $userId = null, bool $hasProjects = false): bool
    {
        $subject = 'Vous avez eu le temps de tricoter ?';
        $success = false;
        $errorMessage = null;

        try {
            $mail = clone $this->mailer;
            $mail->addAddress($email, $name);
            $mail->Subject = $subject;

            // Headers anti-spam
            $this->addAntiSpamHeaders($mail, 'transactional');

            $mail->isHTML(true);
            $mail->Body = $this->getOnboardingDay3EmailTemplate($name);
            $mail->AltBody = "Bonjour $name,\n\nDepuis votre inscription il y a 3 jours, avez-vous eu l'occasion de tricoter ?\n\nSi oui — c'est le bon moment pour ouvrir YarnFlow et noter votre rang actuel. Deux secondes, et vous ne perdrez plus jamais votre place.\n\nSi pas encore — c'est normal. Gardez juste YarnFlow en tête pour la prochaine session.\n\nAjouter mon projet : https://yarnflow.fr/my-projects\n\nNathalie — YarnFlow";

            $mail->send();
            $success = true;
            error_log("[EMAIL] Email onboarding J+3 envoyé à: $email");

        } catch (Exception $e) {
            $errorMessage = $mail->ErrorInfo;
            error_log("[EMAIL ERROR] Erreur envoi onboarding J+3: {$errorMessage}");
        }

        // Logger dans la BDD
        $this->logEmail($email, $name, 'onboarding_day3', $subject, $success, $errorMessage, $userId);

        return $success;
    }

    /**
     * Template HTML pour email onboarding J+3
     */
    private function getOnboardingDay3EmailTemplate(string $name): string
    {
        $header = $this->getEmailHeader();
        $footer = $this->getEmailFooter();
        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#fef8f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef8f4;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
{$header}
<tr><td style="padding:40px 40px 32px;">
    <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Bonjour <strong>{$name}</strong>,</p>

    <p style="color:#4b5563;font-size:16px;line-height:1.7;margin:0 0 16px;">
        Depuis votre inscription il y a 3 jours, avez-vous eu l'occasion de tricoter ?
    </p>
    <p style="color:#4b5563;font-size:16px;line-height:1.7;margin:0 0 24px;">
        Si oui — c'est le bon moment pour ouvrir YarnFlow et noter votre rang actuel.<br>
        Deux secondes, et vous ne perdrez plus jamais votre place.
    </p>
    <p style="color:#4b5563;font-size:16px;line-height:1.7;margin:0 0 32px;">
        Si pas encore — gardez juste YarnFlow en tête pour la prochaine session. La prochaine fois que vous serez interrompue en plein milieu d'un rang, vous saurez où aller.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
        <tr><td align="center">
            <a href="https://yarnflow.fr/my-projects" style="display:inline-block;background:#c86438;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600;">
                Ajouter mon projet en cours
            </a>
        </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3e8dd;border-radius:8px;margin:0 0 32px;">
        <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #f3e8dd;">
                <p style="margin:0;font-size:15px;color:#374151;"><strong style="color:#111827;">Vous notez votre rang</strong> — YarnFlow retient votre place. Même si vous êtes interrompue.</p>
            </td>
        </tr>
        <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #f3e8dd;">
                <p style="margin:0;font-size:15px;color:#374151;"><strong style="color:#111827;">Vous avez plusieurs projets</strong> — Chacun a son compteur, ses notes, son patron.</p>
            </td>
        </tr>
        <tr>
            <td style="padding:16px 20px;">
                <p style="margin:0;font-size:15px;color:#374151;"><strong style="color:#111827;">Votre patron avec vous</strong> — PDF ou lien, attaché directement au projet.</p>
            </td>
        </tr>
    </table>

    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 4px;">Bonne création,</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;"><strong style="color:#374151;">Nathalie</strong> — YarnFlow</p>
</td></tr>
{$footer}
</table>
</td></tr>
</table>
</body>
</html>
HTML;
</body>
</html>
HTML;
    }

    /**
     * [AI:Claude] Envoyer un email de réengagement J+7 (inactif)
     *
     * @param string $email Email du destinataire
     * @param string $name Prénom de l'utilisateur
     * @param array $projectData Données du projet en cours (nom, rangs restants, etc.)
     * @return bool True si envoi réussi
     */
    public function sendReengagementDay7Email(string $email, string $name, array $projectData = [], ?int $userId = null): bool
    {
        $subject = 'Votre projet vous attend';
        $success = false;
        $errorMessage = null;

        try {
            $mail = clone $this->mailer;
            $mail->addAddress($email, $name);
            $mail->Subject = $subject;

            // Headers anti-spam
            $this->addAntiSpamHeaders($mail, 'transactional');

            $mail->isHTML(true);
            $mail->Body = $this->getReengagementDay7EmailTemplate($name, $projectData);
            $mail->AltBody = "Bonjour $name,\n\nCela fait une semaine. Votre projet est toujours là, au rang où vous l'avez laissé.\n\nReprendre : https://yarnflow.fr/my-projects\n\nNathalie — YarnFlow";

            $mail->send();
            $success = true;
            error_log("[EMAIL] Email réengagement J+7 envoyé à: $email");

        } catch (Exception $e) {
            $errorMessage = $mail->ErrorInfo;
            error_log("[EMAIL ERROR] Erreur envoi réengagement J+7: {$errorMessage}");
        }

        // Logger dans la BDD
        $this->logEmail($email, $name, 'reengagement_day7', $subject, $success, $errorMessage, $userId);

        return $success;
    }

    /**
     * Template HTML pour email réengagement J+7
     */
    private function getReengagementDay7EmailTemplate(string $name, array $projectData): string
    {
        $header = $this->getEmailHeader();
        $footer = $this->getEmailFooter();

        $projectBlock = '';
        if (!empty($projectData['name'])) {
            $projectName = htmlspecialchars($projectData['name']);
            $progress = (int)($projectData['progress'] ?? 0);
            $projectBlock = <<<HTML
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3e8dd;border-radius:8px;margin:0 0 32px;">
        <tr>
            <td style="padding:20px 24px;">
                <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Votre projet en cours</p>
                <p style="margin:0 0 12px;font-size:17px;font-weight:600;color:#111827;">{$projectName}</p>
                <div style="background-color:#f3e8dd;border-radius:999px;height:6px;overflow:hidden;">
                    <div style="background:#c86438;height:100%;width:{$progress}%;"></div>
                </div>
                <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;">{$progress}% complété</p>
            </td>
        </tr>
    </table>
HTML;
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#fef8f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef8f4;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
{$header}
<tr><td style="padding:40px 40px 32px;">
    <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Bonjour <strong>{$name}</strong>,</p>

    <p style="color:#4b5563;font-size:16px;line-height:1.7;margin:0 0 16px;">
        Cela fait une semaine. Votre projet est toujours là, au rang où vous l'avez laissé.
    </p>
    <p style="color:#4b5563;font-size:16px;line-height:1.7;margin:0 0 32px;">
        La prochaine fois que vous tricotez et que vous êtes interrompue, YarnFlow est là pour retenir votre place.
    </p>

    {$projectBlock}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
        <tr><td align="center">
            <a href="https://yarnflow.fr/my-projects" style="display:inline-block;background:#c86438;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600;">
                Reprendre mon projet
            </a>
        </td></tr>
    </table>

    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 4px;">Bonne création,</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;"><strong style="color:#374151;">Nathalie</strong> — YarnFlow</p>
</td></tr>
{$footer}
</table>
</td></tr>
</table>
</body>
</html>
HTML;
    }

    /**
     * [AI:Claude] Envoyer un email "Besoin d'aide ?" J+21 (très inactif)
     *
     * @param string $email Email du destinataire
     * @param string $name Prénom de l'utilisateur
     * @return bool True si envoi réussi
     */
    public function sendNeedHelpDay21Email(string $email, string $name, ?int $userId = null): bool
    {
        $subject = 'Toujours là si vous revenez';
        $success = false;
        $errorMessage = null;

        try {
            $mail = clone $this->mailer;
            $mail->addAddress($email, $name);
            $mail->Subject = $subject;

            // Headers anti-spam
            $this->addAntiSpamHeaders($mail, 'transactional');

            $mail->isHTML(true);
            $mail->Body = $this->getNeedHelpDay21EmailTemplate($name);
            $mail->AltBody = "Bonjour $name,\n\nCela fait trois semaines. Vos projets sont toujours là, au rang où vous les avez laissés.\n\nSi vous avez un projet en cours — c'est le bon moment pour ouvrir YarnFlow avant votre prochaine session de tricot. Vous saurez exactement où vous en êtes, même si vous avez été interrompue.\n\nReprendre mes projets : https://yarnflow.fr/my-projects\n\nNathalie — YarnFlow";

            $mail->send();
            $success = true;
            error_log("[EMAIL] Email 'besoin d'aide' J+21 envoyé à: $email");

        } catch (Exception $e) {
            $errorMessage = $mail->ErrorInfo;
            error_log("[EMAIL ERROR] Erreur envoi 'besoin d'aide' J+21: {$errorMessage}");
        }

        // Logger dans la BDD
        $this->logEmail($email, $name, 'need_help_day21', $subject, $success, $errorMessage, $userId);

        return $success;
    }

    /**
     * [AI:Claude] Envoyer un email de rappel pour utiliser le compteur (projet créé mais jamais utilisé)
     *
     * @param string $email Email du destinataire
     * @param string $name Prénom de l'utilisateur
     * @param string $projectName Nom du projet créé
     * @param int|null $userId ID utilisateur
     * @return bool True si envoi réussi
     */
    public function sendProjectStartReminderEmail(string $email, string $name, string $projectName, ?int $userId = null): bool
    {
        $subject = 'Votre projet "' . mb_substr($projectName, 0, 30) . '" attend son premier rang';
        $success = false;
        $errorMessage = null;

        try {
            $mail = clone $this->mailer;
            $mail->addAddress($email, $name);
            $mail->Subject = $subject;

            // Headers anti-spam
            $this->addAntiSpamHeaders($mail, 'transactional');

            $mail->isHTML(true);
            $mail->Body = $this->getProjectStartReminderEmailTemplate($name, $projectName);
            $mail->AltBody = "Bonjour $name,\n\nVous avez créé le projet \"$projectName\" — il attend son premier rang.\n\nLa prochaine fois que vous tricotez, ouvrez YarnFlow avant de commencer. Quand vous serez interrompue, votre rang sera déjà noté.\n\nOuvrir mon projet : https://yarnflow.fr/my-projects\n\nNathalie — YarnFlow";

            $mail->send();
            $success = true;
            error_log("[EMAIL] Email project_start_reminder envoyé à: $email (projet: $projectName)");

        } catch (Exception $e) {
            $errorMessage = $mail->ErrorInfo;
            error_log("[EMAIL ERROR] Erreur envoi project_start_reminder: {$errorMessage}");
        }

        // Logger dans la BDD
        $this->logEmail($email, $name, 'project_start_reminder', $subject, $success, $errorMessage, $userId);

        return $success;
    }

    /**
     * Template HTML pour email rappel projet (projet créé mais jamais utilisé)
     */
    private function getProjectStartReminderEmailTemplate(string $name, string $projectName): string
    {
        $header = $this->getEmailHeader();
        $footer = $this->getEmailFooter();
        $projectNameEscaped = htmlspecialchars($projectName);
        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#fef8f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef8f4;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
{$header}
<tr><td style="padding:40px 40px 32px;">
    <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Bonjour <strong>{$name}</strong>,</p>

    <p style="color:#4b5563;font-size:16px;line-height:1.7;margin:0 0 16px;">
        Vous avez créé le projet <strong style="color:#111827;">"{$projectNameEscaped}"</strong> — il attend son premier rang.
    </p>
    <p style="color:#4b5563;font-size:16px;line-height:1.7;margin:0 0 32px;">
        La prochaine fois que vous tricotez, ouvrez YarnFlow avant de commencer. Quand vous serez interrompue, votre rang sera déjà noté. Vous reprenez exactement là où vous étiez.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3e8dd;border-radius:8px;margin:0 0 32px;">
        <tr>
            <td style="padding:20px 24px;">
                <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Projet créé</p>
                <p style="margin:0;font-size:17px;font-weight:600;color:#111827;">{$projectNameEscaped}</p>
            </td>
        </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
        <tr><td align="center">
            <a href="https://yarnflow.fr/my-projects" style="display:inline-block;background:#c86438;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600;">
                Ouvrir mon projet
            </a>
        </td></tr>
    </table>

    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 4px;">Bonne création,</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;"><strong style="color:#374151;">Nathalie</strong> — YarnFlow</p>
</td></tr>
{$footer}
</table>
</td></tr>
</table>
</body>
</html>
HTML;
    }

    /**
     * Template HTML pour email J+21 (toujours là)
     */
    private function getNeedHelpDay21EmailTemplate(string $name): string
    {
        $header = $this->getEmailHeader();
        $footer = $this->getEmailFooter();
        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#fef8f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef8f4;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
{$header}
<tr><td style="padding:40px 40px 32px;">
    <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Bonjour <strong>{$name}</strong>,</p>

    <p style="color:#4b5563;font-size:16px;line-height:1.7;margin:0 0 16px;">
        Cela fait trois semaines. Vos projets sont toujours là, au rang où vous les avez laissés.
    </p>
    <p style="color:#4b5563;font-size:16px;line-height:1.7;margin:0 0 32px;">
        Aucune pression. Juste un rappel : la prochaine fois que vous reprenez votre tricot et qu'on vous interrompt, YarnFlow est là pour que vous ne perdiez plus votre place.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
        <tr><td align="center">
            <a href="https://yarnflow.fr/my-projects" style="display:inline-block;background:#c86438;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600;">
                Voir mes projets
            </a>
        </td></tr>
    </table>

    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 4px;">Bonne création,</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;"><strong style="color:#374151;">Nathalie</strong> — YarnFlow</p>

    <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;">
        <a href="https://yarnflow.fr/profile" style="color:#9ca3af;text-decoration:underline;">Se désinscrire de ces emails</a>
    </p>
</td></tr>
{$footer}
</table>
</td></tr>
</table>
</body>
</html>
HTML;
    }
}
