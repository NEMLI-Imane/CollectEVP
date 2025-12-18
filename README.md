# CollectEVP - Système de Gestion des Éléments Variables de Paie

Application web complète pour la gestion des Éléments Variables de Paie (EVP) chez OCP Safi. Système de validation hiérarchique avec interface moderne et API REST sécurisée.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Rôles et permissions](#rôles-et-permissions)
- [API Documentation](#api-documentation)
- [Structure du projet](#structure-du-projet)
- [Développement](#développement)
- [Dépannage](#dépannage)

## 🎯 Vue d'ensemble

CollectEVP est une application web full-stack permettant la gestion complète des éléments variables de paie (primes, congés) avec un système de validation hiérarchique à 5 niveaux :

1. **Gestionnaire** : Saisie et soumission des EVP
2. **Responsable Service** : Validation niveau service
3. **Responsable Division** : Validation niveau division
4. **RH** : Gestion des employés et reporting global
5. **Administrateur** : Gestion des utilisateurs et configuration système

### Technologies utilisées

- **Frontend** : React 18.3.1, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend** : Symfony 6.4, PHP 8.2+
- **Base de données** : SQLite 3
- **Authentification** : JWT (LexikJWTAuthenticationBundle)
- **ORM** : Doctrine ORM

## 🏗️ Architecture

### Frontend
- **Framework** : React avec TypeScript
- **Build tool** : Vite
- **Styling** : Tailwind CSS
- **UI Components** : shadcn/ui
- **State Management** : React Hooks
- **HTTP Client** : Fetch API

### Backend
- **Framework** : Symfony 6.4
- **API** : RESTful JSON
- **Authentification** : JWT stateless
- **Base de données** : SQLite (fichier `var/data.db`)
- **ORM** : Doctrine ORM
- **Migrations** : Doctrine Migrations
- **Fixtures** : Doctrine Fixtures

## 📦 Prérequis

### Backend
- PHP 8.2 ou supérieur
- Composer 2.x
- Extensions PHP : PDO, SQLite3, OpenSSL, JSON
- SQLite 3 (intégré à PHP)

### Frontend
- Node.js 18+ et npm
- Ou utilisez Docker (voir section Docker)

## 📦 Préparation du ZIP pour l'encadrant

**IMPORTANT** : Avant de créer le ZIP, excluez les fichiers volumineux suivants qui seront réinstallés automatiquement :

### Fichiers à exclure du ZIP

- ❌ `node_modules/` - Dépendances Node.js (sera réinstallé avec `npm install`)
- ❌ `backend/vendor/` - Dépendances PHP (sera réinstallé avec `composer install`)
- ❌ `build/` - Build de production (sera régénéré)
- ❌ `backend/var/cache/` - Cache Symfony (sera régénéré)
- ❌ `backend/var/log/` - Logs (sera régénéré)
- ❌ `backend/var/data.db` - Base de données (sera recréée avec les migrations)

### Créer le ZIP (Windows PowerShell)

```powershell
# Exclure les dossiers volumineux
Compress-Archive -Path * `
  -Exclude @('node_modules', 'backend\vendor', 'build', 'backend\var\cache', 'backend\var\log', 'backend\var\data.db', '.git') `
  -DestinationPath "CollectEVP_Projet.zip" `
  -Force
```

Ou utilisez un outil comme 7-Zip ou WinRAR en excluant manuellement ces dossiers.

## 🚀 Installation

### 1. Extraire le projet

Extrayez le fichier ZIP dans un dossier de votre choix.

```bash
cd "CollectEVP Front"
```

### 2. Configuration du Backend

```bash
cd backend

# Installer les dépendances PHP (nécessaire après extraction du ZIP)
composer install

# Configurer l'environnement
cp .env .env.local
```

**Note** : Si le fichier `.env` n'existe pas, créez-le avec le contenu suivant :

```env
###> symfony/framework-bundle ###
APP_ENV=dev
APP_SECRET=collectevp-secret-key-2025-ocp-safi-production-change-in-prod
###< symfony/framework-bundle ###

###> doctrine/doctrine-bundle ###
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"
###< doctrine/doctrine-bundle ###
```

Modifiez `backend/.env.local` pour configurer SQLite :

```env
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"
APP_SECRET=your-secret-key-here
```

### 3. Génération des clés JWT

```bash
# Créer le dossier des clés
mkdir -p config/jwt

# Générer les clés (Windows PowerShell)
php bin/console lexik:jwt:generate-keypair
```

### 4. Configuration de la base de données

```bash
# Créer la base de données
php bin/console doctrine:database:create --if-not-exists

# Exécuter les migrations
php bin/console doctrine:migrations:migrate --no-interaction

# Charger les données de test
php bin/console doctrine:fixtures:load --no-interaction
```

### 5. Installation du Frontend

```bash
# Retourner à la racine
cd ..

# Installer les dépendances Node.js (nécessaire après extraction du ZIP)
npm install
```

**Note** : L'installation de `node_modules` peut prendre 2-5 minutes selon votre connexion internet.

### 6. Démarrage

**Backend** (dans `backend/`) :
```bash
php -S 127.0.0.1:8080 -t public
```

**Frontend** (à la racine) :
```bash
npm run dev
```

L'application sera accessible sur :
- **Frontend** : http://localhost:5173
- **API Backend** : http://127.0.0.1:8080/api

## ⚙️ Configuration

### Variables d'environnement Backend

Fichier `backend/.env.local` :

```env
###> symfony/framework-bundle ###
APP_ENV=dev
APP_SECRET=your-secret-key-here
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

### Configuration Frontend

L'URL de l'API est configurée dans `src/services/api.ts`. Par défaut : `http://127.0.0.1:8080/api`

## 👥 Utilisation

### Comptes de test

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| gestionnaire@ocp.ma | password123 | Gestionnaire |
| responsable.service@ocp.ma | password123 | Responsable Service |
| responsable.division@ocp.ma | password123 | Responsable Division |
| rh@ocp.ma | password123 | RH |
| admin@ocp.ma | password123 | Administrateur |

### Workflow de validation

1. **Gestionnaire** : Saisit les EVP (Prime et/ou Congé) pour ses employés
2. **Soumission** : Les EVP sont soumis pour validation
3. **Responsable Service** : Valide ou rejette avec commentaire
4. **Responsable Division** : Valide ou rejette les EVP approuvés par le service
5. **RH** : Consulte le reporting global et gère les employés

## 🔐 Rôles et permissions

### Gestionnaire
- Saisie EVP (Prime et Congé)
- Soumission individuelle ou globale
- Consultation historique
- Demande d'ajout d'employés

### Responsable Service
- Validation/rejet niveau service
- Consultation historique
- Gestion des commentaires de rejet

### Responsable Division
- Validation/rejet niveau division
- Consultation historique

### RH
- Reporting global (toutes divisions)
- Gestion employés (CRUD complet)
- Traitement demandes d'ajout d'employés
- Consultation historique consolidé

### Administrateur
- Gestion utilisateurs (CRUD complet)
- Activation/désactivation comptes
- Configuration système
- Gestion des rôles et divisions

## 📡 API Documentation

### Authentification

#### POST /api/login
Connexion et obtention du token JWT.

**Request Body** :
```json
{
  "email": "gestionnaire@ocp.ma",
  "password": "password123"
}
```

**Response** :
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "gestionnaire@ocp.ma",
    "name": "Ahmed Bennani",
    "role": "Gestionnaire",
    "division": "Production"
  }
}
```

#### GET /api/me
Informations de l'utilisateur connecté (nécessite token JWT).

**Headers** :
```
Authorization: Bearer <token>
```

### Employés

- `GET /api/employees` - Liste des employés (RH uniquement)
- `GET /api/employees/{id}` - Détails d'un employé
- `POST /api/employees` - Créer un employé (RH uniquement)
- `PUT /api/employees/{id}` - Modifier un employé (RH uniquement)
- `DELETE /api/employees/{id}` - Supprimer un employé (RH uniquement)

### EVP Submissions

- `GET /api/evp/submissions` - Liste des soumissions (filtrées par rôle)
- `POST /api/evp/submissions` - Créer une soumission (Gestionnaire)
- `PUT /api/evp/submissions/{id}` - Modifier une soumission
- `DELETE /api/evp/submissions/{id}` - Supprimer une soumission
- `POST /api/evp/submissions/{id}/validate` - Valider/rejeter (Responsables)

### Utilisateurs

- `GET /api/users` - Liste des utilisateurs (Admin uniquement)
- `POST /api/users` - Créer un utilisateur (Admin uniquement)
- `PUT /api/users/{id}` - Modifier un utilisateur (Admin uniquement)
- `DELETE /api/users/{id}` - Supprimer un utilisateur (Admin uniquement)

### Demandes d'employés

- `GET /api/employee-requests` - Liste des demandes (RH uniquement)
- `POST /api/employee-requests` - Créer une demande (Gestionnaire)
- `PUT /api/employee-requests/{id}/process` - Traiter une demande (RH uniquement)

## 📁 Structure du projet

```
CollectEVP Front/
├── backend/                    # Backend Symfony
│   ├── bin/
│   │   └── console            # Console Symfony
│   ├── config/                 # Configuration Symfony
│   │   ├── packages/          # Configuration des bundles
│   │   └── jwt/               # Clés JWT
│   ├── migrations/            # Migrations Doctrine
│   ├── public/
│   │   └── index.php          # Point d'entrée web
│   ├── src/
│   │   ├── Controller/        # Contrôleurs API
│   │   ├── Entity/            # Entités Doctrine
│   │   ├── Repository/        # Repositories
│   │   ├── DataFixtures/      # Données de test
│   │   └── Security/          # Sécurité
│   ├── var/
│   │   ├── data.db            # Base de données SQLite
│   │   ├── cache/             # Cache Symfony
│   │   └── log/               # Logs
│   └── vendor/                # Dépendances Composer
├── src/                        # Frontend React
│   ├── components/            # Composants React
│   │   ├── ui/                # Composants UI (shadcn/ui)
│   │   ├── AdminPage.tsx
│   │   ├── GestionnaireHomePage.tsx
│   │   ├── ResponsableServicePage.tsx
│   │   ├── ResponsableDivisionPage.tsx
│   │   ├── RHPage.tsx
│   │   └── ...
│   ├── services/
│   │   └── api.ts             # Client API
│   ├── App.tsx                # Composant principal
│   └── main.tsx               # Point d'entrée
├── package.json               # Dépendances npm
├── vite.config.ts            # Configuration Vite
└── README.md                  # Ce fichier
```

## 🛠️ Développement

### Commandes Backend utiles

```bash
# Créer une migration
php bin/console make:migration

# Exécuter les migrations
php bin/console doctrine:migrations:migrate

# Vider le cache
php bin/console cache:clear

# Charger les fixtures
php bin/console doctrine:fixtures:load

# Vider les tables (sauf employees et users)
powershell -File clear_tables_except_employees_and_users.ps1
```

### Commandes Frontend utiles

```bash
# Développement
npm run dev

# Build de production
npm run build

# Prévisualiser le build
npm run preview

# Linter
npm run lint
```

### Accès à la base de données

```bash
# Ouvrir SQLite
sqlite3 backend/var/data.db

# Requête via Doctrine
php bin/console doctrine:query:sql "SELECT * FROM users"
```

## 🔧 Dépannage

### Erreur : "could not find driver"

Vérifiez que l'extension SQLite est activée dans PHP :

```bash
php -m | grep sqlite
```

Si absent, activez l'extension dans `php.ini` :
```ini
extension=pdo_sqlite
extension=sqlite3
```

### Erreur : "JWT keys not found"

Générez les clés JWT :
```bash
cd backend
php bin/console lexik:jwt:generate-keypair
```

### Erreur : "Port 8080 already in use"

Modifiez le port dans la commande de démarrage :
```bash
php -S 127.0.0.1:8081 -t public
```

Et mettez à jour l'URL dans `src/services/api.ts`.

### Erreur CORS

Vérifiez la configuration CORS dans `backend/config/packages/cors.yaml` et assurez-vous que l'URL du frontend est autorisée.

### Réinitialiser la base de données

```bash
cd backend
# Supprimer la base de données
rm var/data.db

# Recréer et migrer
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate --no-interaction
php bin/console doctrine:fixtures:load --no-interaction
```

## 📝 Notes importantes

- Tous les mots de passe de test sont : `password123`
- L'API utilise l'authentification JWT stateless
- Les tokens JWT expirent après 1 heure (configurable)
- La base de données SQLite est stockée dans `backend/var/data.db`
- Les logs sont disponibles dans `backend/var/log/dev.log`

## 📦 Guide de déploiement pour l'encadrant

### Fichiers exclus du ZIP

Les fichiers suivants sont **volumineux** et **exclus du ZIP**. Ils seront réinstallés automatiquement :

| Fichier/Dossier | Taille estimée | Réinstallation |
|----------------|----------------|----------------|
| `node_modules/` | ~200-500 MB | `npm install` |
| `backend/vendor/` | ~50-100 MB | `composer install` |
| `build/` | ~5-10 MB | `npm run build` |
| `backend/var/cache/` | Variable | Régénéré automatiquement |
| `backend/var/log/` | Variable | Régénéré automatiquement |
| `backend/var/data.db` | Variable | Recréé avec migrations |

### Étapes de déploiement complètes

1. **Extraire le ZIP** dans un dossier (ex: `C:\CollectEVP`)

2. **Installer les dépendances Backend** :
   ```bash
   cd backend
   composer install
   ```
   ⏱️ Temps estimé : 2-3 minutes

3. **Configurer l'environnement** :
   - Créer `backend/.env.local` à partir de `backend/.env`
   - Vérifier que `DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"`

4. **Générer les clés JWT** :
   ```bash
   cd backend
   php bin/console lexik:jwt:generate-keypair
   ```
   ⏱️ Temps estimé : 10 secondes

5. **Créer et initialiser la base de données** :
   ```bash
   php bin/console doctrine:database:create --if-not-exists
   php bin/console doctrine:migrations:migrate --no-interaction
   php bin/console doctrine:fixtures:load --no-interaction
   ```
   ⏱️ Temps estimé : 30 secondes

6. **Installer les dépendances Frontend** :
   ```bash
   cd ..  # Retourner à la racine
   npm install
   ```
   ⏱️ Temps estimé : 3-5 minutes

7. **Démarrer les serveurs** :
   
   **Terminal 1 - Backend** :
   ```bash
   cd backend
   php -S 127.0.0.1:8080 -t public
   ```
   
   **Terminal 2 - Frontend** :
   ```bash
   npm run dev
   ```

8. **Accéder à l'application** :
   - **Frontend** : http://localhost:5173
   - **API Backend** : http://127.0.0.1:8080/api

### Vérification rapide

Testez l'API avec PowerShell :
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"gestionnaire@ocp.ma","password":"password123"}'
```

**Résultat attendu** : Un JSON avec un `token` et les informations de l'utilisateur.

### Temps d'installation total estimé

- Installation dépendances : 5-8 minutes
- Configuration : 2-3 minutes
- **Total : ~10-15 minutes**

### Commandes PowerShell pour créer le ZIP (optionnel)

Si vous devez recréer le ZIP, utilisez cette commande :

```powershell
Compress-Archive -Path * `
  -Exclude @('node_modules', 'backend\vendor', 'build', 'backend\var\cache', 'backend\var\log', 'backend\var\data.db', '.git', '.zipignore') `
  -DestinationPath "CollectEVP_Projet.zip" `
  -Force
```

## 📄 Licence

Projet développé pour OCP Safi - Usage interne.

## 👨‍💻 Support

Pour toute question ou problème, consultez la documentation backend dans `backend/README.md`.
