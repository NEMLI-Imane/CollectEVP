# CollectEVP Backend - Symfony API

Backend Symfony pour l'application CollectEVP - Système de gestion des Éléments Variables de Paie OCP.

## Prérequis

- PHP 8.2+ (avec extensions PDO et SQLite)
- Composer
- SQLite 3 (intégré à PHP)

## Installation

### 1. Configuration de l'environnement

Copiez le fichier `.env` et configurez les variables d'environnement :

```bash
cp .env .env.local
```

Modifiez `.env.local` pour utiliser SQLite :

```env
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"
```

### 2. Génération des clés JWT

Générez les clés JWT pour l'authentification :

```bash
mkdir -p config/jwt
openssl genpkey -out config/jwt/private.pem -aes256 -algorithm rsa -pkeyopt rsa_keygen_bits:4096
openssl pkey -in config/jwt/private.pem -out config/jwt/public.pem -pubout
```

Ou utilisez le script fourni :

```bash
php bin/console lexik:jwt:generate-keypair
```

### 3. Installation des dépendances

```bash
composer install
```

### 4. Configuration de la base de données

```bash
# Créer le dossier var si nécessaire
mkdir -p var

# Créer la base de données SQLite
php bin/console doctrine:database:create --if-not-exists

# Exécuter les migrations
php bin/console doctrine:migrations:migrate --no-interaction

# Charger les fixtures (utilisateurs de test)
php bin/console doctrine:fixtures:load --no-interaction
```

### 5. Démarrage du serveur PHP

```bash
# Démarrer le serveur PHP intégré
php -S 127.0.0.1:8080 -t public
```

**Important** : Gardez ce terminal ouvert pendant que vous utilisez l'application.

### 6. Accès à l'API

L'API est accessible sur : `http://127.0.0.1:8080/api`

## Utilisateurs de test

Les fixtures créent 5 utilisateurs de test :

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| gestionnaire@ocp.ma | password123 | Gestionnaire |
| responsable.service@ocp.ma | password123 | Responsable Service |
| responsable.division@ocp.ma | password123 | Responsable Division |
| rh@ocp.ma | password123 | RH |
| admin@ocp.ma | password123 | Administrateur |

## Endpoints API

### Authentification

- `POST /api/login` - Connexion (retourne un token JWT)
- `GET /api/me` - Informations de l'utilisateur connecté

### Employés

- `GET /api/employees` - Liste des employés
- `GET /api/employees/{id}` - Détails d'un employé
- `POST /api/employees` - Créer un employé (RH uniquement)
- `PUT /api/employees/{id}` - Modifier un employé (RH uniquement)
- `DELETE /api/employees/{id}` - Supprimer un employé (RH uniquement)

### EVP (Éléments Variables de Paie)

- `GET /api/evp/submissions` - Liste des soumissions EVP
- `POST /api/evp/submissions` - Créer une soumission EVP (Gestionnaire uniquement)

## Structure des entités

### User
- Gestion des utilisateurs avec 5 rôles
- Authentification JWT

### Employee
- Base de données des employés
- Matricule, nom, prénom, poste, service, division

### EVPSubmission
- Soumissions d'EVP (Prime, Congé, Heures Sup, Absence)
- Calculs automatiques des montants
- Historique de validation

### ValidationHistory
- Traçabilité complète des validations
- Commentaires et dates

### MonthlyBudget
- Gestion budgétaire mensuelle par division
- Calcul des écarts prévu/réalisé

## Commandes utiles

```bash
# Créer une migration
php bin/console make:migration

# Exécuter les migrations
php bin/console doctrine:migrations:migrate

# Créer une entité
php bin/console make:entity

# Créer un contrôleur
php bin/console make:controller

# Vider le cache
php bin/console cache:clear

# Vérifier la base de données
sqlite3 var/data.db ".tables"
```

## Développement

### Logs

Les logs sont disponibles dans `var/log/dev.log`

### Accès à la base de données

```bash
# Ouvrir SQLite en ligne de commande
sqlite3 var/data.db

# Ou utiliser Doctrine
php bin/console doctrine:query:sql "SELECT * FROM users"
```

## Sécurité

- Authentification JWT avec expiration (1h par défaut)
- Hachage des mots de passe avec bcrypt
- Validation des données avec Symfony Validator
- CORS configuré pour le frontend React

## Documentation

Voir `CollectEVP_Guide_Complet.md` pour la documentation métier complète.

## Note sur Docker

Si vous souhaitez utiliser Docker à la place de PHP local, consultez les fichiers dans le dossier `docker/` à la racine du projet.
