# CollectEVP Backend - API Symfony

Backend REST API pour l'application CollectEVP - Système de gestion des Éléments Variables de Paie OCP.

## 🎯 Vue d'ensemble

API REST sécurisée développée avec Symfony 6.4, utilisant SQLite comme base de données et JWT pour l'authentification. Le système implémente une validation hiérarchique à 5 niveaux pour la gestion des EVP.

## 📋 Prérequis

- **PHP** : 8.2 ou supérieur
- **Composer** : 2.x
- **Extensions PHP requises** :
  - PDO
  - SQLite3
  - OpenSSL
  - JSON
  - mbstring
  - xml

## 🚀 Installation

### 1. Installation des dépendances

```bash
composer install
```

### 2. Configuration de l'environnement

Créez le fichier `.env.local` à partir de `.env` :

```bash
cp .env .env.local
```

Configurez les variables d'environnement dans `.env.local` :

```env
###> symfony/framework-bundle ###
APP_ENV=dev
APP_SECRET=your-secret-key-change-in-production
###< symfony/framework-bundle ###

###> doctrine/doctrine-bundle ###
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"
###< doctrine/doctrine-bundle ###

###> lexik/jwt-authentication-bundle ###
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=your-passphrase-here
JWT_TTL=3600
###< lexik/jwt-authentication-bundle ###
```

### 3. Génération des clés JWT

```bash
# Créer le dossier des clés
mkdir -p config/jwt

# Générer les clés (Windows)
php bin/console lexik:jwt:generate-keypair

# Ou manuellement (Linux/Mac)
openssl genpkey -out config/jwt/private.pem -aes256 -algorithm rsa -pkeyopt rsa_keygen_bits:4096
openssl pkey -in config/jwt/private.pem -out config/jwt/public.pem -pubout
```

### 4. Configuration de la base de données

```bash
# Créer le dossier var si nécessaire
mkdir -p var

# Créer la base de données SQLite
php bin/console doctrine:database:create --if-not-exists

# Exécuter les migrations
php bin/console doctrine:migrations:migrate --no-interaction

# Charger les données de test (utilisateurs et employés)
php bin/console doctrine:fixtures:load --no-interaction
```

### 5. Démarrage du serveur

```bash
# Serveur PHP intégré (développement)
php -S 127.0.0.1:8080 -t public

# Ou avec Symfony CLI
symfony server:start
```

L'API sera accessible sur : `http://127.0.0.1:8080/api`

## 📡 Endpoints API

### Authentification

- **POST** `/api/login` - Connexion (retourne un token JWT)
- **GET** `/api/me` - Informations de l'utilisateur connecté

### Employés

- **GET** `/api/employees` - Liste des employés (RH uniquement)
- **GET** `/api/employees/{id}` - Détails d'un employé
- **POST** `/api/employees` - Créer un employé (RH uniquement)
- **PUT** `/api/employees/{id}` - Modifier un employé (RH uniquement)
- **DELETE** `/api/employees/{id}` - Supprimer un employé (RH uniquement)

### EVP Submissions

- **GET** `/api/evp/submissions` - Liste des soumissions (filtrées par rôle)
- **POST** `/api/evp/submissions` - Créer une soumission (Gestionnaire)
- **PUT** `/api/evp/submissions/{id}` - Modifier une soumission
- **DELETE** `/api/evp/submissions/{id}` - Supprimer une soumission
- **POST** `/api/evp/submissions/{id}/validate` - Valider/rejeter (Responsables)

### Utilisateurs

- **GET** `/api/users` - Liste des utilisateurs (Admin uniquement)
- **POST** `/api/users` - Créer un utilisateur (Admin uniquement)
- **PUT** `/api/users/{id}` - Modifier un utilisateur (Admin uniquement)
- **DELETE** `/api/users/{id}` - Supprimer un utilisateur (Admin uniquement)

### Demandes d'employés

- **GET** `/api/employee-requests` - Liste des demandes (RH uniquement)
- **POST** `/api/employee-requests` - Créer une demande (Gestionnaire)
- **PUT** `/api/employee-requests/{id}/process` - Traiter une demande (RH uniquement)

## 🗄️ Structure de la base de données

### Tables principales

- **users** : Utilisateurs système (5 rôles)
- **employees** : Base de données des employés OCP
- **evp_submissions** : Soumissions EVP (Prime, Congé)
- **primes** : Détails des primes
- **conges** : Détails des congés
- **employee_requests** : Demandes d'ajout d'employés

### Relations

- Un `EVPSubmission` peut avoir une `Prime` ET/OU un `Conge`
- Un `EVPSubmission` est lié à un `Employee` et un `User` (submittedBy)
- Les validations sont tracées via les champs `statut` et `valideService`/`valideDivision`

## 🔐 Sécurité

### Authentification JWT

- Tokens JWT avec expiration (1h par défaut)
- Clés RSA 4096 bits
- Stateless authentication

### Autorisation

