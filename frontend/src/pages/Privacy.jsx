import React from 'react';
import { Link } from 'react-router-dom';

/**
 * @file Privacy.jsx
 * @brief Page de Politique de Confidentialité (RGPD)
 * @created 2025-11-20
 */
export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-purple-600 hover:text-purple-700 font-semibold mb-4 inline-block">
            ← Retour à l'accueil
          </Link>
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            Politique de Confidentialité
          </h1>
          <p className="text-gray-600">Dernière mise à jour : 20 novembre 2025</p>
          <p className="text-sm text-purple-600 font-semibold mt-2">Conforme RGPD (Règlement Général sur la Protection des Données)</p>
        </div>

        {/* Content */}
        <div className="prose prose-purple max-w-none space-y-6">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Responsable du traitement</h2>
            <p className="text-gray-700 leading-relaxed">
              Le responsable du traitement des données personnelles collectées sur YarnFlow est :<br/>
              <strong>YarnFlow Studio</strong><br/>
              <strong>rue Boullay 71000 Macon</strong><br/>
              Email : <strong className="text-purple-600">yarnflowapp@gmail.com</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Données collectées</h2>
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                <strong>2.1 Données d'identification :</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Adresse email (obligatoire pour la création de compte)</li>
                <li>Mot de passe (hashé et sécurisé)</li>
                <li>Nom complet (optionnel)</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                <strong>2.2 Données de projet :</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Projets tricot/crochet (nom, type, niveau, notes)</li>
                <li>Photos uploadées</li>
                <li>Patrons sauvegardés</li>
                <li>Statistiques de progression</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                <strong>2.3 Données de paiement :</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Informations de paiement (traitées par Stripe, non stockées sur nos serveurs)</li>
                <li>Historique des transactions</li>
                <li>Type d'abonnement actif</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                <strong>2.4 Données techniques :</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Adresse IP</li>
                <li>Type de navigateur et appareil</li>
                <li>Cookies de session</li>
                <li>Logs d'utilisation anonymisés</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Finalités du traitement</h2>
            <p className="text-gray-700 leading-relaxed mb-3">Vos données sont utilisées pour :</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Fourniture du service :</strong> Gestion de votre compte, stockage de vos projets, génération de photos IA</li>
              <li><strong>Paiements :</strong> Traitement des abonnements et achats via Stripe</li>
              <li><strong>Communication :</strong> Envoi d'emails transactionnels (confirmation, rappels)</li>
              <li><strong>Amélioration :</strong> Statistiques d'usage anonymisées pour améliorer YarnFlow</li>
              <li><strong>Sécurité :</strong> Détection de fraudes et protection du service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Base légale du traitement</h2>
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                <strong>Exécution du contrat :</strong> Traitement nécessaire pour fournir les services YarnFlow
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Consentement :</strong> Pour l'envoi d'emails marketing (avec opt-out possible)
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Intérêt légitime :</strong> Amélioration du service, sécurité, statistiques
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Partage des données</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Vos données ne sont <strong className="text-purple-600">jamais vendues</strong> à des tiers.
              Elles peuvent être partagées uniquement avec :
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Stripe :</strong> Pour le traitement des paiements (conformément à leur politique de confidentialité)</li>
              <li><strong>Google Gemini :</strong> Pour la génération de photos IA (vos photos sont traitées puis supprimées)</li>
              <li><strong>Hébergeurs :</strong> Serveurs sécurisés situés dans l'Union Européenne</li>
              <li><strong>Autorités légales :</strong> Si requis par la loi ou décision de justice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Durée de conservation</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Compte actif :</strong> Données conservées tant que le compte existe</li>
              <li><strong>Compte supprimé :</strong> Suppression sous 30 jours (sauf obligations légales)</li>
              <li><strong>Données de paiement :</strong> Conservées 10 ans (obligation comptable)</li>
              <li><strong>Logs techniques :</strong> 12 mois maximum</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Vos droits RGPD</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <div className="bg-purple-50 p-4 rounded-lg space-y-2">
              <p className="text-gray-700"><strong>✓ Droit d'accès :</strong> Consulter vos données</p>
              <p className="text-gray-700"><strong>✓ Droit de rectification :</strong> Corriger vos données</p>
              <p className="text-gray-700"><strong>✓ Droit à l'effacement :</strong> Supprimer votre compte et données</p>
              <p className="text-gray-700"><strong>✓ Droit à la portabilité :</strong> Récupérer vos données (format JSON)</p>
              <p className="text-gray-700"><strong>✓ Droit d'opposition :</strong> Refuser certains traitements</p>
              <p className="text-gray-700"><strong>✓ Droit de limitation :</strong> Restreindre certains usages</p>
            </div>
            <p className="text-gray-700 leading-relaxed mt-4">
              Pour exercer ces droits, contactez-nous à : <strong className="text-purple-600">yarnflowapp@gmail.com</strong><br/>
              Réponse sous 30 jours maximum.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              YarnFlow utilise les cookies suivants :
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Cookies essentiels :</strong> Authentification JWT (obligatoires pour le fonctionnement)</li>
              <li><strong>Cookies analytiques :</strong> Statistiques d'usage (avec consentement)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Vous pouvez gérer vos préférences cookies depuis les paramètres de votre navigateur.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">9. Sécurité</h2>
            <p className="text-gray-700 leading-relaxed">
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger
              vos données :
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mt-2">
              <li>Chiffrement HTTPS/SSL</li>
              <li>Mots de passe hashés (bcrypt)</li>
              <li>Serveurs sécurisés UE</li>
              <li>Backups quotidiens chiffrés</li>
              <li>Accès restreint aux données</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">10. Transferts hors UE</h2>
            <p className="text-gray-700 leading-relaxed">
              Vos données sont hébergées dans l'Union Européenne. Seul Google Gemini (États-Unis) peut
              traiter temporairement vos photos pour la génération IA, conformément aux clauses contractuelles
              types et au Privacy Shield.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">11. Modifications</h2>
            <p className="text-gray-700 leading-relaxed">
              Cette politique peut être modifiée. Les changements importants seront notifiés par email.
              Date de dernière mise à jour en haut de cette page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">12. Réclamation CNIL</h2>
            <p className="text-gray-700 leading-relaxed">
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation
              auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) :<br/>
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                www.cnil.fr
              </a>
            </p>
          </section>

          <section className="bg-purple-50 p-6 rounded-lg mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Contact DPO</h2>
            <p className="text-gray-700 leading-relaxed">
              Pour toute question concernant vos données personnelles :<br/>
              <strong className="text-purple-600">yarnflowapp@gmail.com</strong><br/>
              Objet : "RGPD - [Votre demande]"
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
