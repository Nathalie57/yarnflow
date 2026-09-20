# Refonte UI — charte graphique YarnFlow

Suivi de la refonte de l'interface pour coller à la charte graphique (couleurs, formes, typo, présence de Flow). Travail fait sur la branche `refonte-ui-charte` — **ne pas fusionner sur `main` sans validation explicite**.

Référence : charte complète dans la mémoire `yarnflow_ui_charte_graphique`.

## Fait

- [x] Fondations design system (`tailwind.config.js`, `index.html`, `index.css`) : palette `flow.*` exacte, rayons `card`/`control`, police Nunito Sans
- [x] `FlowMascot.jsx` : 5 nouvelles poses (heureux, interrogatif, avecPatron, surpris, quiReflechit), bug de joues manquantes corrigé, bug de viewBox trop grand corrigé sur `heureux` et `interrogatif`
- [x] `MyProjects.jsx` (liste de projets) — validé
- [x] `ProjectCounter.jsx` (page projet) :
  - [x] Tous les modals (bibliothèque de patrons, URL, associer patron IA, post-upload photo, embellissement IA, exemples de styles, détails techniques, ajout/édition section, ajout à la bibliothèque, confirmation rangs, partage Instagram, gestionnaire de rappels, fin de projet, choix modification patron)
  - [x] Header (titre, badges, menus déroulants, toggle rangs/cm, zone tags)
  - [x] Barre de progression globale + bouton "Marquer terminé"
  - [x] Compteur géant + timers + tableau des sections (rayons/couleurs uniformisés sur tout le fichier)
  - [x] Tabs Photos/Patron/Description + leurs états vides (Flow ajouté)
  - [x] Emojis retirés partout dans ce fichier (icônes SVG à la place)
  - [x] Flow dans la zone du compteur actif (message "Encore X rangs" + Flow "cestParti" pendant une session)
