-- Migration : ajout stripe_subscription_id sur la table users
-- Permet de valider que les événements customer.subscription.updated
-- correspondent bien à l'abonnement actif et non à d'anciens abonnements.

ALTER TABLE users
    ADD COLUMN stripe_subscription_id VARCHAR(255) NULL DEFAULT NULL
    AFTER stripe_customer_id;
