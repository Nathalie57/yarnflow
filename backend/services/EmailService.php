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
     * [AI:Claude] Envoyer un email de bienvenue après inscription
     *
     * @param string $email Email du destinataire
     * @param string $name Prénom de l'utilisateur
     * @return bool True si envoi réussi
     */
    public function sendRegistrationWelcomeEmail(string $email, string $name): bool
    {
        try {
            $mail = clone $this->mailer;
            $mail->addAddress($email, $name);
            $mail->Subject = '🧶 Bienvenue sur YarnFlow !';

            // Corps HTML
            $mail->isHTML(true);
            $mail->Body = $this->getRegistrationWelcomeEmailTemplate($name);

            // Version texte
            $mail->AltBody = "Bienvenue sur YarnFlow !\n\nBonjour $name,\n\nFélicitations ! Votre compte YarnFlow est maintenant créé.\n\nVous pouvez dès maintenant :\n- Créer vos premiers projets tricot/crochet\n- Utiliser le compteur de rangs intelligent\n- Générer 5 photos IA gratuites par mois\n- Organiser votre bibliothèque de patrons\n\nBesoin d'aide ? Consultez notre guide de démarrage dans l'application ou contactez-nous.\n\nBon tricot !\nL'équipe YarnFlow 🧶";

            $mail->send();
            error_log("[EMAIL] Email de bienvenue envoyé à: $email");
            return true;

        } catch (Exception $e) {
            error_log("[EMAIL ERROR] Erreur envoi email de bienvenue: {$mail->ErrorInfo}");
            return false;
        }
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
                                Bienvenue sur YarnFlow ! 🎉
                            </h2>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Bonjour <strong>{$name}</strong>,
                            </p>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Félicitations ! Votre compte YarnFlow est maintenant créé et prêt à l'emploi.
                            </p>

                            <!-- Features Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef8f4; border-radius: 8px; margin: 0 0 30px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="color: #884024; margin: 0 0 16px; font-size: 18px;">
                                            🎁 Ce que vous pouvez faire dès maintenant :
                                        </h3>
                                        <ul style="color: #4b5563; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                            <li><strong>Créer vos projets</strong> tricot et crochet</li>
                                            <li><strong>Utiliser le compteur</strong> de rangs intelligent avec timer</li>
                                            <li><strong>Générer 5 photos IA</strong> gratuites chaque mois</li>
                                            <li><strong>Organiser votre bibliothèque</strong> de patrons</li>
                                            <li><strong>Suivre vos statistiques</strong> de progression</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <a href="https://yarnflow.fr/my-projects" style="display: inline-block; background-color: #dd7a4a; background: linear-gradient(135deg, #dd7a4a 0%, #c86438 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                                            🚀 Créer mon premier projet
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Help Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 4px; margin: 0 0 20px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="color: #075985; font-size: 14px; line-height: 1.6; margin: 0;">
                                            💡 <strong>Besoin d'aide ?</strong><br>
                                            Consultez notre guide de démarrage directement dans l'application (bouton "?" en haut) ou contactez-nous via le formulaire de contact.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                                Bon tricot et bonne organisation ! 🧵
                            </p>

                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
                                L'équipe YarnFlow<br>
                                <strong>Nathalie</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #fef8f4; padding: 30px 40px; border-radius: 0 0 12px 12px; border-top: 1px solid #f3e8dd;">
                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px; text-align: center;">
                                © 2025 YarnFlow - Votre tracker tricot/crochet préféré
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
}
