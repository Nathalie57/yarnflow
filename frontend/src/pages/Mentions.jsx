import React from 'react';
import { Link } from 'react-router-dom';

/**
 * @file Mentions.jsx
 * @brief Page des Mentions Légales
 * @created 2025-11-20
 */
export default function Mentions() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-purple-600 hover:text-purple-700 font-semibold mb-4 inline-block">
            ← Retour à l'accueil
          </Link>
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            Mentions Légales
          </h1>
          <p className="text-gray-600">Dernière mise à jour : 20 novembre 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-purple max-w-none space-y-6">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Éditeur du site</h2>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-gray-700 leading-relaxed mb-2">
                <strong>Nom/Raison sociale :</strong> YarnFlow Studio
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                <strong>Forme juridique :</strong> Auto-entrepreneur
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                <strong>SIRET :</strong> [Numéro SIRET]
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                <strong>Numéro TVA :</strong> [Numéro TVA Intracommunautaire]
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                <strong>Adresse du siège social :</strong> rue Boullay 71000 MACON
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                <strong>Email :</strong> <span className="text-purple-600">yarnflowapp@gmail.com</span>
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Directeur de la publication :</strong> Nathalie HENRION
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Hébergement</h2>
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                <strong>Hébergeur du site web :</strong>
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-1"><strong>Nom :</strong> Vercel Inc.</p>
                <p className="text-gray-700 mb-1"><strong>Adresse :</strong> [Adresse de l'hébergeur]</p>
                <p className="text-gray-700"><strong>Site web :</strong> <a href="#" className="text-purple-600 hover:underline">vercel.com</a></p>
              </div>

              <p className="text-gray-700 leading-relaxed mt-4">
                <strong>Hébergeur de la base de données :</strong>
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-1"><strong>Nom :</strong> InfinityFree</p>
                <p className="text-gray-700 mb-1"><strong>Adresse :</strong> [Adresse de l'hébergeur]</p>
                <p className="text-gray-700"><strong>Site web :</strong> <a href="#" className="text-purple-600 hover:underline">infinityfree.com</a></p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Propriété intellectuelle</h2>
            <p className="text-gray-700 leading-relaxed">
              L'ensemble du contenu de ce site (textes, images, vidéos, logos, graphismes, code source)
              est la propriété exclusive de YarnFlow, sauf mention contraire.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie
              des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans
              l'autorisation écrite préalable de YarnFlow.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              <strong>Marque :</strong> YarnFlow™ est une marque déposée. Toute utilisation non autorisée
              constitue une contrefaçon sanctionnée par les articles L. 335-2 et suivants du Code de la
              propriété intellectuelle.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Services tiers utilisés</h2>
            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>🔒 Stripe</strong> - Traitement des paiements
                </p>
                <p className="text-gray-700 text-sm">
                  Stripe, Inc. - 510 Townsend Street, San Francisco, CA 94103, États-Unis<br/>
                  <a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                    Politique de confidentialité Stripe
                  </a>
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>✨ Google Gemini</strong> - Génération de photos avec Intelligence Artificielle
                </p>
                <p className="text-gray-700 text-sm">
                  Google LLC - 1600 Amphitheatre Parkway, Mountain View, CA 94043, États-Unis<br/>
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                    Politique de confidentialité Google
                  </a>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Protection des données (RGPD)</h2>
            <p className="text-gray-700 leading-relaxed">
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique
              et Libertés, vous disposez de droits sur vos données personnelles.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              Pour plus d'informations, consultez notre{' '}
              <Link to="/privacy" className="text-purple-600 hover:underline font-semibold">
                Politique de Confidentialité
              </Link>.
            </p>
            <div className="bg-purple-50 p-4 rounded-lg mt-3">
              <p className="text-gray-700">
                <strong>Délégué à la Protection des Données (DPO) :</strong><br/>
                Email : <span className="text-purple-600">yarnflowapp@gmail.com</span><br/>
                Objet : "RGPD - [Votre demande]"
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              YarnFlow utilise des cookies essentiels au fonctionnement du service (authentification)
              et des cookies analytiques (avec votre consentement).
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              Vous pouvez gérer vos préférences de cookies via les paramètres de votre navigateur ou
              notre bannière de consentement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Limitation de responsabilité</h2>
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                <strong>7.1 Disponibilité :</strong> YarnFlow s'efforce d'assurer l'accès au service 24h/24
                et 7j/7, mais ne peut garantir une disponibilité absolue. Des interruptions peuvent survenir
                pour maintenance.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>7.2 Contenu utilisateur :</strong> YarnFlow n'est pas responsable du contenu publié
                par les utilisateurs (projets, photos, notes). Chaque utilisateur est seul responsable du
                contenu qu'il partage.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>7.3 Liens externes :</strong> YarnFlow peut contenir des liens vers des sites tiers.
                Nous ne sommes pas responsables du contenu de ces sites externes.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Droit applicable</h2>
            <p className="text-gray-700 leading-relaxed">
              Les présentes mentions légales sont régies par le droit français. Tout litige relatif à
              l'utilisation du site YarnFlow sera soumis à la compétence exclusive des tribunaux français.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">9. Médiation</h2>
            <p className="text-gray-700 leading-relaxed">
              Conformément à l'article L.612-1 du Code de la consommation, en cas de litige, vous pouvez
              recourir gratuitement à un médiateur de la consommation :
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-3">
              <p className="text-gray-700">
                <strong>Médiateur de la consommation :</strong> [Nom du médiateur]<br/>
                <strong>Site web :</strong> <a href="#" className="text-purple-600 hover:underline">[URL du médiateur]</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">10. Crédits</h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <strong>Conception & Développement :</strong> YarnFlow Studio
              </p>
              <p className="text-gray-700">
                <strong>Technologies utilisées :</strong> React, PHP, MySQL, Stripe, Google Gemini
              </p>
              <p className="text-gray-700">
                <strong>Icônes :</strong> Heroicons, Lucide Icons
              </p>
            </div>
          </section>

          <section className="bg-purple-50 p-6 rounded-lg mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              Pour toute question concernant ces mentions légales :<br/>
              <strong className="text-purple-600">yarnflowapp@gmail.com</strong>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
