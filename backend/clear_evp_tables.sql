-- Script pour vider les tables EVP
-- À exécuter dans votre base de données PostgreSQL ou SQLite

-- Désactiver temporairement les contraintes de clés étrangères (si nécessaire)
-- Pour PostgreSQL:
-- SET session_replication_role = 'replica';

-- Supprimer toutes les données des tables
-- Ordre important : d'abord les tables qui référencent evp_submissions

DELETE FROM primes;
DELETE FROM conges;
DELETE FROM evp_submissions;

-- Réactiver les contraintes (si désactivées)
-- Pour PostgreSQL:
-- SET session_replication_role = 'origin';

-- Réinitialiser les séquences (pour PostgreSQL uniquement)
-- ALTER SEQUENCE primes_id_seq RESTART WITH 1;
-- ALTER SEQUENCE conges_id_seq RESTART WITH 1;
-- ALTER SEQUENCE evp_submissions_id_seq RESTART WITH 1;

-- Message de confirmation
SELECT 'Tables primes, conges et evp_submissions vidées avec succès!' AS message;

