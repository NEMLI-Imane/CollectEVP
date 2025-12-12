#!/bin/bash

# Script d'installation des dépendances Symfony
# Pour utilisation avec PHP local

echo "Installation des dépendances Composer..."
composer install --no-interaction

echo "Création du dossier var si nécessaire..."
mkdir -p var

echo "Installation terminée !"
echo ""
echo "Prochaines étapes :"
echo "1. Créez .env.local avec : cp .env .env.local"
echo "2. Configurez DATABASE_URL pour SQLite dans .env.local"
echo "3. Créez la base de données : php bin/console doctrine:database:create"
echo "4. Exécutez les migrations : php bin/console doctrine:migrations:migrate"
echo "5. Chargez les fixtures : php bin/console doctrine:fixtures:load"
echo "6. Démarrez le serveur : php -S 127.0.0.1:8080 -t public"








