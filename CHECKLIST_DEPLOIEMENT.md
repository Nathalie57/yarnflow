# Checklist déploiement YarnFlow – Staging → Production

## 1. Base de données – Migrations SQL

Jouer dans cet ordre sur la base prod :

- [ ] `database/add_sequence_counter.sql`
- [ ] `database/add_reminders.sql`
- [ ] `database/add_deadline.sql`
- [ ] `database/add_section_notes.sql`
- [ ] `database/add_project_start_reminder_type.sql`
- [ ] `database/add_pattern_usage_notes.sql`
- [ ] `database/add_pattern_library_files.sql`
- [ ] `database/add_inactivity_reminder.sql`

---

## 2. Fichier .env production

Vérifier que chaque variable est correctement remplie :

- [ ] `APP_ENV=production` et `APP_DEBUG=false`
- [ ] `APP_URL` = URL du backend prod (ex: `https://api.yarnflow.fr`)
- [ ] `FRONTEND_URL` = URL du frontend prod (ex: `https://yarnflow.fr`) — critique pour les redirections Stripe
- [ ] `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` = base prod
- [ ] `JWT_SECRET` = secret long et aléatoire (pas le placeholder)
- [ ] `JWT_EXPIRATION=2592000` (30 jours — sinon reconnexion quotidienne)
- [ ] `STRIPE_SECRET_KEY` = clé **live** `sk_live_...` (pas `sk_test_`)
- [ ] `STRIPE_WEBHOOK_SECRET` = secret webhook **live** `whsec_...`
- [ ] `STRIPE_PRICE_ID_PLUS_MONTHLY` = ID du vrai produit Stripe
- [ ] `STRIPE_PRICE_ID_PLUS_ANNUAL` = ID du vrai produit Stripe
- [ ] `STRIPE_PRICE_ID_PRO_MONTHLY` = ID du vrai produit Stripe
- [ ] `STRIPE_PRICE_ID_PRO_ANNUAL` = ID du vrai produit Stripe
- [ ] `STRIPE_PRICE_ID_CREDITS_50` = ID du vrai produit Stripe
- [ ] `STRIPE_PRICE_ID_CREDITS_150` = ID du vrai produit Stripe
- [ ] `ANTHROPIC_API_KEY` = clé API Claude prod
- [ ] `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD` = config email prod
- [ ] `SMTP_FROM_EMAIL` = `noreply@yarnflow.fr`

---

## 3. Stripe Dashboard

- [ ] Créer les produits/prix si pas encore fait (PLUS mensuel, PLUS annuel, PRO mensuel, PRO annuel, crédits)
- [ ] Configurer le webhook → `https://yarnflow.fr/api/payments/webhook`
- [ ] Activer les événements webhook : `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.created`, `customer.subscription.deleted`
- [ ] Tester avec une vraie carte (carte Stripe de test `4242 4242 4242 4242`) avant d'activer les clés live
- [ ] Vérifier que la redirection post-paiement arrive bien sur `/payment/success`

---

## 4. Crons o2switch

Configurer dans le panneau cron o2switch :

- [ ] `0 8 * * *   php /home/xxx/pattern-maker/backend/cron/inactivity-reminder.php`
- [ ] `0 9 * * *   php /home/xxx/pattern-maker/backend/cron/email-sequence.php`

Remplacer `/home/xxx/` par le vrai chemin sur o2switch.
Vérifier les logs après le premier passage (le lendemain matin).

---

## 5. Déploiement code

- [ ] Merger `staging` → `main` (après validation staging)
- [ ] Déployer le backend PHP sur o2switch
- [ ] Builder le frontend : `npm run build`
- [ ] Déployer le dossier `dist/` sur o2switch
- [ ] Vérifier que le `.htaccess` redirige bien tout vers `index.html` (SPA)
- [ ] Vider le cache CDN si applicable

---

## 6. Tests post-déploiement

- [ ] Inscription → email de bienvenue reçu
- [ ] Connexion → accès à l'app
- [ ] Créer un projet → compteur fonctionne
- [ ] Upgrade FREE → PRO : tunnel Stripe complet, abonnement activé en base
- [ ] Page profil → toggle rappel d'inactivité visible
- [ ] PWA : installable sur mobile

---

## 7. Une fois tout validé

- [ ] Mettre à jour la mémoire projet pour marquer les migrations comme jouées
- [ ] Lancer la communication (Instagram, groupes tricot, etc.)
