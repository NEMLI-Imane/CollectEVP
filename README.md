# CollectEVP - Système de Gestion des Éléments Variables de Paie

**Application Web Full-Stack pour la Gestion des Éléments Variables de Paie**

*Projet académique - EMINES CI1A*

## 📖 Description

**CollectEVP** est une application web complète pour la gestion des Éléments Variables de Paie (EVP) chez OCP Safi. Le système permet la saisie, la validation hiérarchique et le suivi des primes et congés avec un workflow à 5 niveaux d'approbation.

### Fonctionnalités

- **Gestion des EVP** : Saisie de primes et congés avec suivi en temps réel
- **Validation hiérarchique** : 5 niveaux (Gestionnaire → Responsable Service → Responsable Division → RH → Admin)
- **Gestion des employés** : CRUD complet avec système de demandes
- **Reporting** : Tableaux de bord et statistiques par division

## 🛠️ Technologies

| Catégorie | Technologies |
|-----------|-------------|
| **Frontend** | React 18.3.1, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Backend** | Symfony 6.4, PHP 8.2+ |
| **Base de données** | SQLite 3 |
| **Authentification** | JWT (LexikJWTAuthenticationBundle) |
| **ORM** | Doctrine ORM |

## 📦 Prérequis

- **PHP** 8.2+ avec extensions : PDO, SQLite3, OpenSSL, JSON
- **Composer** 2.x
- **Node.js** 18+ et npm

## 🚀 Installation et Déploiement

> **⚠️ IMPORTANT** : Le projet est complet sur Git, mais `node_modules/` et `backend/vendor/` ne sont pas inclus (seront réinstallés). Suivez les étapes ci-dessous dans l'ordre.

### 1. Cloner le projet

```bash
git clone <url-du-depot>
cd "CollectEVP Front"
```

### 2. Backend - Installation et configuration

```bash
cd backend

# Installer les dépendances PHP (backend/vendor/ n'est pas dans le dépôt)
composer install
```

**⏱️ Temps : 2-3 minutes**

```bash
# Créer le fichier .env.local (fichier de configuration local)
cp .env .env.local
```

Si le fichier `.env` n'existe pas, créez `backend/.env.local` avec :

```env
APP_ENV=dev
APP_SECRET=collectevp-secret-key-2025-ocp-safi
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"
```

```bash
# Générer les clés JWT (nécessaires pour l'authentification)
php bin/console lexik:jwt:generate-keypair

# Créer la base de données SQLite et charger les données de test
php bin/console doctrine:database:create --if-not-exists
php bin/console doctrine:migrations:migrate --no-interaction
php bin/console doctrine:fixtures:load --no-interaction
```

**⏱️ Temps : 30 secondes**

> **✅ Note** : La commande `doctrine:fixtures:load` crée automatiquement les 5 utilisateurs de test et 24 employés de test (voir section "Comptes de test").

### 3. Frontend - Installation

```bash
# Retourner à la racine du projet
cd ..

# Installer les dépendances Node.js (node_modules/ n'est pas dans le dépôt)
npm install
```

**⏱️ Temps : 3-5 minutes**

### 4. Démarrage de l'application

Ouvrez **deux terminaux** :

**Terminal 1 - Backend** :
```bash
cd backend
php -S 127.0.0.1:8080 -t public
```

**Terminal 2 - Frontend** :
```bash
npm run dev
```

### 5. Accéder à l'application

Une fois les deux serveurs démarrés, accédez à :

- **Frontend** : http://localhost:5173
- **API Backend** : http://127.0.0.1:8080/api

**⏱️ Temps d'installation total : ~10-15 minutes**

## 👥 Comptes de test

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| gestionnaire@ocp.ma | password123 | Gestionnaire |
| responsable.service@ocp.ma | password123 | Responsable Service |
| responsable.division@ocp.ma | password123 | Responsable Division |
| rh@ocp.ma | password123 | RH |
| admin@ocp.ma | password123 | Administrateur |

## 🔐 Rôles et permissions

- **Gestionnaire** : Saisie et soumission des EVP
- **Responsable Service** : Validation niveau service
- **Responsable Division** : Validation niveau division
- **RH** : Gestion des employés et reporting global
- **Administrateur** : Gestion des utilisateurs et configuration

## 📡 API Principale

- `POST /api/login` - Authentification
- `GET /api/evp/submissions` - Liste des soumissions
- `POST /api/evp/submissions` - Créer une soumission
- `POST /api/evp/submissions/{id}/validate` - Valider/rejeter
- `GET /api/employees` - Liste des employés (RH)
- `GET /api/users` - Liste des utilisateurs (Admin)

## 🔧 Dépannage

**Erreur "could not find driver"** : Activez l'extension SQLite dans `php.ini` :
```ini
extension=pdo_sqlite
extension=sqlite3
```

**Erreur "JWT keys not found"** :
```bash
cd backend
php bin/console lexik:jwt:generate-keypair
```

**Port 8080 déjà utilisé** : Changez le port dans la commande de démarrage et mettez à jour l'URL dans `src/services/api.ts`.

## 📦 Structure du projet

```
CollectEVP Front/
├── backend/          # Backend Symfony
│   ├── src/         # Contrôleurs, Entités, Repositories
│   ├── config/      # Configuration
│   └── migrations/  # Migrations Doctrine
├── src/             # Frontend React
│   ├── components/  # Composants React
│   └── services/    # Client API
└── package.json     # Dépendances npm
```

## 🎓 Informations Académiques

**Projet** : CollectEVP - Système de Gestion des Éléments Variables de Paie  
**Institution** : EMINES CI1A  
**Type** : Projet académique - Application Web Full-Stack  
**Année** : 2024-2025
