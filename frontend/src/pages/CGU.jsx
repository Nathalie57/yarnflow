import React from 'react';
import { Link } from 'react-router-dom';

/**
 * @file CGU.jsx
 * @brief Page des Conditions Générales d'Utilisation
 * @created 2025-11-20
 */
export default function CGU() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-primary-600 hover:text-primary-700 font-semibold mb-4 inline-block">
            ← Retour à l'accueil
          </Link>
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-gray-600">Dernière mise à jour : 20 novembre 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-purple max-w-none space-y-6">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Objet</h2>
            <p className="text-gray-700 leading-relaxed">
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation
              de la plateforme YarnFlow, accessible à l'adresse <span className="font-semibold">yarnflow.app</span>,
              éditée par <span className="font-semibold">YarnFlow Studio</span>.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              YarnFlow est une application web permettant aux passionnés de tricot et crochet de suivre
              leurs projets, générer des photos professionnelles avec l'IA, et gérer leur bibliothèque de patrons.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Acceptation des CGU</h2>
            <p className="text-gray-700 leading-relaxed">
              L'accès et l'utilisation de YarnFlow impliquent l'acceptation pleine et entière des présentes CGU.
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Inscription et compte utilisateur</h2>
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                <strong>3.1 Création de compte :</strong> Pour accéder aux fonctionnalités de YarnFlow,
                vous devez créer un compte en fournissant une adresse email valide et un mot de passe sécurisé.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>3.2 Responsabilité :</strong> Vous êtes responsable de la confidentialité de vos
                identifiants et de toutes les activités effectuées depuis votre compte.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>3.3 Informations exactes :</strong> Vous vous engagez à fournir des informations
                exactes et à les maintenir à jour.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Offres et tarification</h2>
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                <strong>4.1 Plan GRATUIT :</strong> Accès limité à 3 projets et 5 photos IA par mois.
                Aucun engagement, aucune carte bancaire requise.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>4.2 Plan PRO :</strong> 4,99€/mois ou 39,99€/an. Projets illimités, 75 photos IA/mois,
                bibliothèque de patrons complète.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>4.3 Offre EARLY BIRD :</strong> 2,99€/mois pendant 12 mois (réservée aux membres
                de la waitlist), puis passage automatique à 4,99€/mois. Tous les avantages PRO inclus.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>4.4 Packs de crédits :</strong> Disponibles pour tous les utilisateurs en complément
                (Small 2,99€, Medium 6,99€, Large 14,99€).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Paiement et résiliation</h2>
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                <strong>5.1 Paiement :</strong> Les paiements sont sécurisés via Stripe. Les abonnements
                sont renouvelés automatiquement sauf résiliation.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>5.2 Résiliation :</strong> Vous pouvez résilier votre abonnement à tout moment
                depuis votre tableau de bord. L'accès PRO reste actif jusqu'à la fin de la période payée.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>5.3 Remboursement :</strong> Aucun remboursement n'est possible pour les abonnements
                en cours, conformément à la législation sur les contenus numériques immédiatement accessibles.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Propriété intellectuelle</h2>
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                <strong>6.1 Contenu utilisateur :</strong> Vous conservez tous les droits sur vos projets,
                photos et créations. En uploadant du contenu, vous nous accordez une licence limitée pour
                le traiter (génération IA, stockage).
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>6.2 Contenu YarnFlow :</strong> Le code, design, marque et tous les éléments de
                YarnFlow sont protégés par le droit d'auteur et restent notre propriété exclusive.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Utilisation de l'IA</h2>
            <p className="text-gray-700 leading-relaxed">
              Les photos générées par notre système d'IA sont basées sur vos photos originales. YarnFlow
              utilise Google Gemini pour améliorer vos photos (arrière-plans, mise en scène) mais ne modifie
              jamais l'ouvrage tricoté/crocheté lui-même.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Limitation de responsabilité</h2>
            <p className="text-gray-700 leading-relaxed">
              YarnFlow est fourni "en l'état". Nous ne garantissons pas que le service sera ininterrompu
              ou exempt d'erreurs. Nous ne pourrons être tenus responsables de tout dommage indirect
              résultant de l'utilisation de nos services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">9. Modification des CGU</h2>
            <p className="text-gray-700 leading-relaxed">
              Nous nous réservons le droit de modifier les présentes CGU à tout moment. Les utilisateurs
              seront informés par email des changements importants. L'utilisation continue de YarnFlow
              après modification vaut acceptation des nouvelles CGU.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">10. Droit applicable et juridiction</h2>
            <p className="text-gray-700 leading-relaxed">
              Les présentes CGU sont régies par le droit français. En cas de litige, les tribunaux
              français seront seuls compétents.
            </p>
          </section>

          <section className="bg-primary-50 p-6 rounded-lg mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              Pour toute question concernant ces CGU, contactez-nous à :<br/>
              <strong className="text-primary-600">yarnflowapp@gmail.com</strong>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
