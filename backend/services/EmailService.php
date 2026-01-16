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
        $subject = '🧶 Bienvenue sur YarnFlow !';
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
            $mail->AltBody = "Bienvenue sur YarnFlow !\n\nBonjour $name,\n\nBienvenue ! Ton compte YarnFlow est prêt ✨\nSi tu perds parfois tes rangs, tes notes ou tes patrons… tu es exactement au bon endroit 😉\n\n👉 Par quoi commencer ?\n\nLe plus simple (et le plus utile) : créer ton premier projet, même vide.\nTu pourras ensuite ajouter tes sections, ton compteur et tes notes au fur et à mesure.\n\n🚀 Créer mon premier projet : https://yarnflow.fr/my-projects\n\nCe que YarnFlow peut déjà faire pour toi :\n- Compter tes rangs (avec timer)\n- Organiser tes projets tricot & crochet\n- Centraliser tes patrons\n- Ajouter des notes et suivre ta progression\n- Tester la génération de photos IA (5 crédits gratuits / mois)\n\n💡 Besoin d'un coup de pouce ?\nUn guide rapide est disponible directement dans l'application (bouton « ? » en haut), et tu peux bien sûr me contacter via le formulaire si besoin.\n\nBonne création 🧵\nÀ très vite sur YarnFlow,\n\nNathalie\nFondatrice de YarnFlow 🧶";

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
    private function getRegistrationWelcomeEmailTemplate(string $name): string
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fef8f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef8f4; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #dd7a4a 0%, #c86438 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
                            <div style="font-size: 56px; margin: 0 0 10px 0;">🧶</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                                YarnFlow
                            </h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 40px 20px;">
                            <h2 style="color: #884024; margin: 0 0 20px; font-size: 24px;">
                                Bienvenue sur YarnFlow 🎉
                            </h2>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Bonjour <strong>{$name}</strong>,
                            </p>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">
                                Bienvenue ! Ton compte YarnFlow est prêt ✨
                            </p>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                Si tu perds parfois tes rangs, tes notes ou tes patrons… tu es exactement au bon endroit 😉
                            </p>

                            <!-- Start Section -->
                            <h3 style="color: #884024; font-size: 18px; margin: 0 0 16px;">
                                👉 Par quoi commencer ?
                            </h3>
                            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 10px;">
                                Le plus simple (et le plus utile) :<br>
                                <strong>créer ton premier projet</strong>, même vide.
                            </p>
                            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                                Tu pourras ensuite ajouter tes sections, ton compteur et tes notes au fur et à mesure.
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <a href="https://yarnflow.fr/my-projects" style="display: inline-block; background: linear-gradient(135deg, #dd7a4a 0%, #c86438 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                                            🚀 Créer mon premier projet
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Features List -->
                            <h3 style="color: #884024; font-size: 18px; margin: 0 0 16px;">
                                Ce que YarnFlow peut déjà faire pour toi :
                            </h3>
                            <ul style="color: #4b5563; font-size: 15px; line-height: 1.8; margin: 0 0 30px; padding-left: 20px;">
                                <li>Compter tes rangs (avec timer)</li>
                                <li>Organiser tes projets tricot & crochet</li>
                                <li>Centraliser tes patrons</li>
                                <li>Ajouter des notes et suivre ta progression</li>
                                <li>Tester la génération de photos IA (5 crédits gratuits / mois)</li>
                            </ul>

                            <!-- Help Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 4px; margin: 0 0 30px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="color: #075985; font-size: 14px; line-height: 1.6; margin: 0;">
                                            💡 <strong>Besoin d'un coup de pouce ?</strong><br>
                                            Un guide rapide est disponible directement dans l'application (bouton « ? » en haut),
                                            et tu peux bien sûr me contacter via le formulaire si besoin.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">
                                Bonne création 🧵
                            </p>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                À très vite sur YarnFlow,
                            </p>

                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                                <strong>Nathalie</strong><br>
                                Fondatrice de YarnFlow 🧶
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #fef8f4; padding: 30px 40px; border-radius: 0 0 12px 12px; border-top: 1px solid #f3e8dd;">
                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px; text-align: center;">
                                © 2025 YarnFlow — Votre tracker tricot & crochet
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                                <a href="https://yarnflow.fr" style="color: #dd7a4a; text-decoration: none;">yarnflow.fr</a> •
                                <a href="https://yarnflow.fr/contact" style="color: #dd7a4a; text-decoration: none;">Contact</a> •
                                <a href="https://yarnflow.fr/cgu" style="color: #dd7a4a; text-decoration: none;">CGU</a>
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
        $subject = '🎓 Besoin d\'aide pour démarrer avec YarnFlow ?';
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
            $mail->AltBody = "Coucou $name,\n\nPetit message rapide, 3 jours après ton inscription 😊\nJe voulais juste m'assurer que tout se passait bien pour toi sur YarnFlow.\n\nSi tu n'as pas encore eu le temps de t'y mettre, c'est totalement normal.\nLe plus simple pour commencer (vraiment) reste toujours le même :\n\n👉 Créer un premier projet, même si tu n'as pas encore ton ouvrage sous la main.\nTu pourras ajouter les sections, les notes et le compteur plus tard, quand tu tricoteras ou crocheteras.\n\n🚀 Créer mon premier projet : https://yarnflow.fr/my-projects\n\n💡 Astuce toute simple\nBeaucoup d'utilisatrices commencent par :\n• créer un projet\n• ajouter une seule section\n• lancer le compteur\nEt c'est tout. Pas besoin d'en faire plus au début.\n\nSi quelque chose te bloque, te semble bizarre ou pas clair, n'hésite surtout pas à me le dire.\nYarnFlow est encore jeune, et chaque retour m'aide énormément à l'améliorer 💛\n\nÀ très vite,\nBonne création 🧵\n\nNathalie\nFondatrice de YarnFlow";

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
        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fef8f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef8f4; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #dd7a4a 0%, #c86438 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
                            <div style="font-size: 56px; margin: 0 0 10px 0;">🧶</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">YarnFlow</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 40px 20px;">
                            <h2 style="color: #884024; margin: 0 0 20px; font-size: 22px;">
                                Coucou <strong>{$name}</strong>,
                            </h2>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Petit message rapide, 3 jours après ton inscription 😊<br>
                                Je voulais juste m'assurer que tout se passait bien pour toi sur YarnFlow.
                            </p>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">
                                Si tu n'as pas encore eu le temps de t'y mettre, c'est totalement normal.
                            </p>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                Le plus simple pour commencer (vraiment) reste toujours le même :
                            </p>

                            <p style="color: #884024; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">
                                <strong>👉 Créer un premier projet</strong>, même si tu n'as pas encore ton ouvrage sous la main.
                            </p>
                            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                                Tu pourras ajouter les sections, les notes et le compteur plus tard, quand tu tricoteras ou crocheteras.
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <a href="https://yarnflow.fr/my-projects" style="display: inline-block; background: linear-gradient(135deg, #dd7a4a 0%, #c86438 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                                            🚀 Créer mon premier projet
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 4px; margin: 0 0 30px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="color: #075985; font-size: 14px; line-height: 1.6; margin: 0 0 12px;">
                                            <strong>💡 Astuce toute simple</strong>
                                        </p>
                                        <p style="color: #075985; font-size: 14px; line-height: 1.6; margin: 0;">
                                            Beaucoup d'utilisatrices commencent par :<br>
                                            • créer un projet<br>
                                            • ajouter une seule section<br>
                                            • lancer le compteur<br><br>
                                            Et c'est tout. Pas besoin d'en faire plus au début.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                                Si quelque chose te bloque, te semble bizarre ou pas clair, n'hésite surtout pas à me le dire.<br>
                                YarnFlow est encore jeune, et chaque retour m'aide énormément à l'améliorer 💛
                            </p>

                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">
                                À très vite,<br>
                                Bonne création 🧵
                            </p>

                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
                                <strong>Nathalie</strong><br>
                                Fondatrice de YarnFlow
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #fef8f4; padding: 30px 40px; border-radius: 0 0 12px 12px; border-top: 1px solid #f3e8dd;">
                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px; text-align: center;">
                                © 2025 YarnFlow — Votre tracker tricot & crochet
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                                <a href="https://yarnflow.fr" style="color: #dd7a4a; text-decoration: none;">yarnflow.fr</a> •
                                <a href="https://yarnflow.fr/contact" style="color: #dd7a4a; text-decoration: none;">Contact</a> •
                                <a href="https://yarnflow.fr/cgu" style="color: #dd7a4a; text-decoration: none;">CGU</a>
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
     * [AI:Claude] Envoyer un email de réengagement J+7 (inactif)
     *
     * @param string $email Email du destinataire
     * @param string $name Prénom de l'utilisateur
     * @param array $projectData Données du projet en cours (nom, rangs restants, etc.)
     * @return bool True si envoi réussi
     */
    public function sendReengagementDay7Email(string $email, string $name, array $projectData = [], ?int $userId = null): bool
    {
        $subject = '🧵 Votre tricot vous attend !';
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
            $mail->AltBody = "Bonjour $name,\n\nCela fait une semaine qu'on ne vous a pas vu sur YarnFlow !\nVos projets vous attendent patiemment. 🧶\n\n🎯 Continuer mon projet : https://yarnflow.fr/my-projects\n\n💡 Le saviez-vous ?\nChaque mois, vous recevez 5 crédits photos gratuits pour sublimer vos créations grâce à notre IA !\n\nÀ très vite sur YarnFlow,\nNathalie";

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
        $projectInfo = '';
        if (!empty($projectData['name'])) {
            $projectName = htmlspecialchars($projectData['name']);
            $progress = $projectData['progress'] ?? 0;
            $projectInfo = <<<HTML
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef8f4; border-radius: 8px; margin: 0 0 30px; border: 2px solid #dd7a4a;">
                <tr>
                    <td style="padding: 24px;">
                        <h3 style="color: #884024; margin: 0 0 12px; font-size: 18px;">📌 Votre projet en cours</h3>
                        <p style="color: #4b5563; font-size: 16px; margin: 0 0 8px;"><strong>{$projectName}</strong></p>
                        <div style="background-color: #e5e7eb; border-radius: 999px; height: 8px; overflow: hidden;">
                            <div style="background: linear-gradient(135deg, #dd7a4a 0%, #c86438 100%); height: 100%; width: {$progress}%;"></div>
                        </div>
                        <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0;">Progression : {$progress}%</p>
                    </td>
                </tr>
            </table>
HTML;
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fef8f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef8f4; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #dd7a4a 0%, #c86438 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
                            <div style="font-size: 56px; margin: 0 0 10px 0;">🧵</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Votre tricot vous attend !</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 40px 20px;">
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Bonjour <strong>{$name}</strong>,
                            </p>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                Cela fait une semaine qu'on ne vous a pas vu sur YarnFlow ! Vos projets vous attendent patiemment. 🧶
                            </p>

                            {$projectInfo}

                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <a href="https://yarnflow.fr/my-projects" style="display: inline-block; background: linear-gradient(135deg, #dd7a4a 0%, #c86438 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                                            🎯 Continuer mon projet
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                                <strong>💡 Le saviez-vous ?</strong> Chaque mois, vous recevez 5 crédits photos gratuits pour sublimer vos créations grâce à notre IA !
                            </p>

                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
                                À très vite sur YarnFlow,<br>
                                <strong>Nathalie</strong>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #fef8f4; padding: 30px 40px; border-radius: 0 0 12px 12px; border-top: 1px solid #f3e8dd;">
                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px; text-align: center;">
                                © 2025 YarnFlow — Votre tracker tricot & crochet
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                                <a href="https://yarnflow.fr" style="color: #dd7a4a; text-decoration: none;">yarnflow.fr</a> •
                                <a href="https://yarnflow.fr/contact" style="color: #dd7a4a; text-decoration: none;">Contact</a> •
                                <a href="https://yarnflow.fr/cgu" style="color: #dd7a4a; text-decoration: none;">CGU</a>
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
     * [AI:Claude] Envoyer un email "Besoin d'aide ?" J+21 (très inactif)
     *
     * @param string $email Email du destinataire
     * @param string $name Prénom de l'utilisateur
     * @return bool True si envoi réussi
     */
    public function sendNeedHelpDay21Email(string $email, string $name, ?int $userId = null): bool
    {
        $subject = '🆘 Besoin d\'aide avec YarnFlow ?';
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
            $mail->AltBody = "Bonjour $name,\n\nCela fait maintenant trois semaines qu'on ne vous a pas vu sur YarnFlow,\net franchement, vous nous manquez ! 🥺\n\nVos projets sont toujours là, bien au chaud, qui n'attendent que vous...\n\n🎁 En votre absence, on a ajouté plein de nouveautés :\n• Un système de tags pour mieux organiser vos projets\n• Des filtres avancés pour trouver facilement ce que vous cherchez\n• Un guide de démarrage interactif pour vous accompagner pas à pas\n• Et plein d'autres améliorations basées sur vos retours !\n\n🧶 Reprendre mes projets : https://yarnflow.fr/my-projects\n\nBesoin d'un coup de main ou d'un petit conseil ? N'hésitez pas à nous contacter, on est là pour vous aider !\n\nSi vous ne souhaitez plus recevoir ces emails, vous pouvez vous désinscrire ici : https://yarnflow.fr/profile\n\nÀ très vite sur YarnFlow,\nNathalie\nL'équipe YarnFlow";

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
        $subject = '🧶 Votre projet "' . mb_substr($projectName, 0, 30) . '" vous attend !';
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
            $mail->AltBody = "Coucou $name,\n\nTu as créé le projet \"$projectName\" sur YarnFlow, mais tu n'as pas encore compté ton premier rang !\n\n🎯 Utiliser le compteur est super simple :\n1. Ouvre ton projet\n2. Clique sur le bouton ▶️ du compteur\n3. À chaque rang terminé, appuie sur + (ou tape n'importe où sur l'écran !)\n\nC'est tout ! Le compteur garde le fil à ta place 🧵\n\n👉 Compter mon premier rang : https://yarnflow.fr/my-projects\n\n💡 Astuce : Tu peux aussi lancer le timer pour chronométrer ton temps de tricot et voir ta vitesse moyenne.\n\nÀ très vite,\nNathalie\nFondatrice de YarnFlow";

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
        $projectNameEscaped = htmlspecialchars($projectName);
        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fef8f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef8f4; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #dd7a4a 0%, #c86438 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
                            <div style="font-size: 56px; margin: 0 0 10px 0;">🧶</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: bold;">Votre projet vous attend !</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 40px 20px;">
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Coucou <strong>{$name}</strong>,
                            </p>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Tu as créé le projet <strong style="color: #884024;">"{$projectNameEscaped}"</strong> sur YarnFlow, mais tu n'as pas encore compté ton premier rang !
                            </p>

                            <!-- Project Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef8f4; border-radius: 8px; margin: 0 0 30px; border: 2px dashed #dd7a4a;">
                                <tr>
                                    <td style="padding: 24px; text-align: center;">
                                        <div style="font-size: 40px; margin: 0 0 12px;">📌</div>
                                        <p style="color: #884024; font-size: 18px; font-weight: bold; margin: 0;">{$projectNameEscaped}</p>
                                        <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0;">0 rang compté</p>
                                    </td>
                                </tr>
                            </table>

                            <h3 style="color: #884024; font-size: 18px; margin: 0 0 16px;">
                                🎯 Utiliser le compteur est super simple :
                            </h3>
                            <ol style="color: #4b5563; font-size: 15px; line-height: 1.8; margin: 0 0 30px; padding-left: 20px;">
                                <li>Ouvre ton projet</li>
                                <li>Clique sur le bouton <strong>▶️</strong> du compteur</li>
                                <li>À chaque rang terminé, appuie sur <strong>+</strong> (ou tape n'importe où sur l'écran !)</li>
                            </ol>
                            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                                C'est tout ! Le compteur garde le fil à ta place 🧵
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <a href="https://yarnflow.fr/my-projects" style="display: inline-block; background: linear-gradient(135deg, #dd7a4a 0%, #c86438 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                                            ▶️ Compter mon premier rang
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 4px; margin: 0 0 30px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="color: #075985; font-size: 14px; line-height: 1.6; margin: 0;">
                                            <strong>💡 Astuce</strong><br>
                                            Tu peux aussi lancer le <strong>timer</strong> pour chronométrer ton temps de tricot et voir ta vitesse moyenne !
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">
                                À très vite,
                            </p>

                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
                                <strong>Nathalie</strong><br>
                                Fondatrice de YarnFlow
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #fef8f4; padding: 30px 40px; border-radius: 0 0 12px 12px; border-top: 1px solid #f3e8dd;">
                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px; text-align: center;">
                                © 2025 YarnFlow — Votre tracker tricot & crochet
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                                <a href="https://yarnflow.fr" style="color: #dd7a4a; text-decoration: none;">yarnflow.fr</a> •
                                <a href="https://yarnflow.fr/contact" style="color: #dd7a4a; text-decoration: none;">Contact</a> •
                                <a href="https://yarnflow.fr/cgu" style="color: #dd7a4a; text-decoration: none;">CGU</a>
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
     * Template HTML pour email "Besoin d'aide ?" J+21
     */
    private function getNeedHelpDay21EmailTemplate(string $name): string
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fef8f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef8f4; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #dd7a4a 0%, #c86438 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
                            <div style="font-size: 56px; margin: 0 0 10px 0;">💔</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Vous nous manquez sur YarnFlow !</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 40px 20px;">
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Bonjour <strong>{$name}</strong>,
                            </p>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">
                                Cela fait maintenant trois semaines qu'on ne vous a pas vu sur YarnFlow,<br>
                                et franchement, vous nous manquez ! 🥺
                            </p>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                Vos projets sont toujours là, bien au chaud, qui n'attendent que vous...
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef8f4; border-radius: 8px; margin: 0 0 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="color: #92400e; font-size: 15px; line-height: 1.6; margin: 0;">
                                            <strong>🎁 En votre absence, on a ajouté plein de nouveautés :</strong><br>
                                            • Un système de tags pour mieux organiser vos projets<br>
                                            • Des filtres avancés pour trouver facilement ce que vous cherchez<br>
                                            • Un guide de démarrage interactif pour vous accompagner pas à pas<br>
                                            • Et plein d'autres améliorations basées sur vos retours !
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e0f2fe; border-radius: 8px; margin: 0 0 30px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="color: #075985; margin: 0 0 16px; font-size: 18px;">🎯 Rappel : Ce que YarnFlow fait pour vous</h3>
                                        <ul style="color: #0c4a6e; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                            <li>Compteur de rangs intelligent avec timer</li>
                                            <li>Gestion de tous vos projets tricot/crochet</li>
                                            <li>Photos IA professionnelles (5 crédits/mois gratuits)</li>
                                            <li>Bibliothèque de patrons organisée</li>
                                            <li>Statistiques de progression détaillées</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <a href="https://yarnflow.fr/my-projects" style="display: inline-block; background: linear-gradient(135deg, #dd7a4a 0%, #c86438 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                                            📱 Retour sur YarnFlow
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                                Besoin d'un coup de main ou d'un petit conseil ? N'hésitez pas à nous contacter, on est là pour vous aider !
                            </p>

                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                                <em>Si vous ne souhaitez plus recevoir ces emails, vous pouvez vous <a href="https://yarnflow.fr/profile" style="color: #dd7a4a; text-decoration: underline;">désinscrire ici</a>.</em>
                            </p>

                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                                À très vite sur YarnFlow,<br>
                                <strong>Nathalie</strong><br>
                                L'équipe YarnFlow
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #fef8f4; padding: 30px 40px; border-radius: 0 0 12px 12px; border-top: 1px solid #f3e8dd;">
                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px; text-align: center;">
                                © 2025 YarnFlow — Votre tracker tricot & crochet
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                                <a href="https://yarnflow.fr" style="color: #dd7a4a; text-decoration: none;">yarnflow.fr</a> •
                                <a href="https://yarnflow.fr/contact" style="color: #dd7a4a; text-decoration: none;">Contact</a> •
                                <a href="https://yarnflow.fr/cgu" style="color: #dd7a4a; text-decoration: none;">CGU</a>
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
}