- [x] Assistant IA (`AiAssistant.jsx`, `AiAssistantDrawer.jsx`, bouton dans `BottomNav.jsx`) : étincelle générique remplacée par Flow partout (en-tête du tiroir, bouton nav — agrandi à 34px après retour utilisatrice, état vide/accueil du chat, avatar sur chaque réponse, indicateur "en train de réfléchir" avec pose "quiReflechit", état quota épuisé avec pose "interrogatif"), rayons/couleurs charte appliqués
- [x] Composants séparés de `ProjectCounter.jsx` : `ProjectCloseModal` (rayons/couleurs), `DemoStepsCompleteModal` (Flow "heureux", moment de célébration demo), `DeadlinePickerModal` (déjà bon, dans le même fichier que ProjectCounter donc deja repris par le remplacement global), `SatisfactionModal` (emoji 🎨 retiré → Flow "heureux", étoiles recolorées en `flow-yellow`)
- [x] Accueil / dashboard : `/dashboard` redirige directement vers `/my-projects`, déjà fait
- [x] Import/analyse de patron (`SmartProjectCreator.jsx`) : rayons/couleurs charte sur tout le fichier, Flow "avecPatron" sur l'écran de choix du mode d'import (charte section 14), Flow "quiReflechit" (avec `animate`) sur l'écran d'analyse IA à la place du double spinner, Flow "heureux" sur l'écran "création du projet" juste avant redirection, Flow "interrogatif" sur l'écran de quota épuisé
- [x] Navigation mobile (`BottomNav.jsx`) : rayons restants corrigés (Projets, Ressources) — le bouton Assistant était déjà fait
- [x] Notifications/feedbacks : `PushNotificationModal.jsx` (Flow "content" à la place de l'icône cloche), `PushNotificationBanner.jsx` (rayon corrigé, icône cloche laissée telle quelle — bandeau utilitaire fin, pas un "moment"), et surtout **`useAlert.jsx`** (rayons/couleurs charte + Flow "heureux" uniquement sur les alertes de type `success`, jamais sur les confirmations banales) — hook partagé par `MyProjects`, `ProjectCounter`, `ChartDesigner`, `PatternLibrary`, `AssociatePatternForAi`, donc effet immédiat partout où `showAlert({type: 'success'})` est utilisé

- [x] Ratio 70/20/10 (charte section 7) audité : `bg-flow-coral` n'apparaît que dans 1 fichier (`MyProjects.jsx`, badge technique crochet), les couleurs d'accent (`mint`/`blue`/`peach`/`lavande`) restent minoritaires face aux fonds neutres/blancs partout ailleurs — pas de dérive constatée, rien à corriger. La couleur ambre hors charte reste un sujet distinct et volontairement laissé de côté (voir mémoire `yarnflow_amber_offbrand_color`).

- [x] États vides ailleurs que `MyProjects`/`ProjectCounter` : `Gallery.jsx` (galerie vide -> Flow "onYVa", aucun résultat de recherche -> Flow "interrogatif", rayons corrigés, emoji 🗑️ retiré), `PatternLibrary.jsx` (accueil bibliothèque vide -> Flow "avecPatron" en grand — charte section 14, aucun résultat -> Flow "interrogatif", 2 messages d'erreur upload avec emoji ⚠️ retiré), `YarnStash.jsx` (stock vide -> Flow "onYVa"), `Glossary.jsx` (aucun terme trouvé -> Flow "interrogatif" en petit, panneau compact). Volontairement laissés en l'état (texte seul, pas de Flow) : `ChartDesigner.jsx`, `StashAllocationPanel.jsx`, `PatternLibraryDetail.jsx`, et les petites notes "aucun projet/section" dans les modals `Save*ToProjectModal`/`SaveSequenceToSectionModal` — moments trop mineurs, en mettre partout irait contre la règle "pas partout" de la charte. `MyPatterns.jsx` repéré mais non touché : page orpheline, non reliée à aucune route dans `App.jsx`, du code mort.
- [x] Landing page (`Landing.jsx`) : reprise complète dans l'esprit "Foodvisor" demandé par l'utilisatrice (sections alternées, Flow présent partout, ton chaleureux/personnel) — header avec mini Flow à côté du logo, hero avec Flow qui porte la conversation (remplace l'icône générique) + un Flow qui déborde du mockup en grand format (110px, agrandi une fois sur retour utilisatrice), section "problème" avec Flow "interrogatif", section assistant avec Flow "quiReflechit" comme avatar, chaque section feature (compteur/photo/bibliothèque/création intelligente) a son propre Flow en en-tête (cestParti/surpris/bonneIdee/avecPatron), bloc traduction avec Flow à côté du texte, témoignages avec Flow "heureux", CTA final avec Flow "cestParti", footer avec le même mini Flow que le header à la place de l'icône feuille générique. Rayons/couleurs charte appliqués sur toute la page (fonds de section teintés flow-peach/mint/lavande/blue/cream en alternance plutôt que le simple gris/primary répétitif d'avant). Les vraies captures d'écran du produit sont conservées telles quelles.
- [x] Modale "Nouveau projet" (`CreateProjectWizard/index.jsx`) : repérée non reprise lors d'un test utilisatrice — rayons/couleurs charte appliqués sur tout le fichier (y compris les `rounded-lg` internes, nombreux dans ce fichier), Flow "content" ajouté dans l'en-tête des deux écrans (choix Création Intelligente/manuel, puis formulaire manuel), emojis 📏/📐 retirés du choix d'unité de comptage. Les fichiers `steps/Step1Template.jsx` à `Step4Optional.jsx` du même dossier repérés mais non touchés : non importés nulle part, code mort (l'ancien assistant par étapes, remplacé par ce formulaire unique).
- [x] `PatternLibrary.jsx` complet (2026-09-20) : la premiere passe n'avait couvert que les etats vides. Repris entierement — rayons/couleurs charte sur tout le fichier (y compris les nombreux `rounded-lg`), Flow "avecPatron" dans l'en-tete a cote du titre, bordures des cartes en `flow-mint`, etoile favori en `flow-yellow` (au lieu d'ambre), badge technique tricot/crochet distinct par couleur (lavande/corail, meme convention que MyProjects/ProjectCounter), badge difficulte en `flow-blue`.
- [ ] Revalider le rendu mobile des Flow en position absolue/grande taille (comme pour la zone compteur), y compris sur la nouvelle landing (le Flow qui déborde du mockup hero notamment)
- [ ] `Gallery.jsx` : header repris (Flow ajoute) et texte credits corrige (bug "3 essais offerts" vs 2 reels), mais le reste de la page (cartes photos, menus, modals d'embellissement) n'a pas ete audite pour les rayons/couleurs charte — a verifier
- [x] Mon Stock (`YarnStash.jsx` + `YarnStashCard.jsx` + `YarnStashStats.jsx` + `YarnStashForm.jsx`) complet (2026-09-20) : Flow "content" ajoute dans l'en-tete, rayons/couleurs charte sur les 4 fichiers, cartes de pelotes en `border-flow-mint`, badge de gamme de laine recolore (etait en indigo, hors charte) en `flow-blue`, bandeau de stats (4 chiffres cles) en `rounded-card`/`border-flow-mint` avec des nuances de vert sauge a la place de l'indigo/violet hors charte. Ambre laisse tel quel sur le badge "pelotes reservees" (regle etablie : ne pas re-signaler/changer ponctuellement).
- [x] `/bibliotheque` (`Bibliotheque.jsx`, page hub distincte de `/pattern-library` — pas du code mort, c'est la cible de tous les liens "Ressources"/"Retour") : Flow "content" dans l'en-tete, rayons/couleurs charte, chaque section (Patrons/Stock/Outils/Galerie) recoit sa propre teinte douce (lavande/peche/bleu/mint) pour se distinguer visuellement
- [x] Page Outils (`Tools.jsx`) : Flow "bonneIdee" dans l'en-tete, rayons/couleurs charte, ancienne alternance de couleurs `primary`/`warm` (warm etait hors charte, jamais utilise ailleurs) remplacee par un cycle des 4 couleurs d'accent officielles (mint/bleu/peche/lavande) sur les tuiles d'outils

## Audit complet du 2026-09-20 — reste à faire

Agent Explore lancé pour verifier l'etat de tout le reste de l'app. Resultat : aucun fichier hors de la liste "Fait" ci-dessus n'utilise `FlowMascot`, a part `Gallery.jsx`/`Glossary.jsx` (deja partiels).

**Pages haute visibilité, à reprendre en priorité :**
- [x] `Navbar.jsx` : Flow dans le logo (desktop + tiroir mobile), badge de serie sans emoji (icone flamme SVG en peche), rayons/couleurs charte
- [x] `Subscription.jsx` : Flow sur l'ecran TWA et l'en-tete, rayons/couleurs charte
- [x] `Profile.jsx` : Flow dans l'en-tete, rayons/couleurs charte — **bonus : classes utilitaires globales `.card`/`.btn-primary`/`.btn-secondary`/`.input-field` corrigees dans `index.css`, effet immediat sur tous les fichiers qui les utilisent**
- [x] `Stats.jsx` : emoji 🔥/🏆 remplace par Flow "heureux" sur le modal de celebration (record de serie/badge debloque), rayons/couleurs charte
- [x] `ProjectCharts.jsx` : rayons/couleurs charte, etat vide "aucune grille" ajoute avec Flow "onYVa" (n'existait pas avant)
- [x] `PatternLibraryDetail.jsx` : rayons/couleurs charte (1312 lignes), etoile favori en `flow-yellow`, badge technique recolore comme le reste de l'app
- [x] `ChartEditor.jsx` : rayons/couleurs charte, emoji 🔗 retire (icone SVG) — pas de Flow, outil dense/technique (canvas de dessin)
- [x] `Gallery.jsx` complet maintenant (reste du fichier apres header+credits)

**Pages d'auth/onboarding (premier contact) :** toutes faites — `Register.jsx` (emoji 🧶/🎉 remplaces par Flow "content"/"heureux"), `Login.jsx` (symetrique de Register), `ForgotPassword.jsx` (emoji 🔑 -> Flow "interrogatif", succes -> Flow "heureux"), `ResetPassword.jsx` (emoji 🔐 -> Flow "content", succes -> Flow "heureux", ecran token invalide laisse tel quel — signal d'erreur clair), `OAuthCallback.jsx` (emoji ❌ -> Flow "interrogatif")

**Autres pages/fonctionnalités :** toutes faites — `PatternTranslator.jsx` (Flow en en-tete + sur le bloc "enregistrer" apres traduction), `PaymentSuccess.jsx` (Flow "heureux" succes / "interrogatif" erreur), `Contact.jsx` (Flow en en-tete + sur "message envoye"), `ImportPartnerPattern.jsx` (emoji 🧶 -> Flow "interrogatif" lien invalide, Flow "avecPatron" sur la fiche patron partenaire)

**Composants partagés (visibilité élevée car réutilisés partout) :** tous faits sauf `ImageLightbox.jsx` (laissé tel quel volontairement — barre d'outils plein écran sombre, glyphes fonctionnels 🔍−/🔍+, pas un bon candidat pour la palette pastel). `UpgradePrompt.jsx` (Flow "bonneIdee" en en-tete), `ProjectFilters.jsx` (emojis 📊/🏷️ -> icones SVG), `ContextualHint.jsx` (icone ampoule generique -> Flow "bonneIdee"), `PWAPrompt.jsx` (Flow sur la proposition d'installation), `TagInput.jsx`, `PendingCheckoutBanner.jsx`, `RavelryConnectionCard.jsx`, `ProxyViewer.jsx` (emoji 🌐 -> icone SVG, erreur -> Flow "interrogatif"), `AssociatePatternForAi.jsx`, `StashAllocationPanel.jsx` (Flow en en-tete + etat vide), `ErrorBoundary.jsx` (Flow "interrogatif" sur l'ecran de crash, composant classe — pas de hook necessaire pour l'utiliser)

**Outils (`components/tools/`, sous-panneaux atteints depuis `Tools.jsx`) :** tous faits — `ChartDesigner.jsx`, `GaugeCalculator.jsx`, `YarnCalculator.jsx`, `DistributeIncrDec.jsx`, `RemainingYarn.jsx`, `LengthConverter.jsx`, `NeedleConverter.jsx`, `YarnWeightConverter.jsx`, les 4 `Save*ToProjectModal.jsx`, et le reste de `Glossary.jsx`. Rayons/couleurs charte uniquement (pas de Flow — ce sont des mini-calculateurs denses, sans espace pertinent).

**➡️ Audit du 2026-09-20 termine.** Tous les fichiers reperes par l'agent Explore ont ete repris.

**Verification finale (2026-09-20)** : sweep complet `rounded-xl|rounded-2xl|rounded-3xl|rounded-lg|text-gray-900` sur tout `frontend/src`. A trouve et corrige 3 oublis reels malgre les verifications precedentes :
- `MyProjects.jsx` — un modal "upload photo" entier plus bas dans le fichier (jamais touche depuis le tout debut de la refonte), 2 emojis 📷/🖼️ retires
- `ProjectCounter.jsx` — le remplacement `rounded-lg` n'avait jamais ete fait sur ce fichier (seuls `rounded-xl`/`rounded-2xl` l'avaient ete), ~15 occurrences oubliees
- `SmartProjectCreator.jsx` et `stash/ProjectCloseModal.jsx` — meme oubli du `rounded-lg`
- `InfoBubble.jsx` (tooltip sombre app-wide) — rayon corrige, couleur laissee (tooltip technique, pas un bon candidat pastel)

**Lecon** : les verifications "cleaned" faites au fil de l'eau ne cherchaient pas systematiquement `rounded-lg` en plus de `rounded-xl`/`rounded-2xl` — a inclure systematiquement dans toute verification future.

Sweep final confirme propre sur tout `frontend/src` (hors code mort / admin / pages legales, deliberement exclus).

**Code mort repéré (à confirmer avant suppression, comme `MyPatterns.jsx`) :**
`Dashboard.jsx`, `Generator.jsx`, `PatternDetail.jsx`, `FirstRowCelebration.jsx`, `ExternalPatternPreview.jsx`, `FloatingCounter.jsx`, `OnboardingModal.jsx`, `PatternLinkBlocked.jsx`, `CreateProjectWizard/TemplateCard.jsx`, `WizardNavigation.jsx`, `WizardProgress.jsx` — aucun n'est importé/route nulle part.

## Hors scope (décidé)

- Pages légales (`CGU.jsx`, `Privacy.jsx`, `Mentions.jsx`) — pas nécessaire
- Panneau admin (`AdminUsers`, `AdminTemplates`, `AdminOptions`, `AdminPhotoFeedback`, `AdminCategories`) — outil interne, pas vu par les utilisatrices, pas de refonte charte prévue

## En attente (pas bloquant)

- [ ] Poses Flow manquantes à dessiner par l'utilisatrice : "qui aide", "qui encourage", "qui dort", "qui fête"
