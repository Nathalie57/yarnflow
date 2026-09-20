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

## À faire

- [ ] Composants séparés de `ProjectCounter.jsx` : `ProjectCloseModal`, `DemoStepsCompleteModal`, `DeadlinePickerModal`, `SatisfactionModal`
- [ ] Vérifier le ratio 70/20/10 (charte section 7) — usage du corail existant ailleurs dans l'app, pas encore audité
- [ ] Accueil / dashboard
- [ ] Assistant IA (`AiAssistant.jsx`) — la charte le désigne comme l'endroit où Flow doit être le plus présent
- [ ] Import/analyse de patron en dehors de `ProjectCounter` (ex. Smart Creation)
- [ ] États vides ailleurs que `MyProjects`/`ProjectCounter`
- [ ] Notifications/feedbacks
- [ ] Navigation mobile (`BottomNav`)
- [ ] Revalider le rendu mobile des Flow en position absolue/grande taille (comme pour la zone compteur)

## En attente (pas bloquant)

- [ ] Poses Flow manquantes à dessiner par l'utilisatrice : "qui aide", "qui encourage", "qui dort", "qui fête"