Système de rôles hiérarchique :
- `ROLE_GESTIONNAIRE` : Saisie et soumission
- `ROLE_RESPONSABLE_SERVICE` : Validation niveau service
- `ROLE_RESPONSABLE_DIVISION` : Validation niveau division
- `ROLE_RH` : Gestion employés et reporting
- `ROLE_ADMIN` : Administration système

### Protection des données

- Mots de passe hashés avec bcrypt
- Validation des données avec Symfony Validator
- Protection CSRF (non applicable pour API stateless)
- CORS configuré pour le frontend

## 🛠️ Commandes utiles

### Migrations

```bash
# Créer une migration
php bin/console make:migration

# Exécuter les migrations
php bin/console doctrine:migrations:migrate

# Voir le statut des migrations
php bin/console doctrine:migrations:status
```

### Base de données

```bash
# Créer la base de données
php bin/console doctrine:database:create

# Supprimer la base de données
php bin/console doctrine:database:drop --force

# Vider les tables (sauf employees et users)
powershell -File clear_tables_except_employees_and_users.ps1

# Requête SQL directe
php bin/console doctrine:query:sql "SELECT * FROM users"
```

### Fixtures

```bash
# Charger les fixtures
php bin/console doctrine:fixtures:load

# Charger sans confirmation
php bin/console doctrine:fixtures:load --no-interaction
```

### Cache

```bash
# Vider le cache
php bin/console cache:clear

# Vider le cache de production
php bin/console cache:clear --env=prod
```

### Entités

```bash
# Créer une entité
php bin/console make:entity

# Créer un contrôleur
php bin/console make:controller
```

## 📊 Utilisateurs de test

Les fixtures créent automatiquement 5 utilisateurs de test :

| Email | Mot de passe | Rôle | Division |
|-------|-------------|------|----------|
| gestionnaire@ocp.ma | password123 | Gestionnaire | Production |
| responsable.service@ocp.ma | password123 | Responsable Service | Service Maintenance |
| responsable.division@ocp.ma | password123 | Responsable Division | Division Production |
| rh@ocp.ma | password123 | RH | - |
| admin@ocp.ma | password123 | Administrateur | - |

## 🔍 Développement

### Logs

Les logs sont disponibles dans `var/log/dev.log` :

```bash
# Voir les logs en temps réel
tail -f var/log/dev.log
```

### Accès à la base de données

```bash
# Ouvrir SQLite en ligne de commande
sqlite3 var/data.db

# Commandes SQLite utiles
.tables                    # Lister les tables
.schema users              # Voir le schéma d'une table
SELECT * FROM users;       # Requête SQL
```

### Tests API

```bash
# Test de connexion (PowerShell)
Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"gestionnaire@ocp.ma","password":"password123"}'
```

## 📁 Structure du code

```
backend/
├── config/                 # Configuration Symfony
│   ├── packages/          # Configuration des bundles
│   │   ├── security.yaml # Sécurité et rôles
│   │   ├── doctrine.yaml # Configuration ORM
│   │   └── cors.yaml     # Configuration CORS
│   └── routes.yaml       # Routes API
├── src/
│   ├── Controller/        # Contrôleurs API
│   │   ├── AuthController.php
│   │   ├── EVPController.php
│   │   ├── EmployeeController.php
│   │   ├── UserController.php
│   │   └── EmployeeRequestController.php
│   ├── Entity/            # Entités Doctrine
│   │   ├── User.php
│   │   ├── Employee.php
│   │   ├── EVPSubmission.php
│   │   ├── Prime.php
│   │   └── Conge.php
│   ├── Repository/        # Repositories Doctrine
│   ├── DataFixtures/      # Données de test
│   └── Security/          # Handlers de sécurité
└── migrations/            # Migrations Doctrine
```

## ⚠️ Dépannage

### Erreur : "could not find driver"

Vérifiez que l'extension SQLite est activée :

```bash
php -m | grep -i sqlite
```

Activez dans `php.ini` :
```ini
extension=pdo_sqlite
extension=sqlite3
```

### Erreur : "JWT keys not found"

Générez les clés :
```bash
php bin/console lexik:jwt:generate-keypair
```

### Erreur : "Class not found"

Videz le cache et réinstallez les dépendances :
```bash
php bin/console cache:clear
composer dump-autoload
```

### Erreur CORS

Vérifiez `config/packages/cors.yaml` et assurez-vous que l'origine du frontend est autorisée.

## 📝 Notes

- La base de données SQLite est stockée dans `var/data.db`
- Les migrations sont versionnées dans `migrations/`
- Les fixtures sont dans `src/DataFixtures/`
- Les logs sont dans `var/log/`
- Le cache est dans `var/cache/`

## 🔗 Documentation

- [Symfony Documentation](https://symfony.com/doc/6.4/)
- [Doctrine ORM](https://www.doctrine-project.org/projects/doctrine-orm/en/latest/)
- [Lexik JWT Bundle](https://github.com/lexik/LexikJWTAuthenticationBundle)
