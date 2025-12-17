#!/bin/bash
# Script bash pour vider les tables EVP
# Utilise Doctrine pour vider les tables via Symfony

echo "Vidage des tables EVP..."

# Aller dans le répertoire backend
cd "$(dirname "$0")"

# Vérifier si Symfony est disponible
if [ ! -f "bin/console" ]; then
    echo "Erreur: bin/console introuvable. Assurez-vous d'être dans le répertoire backend."
    exit 1
fi

# Exécuter la commande Doctrine pour vider les tables
echo "Suppression des données de la table primes..."
php bin/console dbal:run-sql "DELETE FROM primes"

echo "Suppression des données de la table conges..."
php bin/console dbal:run-sql "DELETE FROM conges"

echo "Suppression des données de la table evp_submissions..."
php bin/console dbal:run-sql "DELETE FROM evp_submissions"

echo ""
echo "Tables vidées avec succès!"

