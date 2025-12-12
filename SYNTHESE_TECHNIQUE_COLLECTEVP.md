# 📊 Synthèse Technique Complète - CollectEVP

## Vue d'ensemble du Projet

**CollectEVP** est une application web moderne développée pour OCP Safi qui digitalise et automatise l'ensemble du processus de collecte, validation et traitement des **Éléments Variables de la Paie (EVP)**. L'application suit une **logique de validation hiérarchique à 5 niveaux** (Gestionnaire → Responsable Service → Responsable Division → RH → Administrateur).

**Stack Technique :**
- **Frontend** : React 18.3.1 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend** : PHP 8.2 + Symfony 6.4 + Doctrine ORM
- **Base de données** : PostgreSQL 15
- **Conteneurisation** : Docker + Docker Compose
- **Authentification** : JWT (LexikJWTAuthenticationBundle)
- **API** : RESTful JSON

---

## 1. 📐 Diagramme UML - Diagramme de Classes

### Entités Principales et Relations

```
┌─────────────────────────────────────────────────────────────────┐
│                         DIAGRAMME DE CLASSES                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│        User           │
├──────────────────────┤
│ - id: int            │
│ - email: string      │
│ - password: string   │
│ - name: string       │
│ - role: string       │◄─────┐
│ - division: string  │       │
│ - roles: array       │       │
│ - isActive: bool     │       │
│ - createdAt: DateTime│      │
│ - updatedAt: DateTime│      │
└──────────────────────┘      │
         │                     │
         │ 1                   │
         │                     │
         │ *                   │
         │                     │
┌────────▼──────────────┐      │
│   EVPSubmission       │      │
├──────────────────────┤      │
│ - id: int            │      │
│ - type: string       │      │
│ - montantCalcule: decimal│   │
│ - statut: string     │      │
│ - submittedBy: User  │──────┘
│ - employee: Employee │──┐
│ - submittedAt: DateTime│ │
│ - validatedAt: DateTime│ │
│ - commentaire: text  │  │
│                      │  │
│ (Prime fields)       │  │
│ - tauxMonetaire      │  │
│ - groupe             │  │
│ - nombrePostes       │  │
│ - scoreEquipe        │  │
│ - noteHierarchique   │  │
│ - scoreCollectif     │  │
│                      │  │
│ (Congé fields)       │  │
│ - dateDebut          │  │
│ - dateFin            │  │
│ - nombreJours        │  │
│ - tranche            │  │
│ - avanceSurConge     │  │
│ - montantAvance      │  │
│ - indemniteForfaitaire│ │
└──────────────────────┘  │
         │ 1               │
         │                 │
         │ *               │
         │                 │
┌────────▼──────────────┐  │
│  ValidationHistory    │  │
├──────────────────────┤  │
│ - id: int            │  │
│ - evpSubmission: EVP │──┘
│ - validatedBy: User  │──┐
│ - action: string     │  │
│ - niveau: string     │  │
│ - commentaire: text  │  │
│ - validatedAt: DateTime│ │
└──────────────────────┘  │
                          │
┌──────────────────────┐  │
│      Employee        │  │
├──────────────────────┤  │
│ - id: int            │  │
│ - matricule: string  │  │
│ - nom: string        │  │
│ - prenom: string     │  │
│ - poste: string      │  │
│ - service: string    │  │
│ - division: string   │  │
│ - createdAt: DateTime│  │
│ - updatedAt: DateTime│  │
│                      │  │
│ + evpSubmissions: Collection│
└──────────────────────┘  │
                          │
┌──────────────────────┐  │
│   MonthlyBudget      │  │
├──────────────────────┤  │
│ - id: int            │  │
│ - division: string   │  │
│ - month: int         │  │
│ - year: int          │  │
│ - montantPrevu: decimal│ │
│ - montantRealise: decimal│
│ - statut: string     │  │
│ - createdAt: DateTime│  │
│ - updatedAt: DateTime│  │
└──────────────────────┘  │
                          │
```

### Relations Détaillées

1. **User ↔ EVPSubmission** : Relation Many-to-One
   - Un `User` peut soumettre plusieurs `EVPSubmission` (via `submittedBy`)
   - Un `EVPSubmission` est soumis par un seul `User`

2. **User ↔ ValidationHistory** : Relation Many-to-One
   - Un `User` peut valider plusieurs `EVPSubmission` (via `validatedBy`)
   - Une `ValidationHistory` est créée par un seul `User`

3. **Employee ↔ EVPSubmission** : Relation One-to-Many
   - Un `Employee` peut avoir plusieurs `EVPSubmission`
   - Un `EVPSubmission` est lié à un seul `Employee`

4. **EVPSubmission ↔ ValidationHistory** : Relation One-to-Many
   - Un `EVPSubmission` peut avoir plusieurs `ValidationHistory` (une par niveau de validation)
   - Une `ValidationHistory` est liée à un seul `EVPSubmission`

---

## 2. 🏗️ Architecture Complète - Communication entre Conteneurs

### Schéma d'Architecture Docker

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE DOCKER                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                       │
│  Port: 5173 (dev) | 3000 (prod)                               │
│  - src/App.tsx                                                │
│  - src/services/api.ts                                        │
│  - src/components/*                                           │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            │ (fetch API)
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy)                      │
│  Container: collectevp_nginx                                 │
│  Port: 8080:80                                                │
│  - Route /api/* → PHP-FPM                                     │
│  - CORS Headers (Access-Control-Allow-Origin: *)              │
│  - Static files (si nécessaire)                               │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ FastCGI
                            │ (port 9000)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    PHP-FPM (Symfony)                           │
│  Container: collectevp_php                                   │
│  Working Dir: /var/www/html                                   │
│  - Symfony Kernel                                            │
│  - Controllers (AuthController, EVPController, etc.)         │
│  - Entities (User, Employee, EVPSubmission, etc.)            │
│  - Security (JWT Authentication)                             │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ PDO/Doctrine
                            │ (port 5432)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    POSTGRESQL (Database)                      │
│  Container: collectevp_postgres                               │
│  Port: 5432:5432                                              │
│  Database: collectevp_db                                      │
│  User: collectevp_user                                       │
│  - Tables: users, employees, evp_submissions,                │
│            validation_history, monthly_budgets                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    RÉSEAU DOCKER                               │
│  Network: collectevp_network (bridge)                         │
│  - Communication inter-conteneurs par nom de service          │
│  - Exemple: php → postgres:5432                               │
└──────────────────────────────────────────────────────────────┘
```

### Flux de Communication

#### 1. **Authentification (Login)**

```
Frontend (React)
    │
    │ POST /api/login
    │ { email, password }
    │
    ▼
Nginx (Port 8080)
    │
    │ FastCGI
    │
    ▼
PHP-FPM (Symfony)
    │
    │ 1. Security Firewall (json_login)
    │ 2. UserProvider (app_user_provider)
    │ 3. Password Verification
    │ 4. JWT Token Generation
    │ 5. JWTAuthenticationSuccessHandler
    │
    ▼
Response JSON
    {
      "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
      "user": {
        "id": 1,
        "email": "gestionnaire@ocp.ma",
        "name": "Gestionnaire",
        "role": "Gestionnaire",
        "division": "Production"
      }
    }
    │
    ▼
Frontend
    │
    │ - Stocke token dans localStorage
    │ - Stocke user dans state (currentUser)
    │ - Redirige vers page selon rôle
```

#### 2. **Requête API Authentifiée**

```
Frontend (React)
    │
    │ GET /api/me
    │ Headers: { Authorization: "Bearer <token>" }
    │
    ▼
Nginx
    │
    │ FastCGI
    │
    ▼
PHP-FPM (Symfony)
    │
    │ 1. Security Firewall (api)
    │ 2. JWT Token Validation (Lexik JWT)
    │ 3. User Extraction from Token
    │ 4. Controller Action
    │
    ▼
PostgreSQL
    │
    │ SELECT * FROM users WHERE email = ?
    │
    ▼
Response JSON
    {
      "id": 1,
      "email": "gestionnaire@ocp.ma",
      "name": "Gestionnaire",
      "role": "Gestionnaire",
      "division": "Production"
    }
```

#### 3. **Soumission EVP**

```
Frontend (Gestionnaire)
    │
    │ POST /api/evp/submit
    │ Headers: { Authorization: "Bearer <token>" }
    │ Body: { employeeId, type, ... }
    │
    ▼
PHP-FPM
    │
    │ 1. JWT Authentication
    │ 2. Role Check (ROLE_GESTIONNAIRE)
    │ 3. EVPController::submit()
    │ 4. Calcul montant (formules Prime/Congé)
    │ 5. Doctrine Persist
    │
    ▼
PostgreSQL
    │
    │ INSERT INTO evp_submissions (...)
    │
    ▼
Response JSON
    {
      "id": 123,
      "statut": "En attente",
      "montantCalcule": "1500.00"
    }
```

---

## 3. 📁 Dossiers et Fichiers Critiques du Frontend (React/TypeScript)

### Structure du Dossier `src/`

```
src/
├── App.tsx                    # Point d'entrée principal
├── services/
│   └── api.ts                 # Service API (authentification, requêtes)
├── components/
│   ├── LoginPage.tsx          # Page de connexion
│   ├── GestionnaireHomePage.tsx
│   ├── ResponsableServicePage.tsx
│   ├── ResponsableDivisionPage.tsx
│   ├── RHPage.tsx
│   └── AdminPage.tsx
└── components/ui/             # Composants shadcn/ui
```

### 3.1. `src/App.tsx` - Point d'Entrée Principal

**Rôle :** Orchestre l'authentification et le routage basé sur les rôles.

**Fonctionnalités clés :**

```typescript
// 1. État de l'authentification
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [currentUser, setCurrentUser] = useState<User | null>(null);

// 2. Vérification au chargement (token existant)
useEffect(() => {
  const token = getToken();
  if (token) {
    const user = await getCurrentUser(); // Appel API /api/me
    setCurrentUser(user);
    setIsAuthenticated(true);
  }
}, []);

// 3. Gestion de la connexion
const handleLogin = async (email: string, password: string) => {
  const response = await login(email, password); // Appel API /api/login
  setCurrentUser(response.user);
  setIsAuthenticated(true);
};

// 4. Routage basé sur le rôle
const renderRoleBasedView = () => {
  switch (currentUser?.role) {
    case 'Gestionnaire':
      return <GestionnaireHomePage user={currentUser} />;
    case 'Responsable Service':
      return <ResponsableServicePage user={currentUser} />;
    // ... autres rôles
  }
};
```

**Transition Mock → Réel :**
- **Avant** : Validation côté client avec données hardcodées
- **Après** : Appels API réels (`login()`, `getCurrentUser()`) avec gestion des tokens JWT

### 3.2. `src/services/api.ts` - Service API

**Rôle :** Centralise toutes les communications avec le backend Symfony.

**Fonctionnalités clés :**

```typescript
// 1. Configuration
const API_URL = 'http://localhost:8080/api';

// 2. Gestion du token JWT
export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// 3. Fonction de connexion
export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  setToken(data.token); // Stocke le token
  return data; // { token, user }
};

// 4. Requêtes authentifiées
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
  
  return fetch(`${API_URL}${endpoint}`, { ...options, headers });
};

// 5. Récupération de l'utilisateur connecté
export const getCurrentUser = async () => {
  const response = await apiRequest('/me');
  return response.json();
};
```

**Gestion des erreurs :**
- Timeout de 10 secondes
- Messages d'erreur spécifiques (`ERR_CONNECTION_REFUSED`, `401`, `404`)
- Gestion CORS

### 3.3. `package.json` - Dépendances Frontend

**Dépendances principales :**

```json
{
  "dependencies": {
    "react": "^18.3.1",              // Framework UI
    "react-dom": "^18.3.1",          // Rendu DOM
    "vite": "6.3.5",                  // Build tool
    "tailwindcss": "*",               // CSS framework
    "sonner": "^2.0.3",              // Toast notifications
    "lucide-react": "^0.487.0",     // Icônes
    "recharts": "^2.15.2",           // Graphiques
    "date-fns": "*",                  // Manipulation dates
    "@radix-ui/*": "..."              // Composants UI (shadcn)
  }
}
```

**Scripts :**
- `npm run dev` : Démarre le serveur de développement (Vite)
- `npm run build` : Compile pour la production

---

## 4. 📁 Dossiers et Fichiers Critiques du Backend (Symfony/PHP)

### Structure du Dossier `backend/`

```
backend/
├── config/
│   ├── bundles.php                    # Activation des bundles
│   ├── packages/
│   │   ├── security.yaml              # Configuration sécurité (5 rôles)
│   │   ├── lexik_jwt_authentication.yaml
│   │   ├── doctrine.yaml              # Configuration BDD
│   │   └── framework.yaml
│   └── routes.yaml
├── src/
│   ├── Entity/
│   │   ├── User.php                   # Entité utilisateur
│   │   ├── Employee.php               # Entité employé
│   │   ├── EVPSubmission.php          # Entité soumission EVP
│   │   ├── ValidationHistory.php     # Entité historique validation
│   │   └── MonthlyBudget.php          # Entité budget mensuel
│   ├── Controller/
│   │   ├── AuthController.php         # Endpoints authentification
│   │   ├── EVPController.php         # Endpoints EVP
│   │   └── EmployeeController.php    # Endpoints employés
│   ├── Security/
│   │   └── JWTAuthenticationSuccessHandler.php
│   └── DataFixtures/
│       ├── UserFixtures.php           # Utilisateurs de test
│       └── EmployeeFixtures.php      # Employés de test
├── public/
│   └── index.php                      # Point d'entrée Symfony
├── Dockerfile                         # Image PHP-FPM
├── nginx.conf                         # Configuration Nginx
└── composer.json                      # Dépendances PHP
```

### 4.1. `docker-compose.yml` - Orchestration des Services

**Rôle des 3 services :**

```yaml
services:
  # 1. POSTGRESQL - Base de données
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: collectevp_db
      POSTGRES_USER: collectevp_user
      POSTGRES_PASSWORD: collectevp_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U collectevp_user"]
    # Rôle : Stockage persistant des données (users, employees, evp_submissions)

  # 2. PHP-FPM - Application Symfony
  php:
    build:
      context: ./backend
      dockerfile: Dockerfile
    volumes:
      - ./backend:/var/www/html
    working_dir: /var/www/html
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: "postgresql://collectevp_user:collectevp_password@postgres:5432/collectevp_db"
    # Rôle : Exécution de Symfony, traitement des requêtes API, logique métier

  # 3. NGINX - Reverse Proxy / Serveur Web
  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./backend:/var/www/html
      - ./backend/nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - php
    # Rôle : 
    # - Routage des requêtes /api/* vers PHP-FPM (FastCGI)
    # - Gestion des headers CORS
    # - Servir les fichiers statiques (si nécessaire)
```

**Communication inter-conteneurs :**
- Réseau Docker : `collectevp_network` (bridge)
- PHP → PostgreSQL : `postgres:5432` (nom de service)
- Nginx → PHP : `php:9000` (FastCGI)

### 4.2. `backend/config/bundles.php` - Activation des Bundles

**Rôle :** Définit quels bundles Symfony sont activés dans l'application.

```php
return [
    Symfony\Bundle\FrameworkBundle\FrameworkBundle::class => ['all' => true],
    Nelmio\CorsBundle\NelmioCorsBundle::class => ['all' => true],  // CORS
    Doctrine\Bundle\DoctrineBundle\DoctrineBundle::class => ['all' => true],
    Doctrine\Bundle\MigrationsBundle\DoctrineMigrationsBundle::class => ['all' => true],
    Symfony\Bundle\SecurityBundle\SecurityBundle::class => ['all' => true],
    Lexik\Bundle\JWTAuthenticationBundle\LexikJWTAuthenticationBundle::class => ['all' => true],
    Doctrine\Bundle\FixturesBundle\DoctrineFixturesBundle::class => ['dev' => true],
    Symfony\Bundle\MakerBundle\MakerBundle::class => ['dev' => true],
];
```

**Signification de l'activation manuelle de CORS :**
- **NelmioCorsBundle** : Gère les headers CORS automatiquement
- **Alternative** : Headers CORS configurés directement dans `nginx.conf` (méthode actuelle)
- **Raison** : Plus de contrôle sur les headers, pas de dépendance supplémentaire

### 4.3. `backend/config/packages/security.yaml` - Configuration Sécurité

**Rôle des 5 rôles :**

```yaml
security:
    providers:
        app_user_provider:
            entity:
                class: App\Entity\User
                property: email  # Identification par email

    firewalls:
        login:
            pattern: ^/api/login
            stateless: true
            json_login:
                check_path: /api/login
                username_path: email
                password_path: password
                success_handler: App\Security\JWTAuthenticationSuccessHandler
                failure_handler: lexik_jwt_authentication.handler.authentication_failure

        api:
            pattern: ^/api
            stateless: true
            jwt: ~  # Validation JWT pour toutes les routes /api/*

    access_control:
        - { path: ^/api/login, roles: PUBLIC_ACCESS }
        - { path: ^/api, roles: IS_AUTHENTICATED_FULLY }
```

**Mapping des rôles (dans `User.php`) :**

```php
public function getRoles(): array
{
    $roleMap = [
        'Gestionnaire' => 'ROLE_GESTIONNAIRE',
        'Responsable Service' => 'ROLE_RESPONSABLE_SERVICE',
        'Responsable Division' => 'ROLE_RESPONSABLE_DIVISION',
        'RH' => 'ROLE_RH',
        'Administrateur' => 'ROLE_ADMIN',
    ];
    return array_unique([...$roles, $roleMap[$this->role] ?? 'ROLE_USER']);
}
```

**Hiérarchie des rôles :**
1. **ROLE_GESTIONNAIRE** : Saisie EVP, soumission
2. **ROLE_RESPONSABLE_SERVICE** : Validation niveau Service
3. **ROLE_RESPONSABLE_DIVISION** : Validation niveau Division, gestion budget
4. **ROLE_RH** : Gestion employés, export Oracle, reporting global
5. **ROLE_ADMIN** : Gestion utilisateurs, configuration système

### 4.4. `backend/src/Entity/*` - Classes d'Entité Doctrine

#### **User.php**
- **Rôle** : Représente un utilisateur système (5 types de rôles)
- **Implémente** : `UserInterface`, `PasswordAuthenticatedUserInterface`
- **Champs clés** : `email`, `password` (hashé), `role`, `division`, `roles` (array Symfony)
- **Relations** : Many-to-One avec `EVPSubmission` (submittedBy), Many-to-One avec `ValidationHistory` (validatedBy)

#### **Employee.php**
- **Rôle** : Représente un employé OCP (matricule, nom, prénom, poste, service, division)
- **Relations** : One-to-Many avec `EVPSubmission`
- **Contrainte** : `matricule` unique

#### **EVPSubmission.php**
- **Rôle** : Représente une soumission EVP (Prime, Congé, Heures Sup, Absence)
- **Champs conditionnels** :
  - **Prime** : `tauxMonetaire`, `groupe`, `nombrePostes`, `scoreEquipe`, `noteHierarchique`, `scoreCollectif`
  - **Congé** : `dateDebut`, `dateFin`, `nombreJours`, `tranche`, `avanceSurConge`, `montantAvance`, `indemniteForfaitaire`
- **Champs calculés** : `montantCalcule`, `indemniteCalculee`
- **Statut** : `En attente` → `Validé Service` → `Validé Division` → `Approuvé RH` → `Rejeté`
- **Relations** : Many-to-One avec `Employee`, Many-to-One avec `User` (submittedBy), One-to-Many avec `ValidationHistory`

#### **ValidationHistory.php**
- **Rôle** : Historique des validations/rejets à chaque niveau
- **Champs** : `action` (Validé/Rejeté/Approuvé), `niveau` (Service/Division/RH), `commentaire`, `validatedAt`
- **Relations** : Many-to-One avec `EVPSubmission`, Many-to-One avec `User` (validatedBy)

#### **MonthlyBudget.php**
- **Rôle** : Budget mensuel par division
- **Champs** : `division`, `month`, `year`, `montantPrevu`, `montantRealise`, `statut`
- **Méthodes** : `getEcart()`, `getEcartPourcentage()`

---

## 5. 🔐 Fichiers de Liaison / Sécurité - Authentification JWT

### 5.1. Endpoint de Connexion : `/api/login`

**Configuration dans `security.yaml` :**

```yaml
firewalls:
    login:
        pattern: ^/api/login
        stateless: true
        json_login:
            check_path: /api/login
            username_path: email
            password_path: password
            success_handler: App\Security\JWTAuthenticationSuccessHandler
```

**Flux d'authentification :**

```
1. Frontend envoie POST /api/login
   {
     "email": "gestionnaire@ocp.ma",
     "password": "password123"
   }

2. Symfony Security intercepte la requête
   - Firewall "login" correspond au pattern ^/api/login
   - json_login active le mécanisme d'authentification JSON

3. UserProvider (app_user_provider)
   - Charge l'utilisateur depuis la BDD via email
   - Vérifie le mot de passe (hash bcrypt)

4. Si succès → JWTAuthenticationSuccessHandler
   - Génère un token JWT via LexikJWTAuthenticationBundle
   - Retourne JSON avec token + données utilisateur

5. Si échec → lexik_jwt_authentication.handler.authentication_failure
   - Retourne 401 avec message d'erreur
```

### 5.2. `backend/src/Security/JWTAuthenticationSuccessHandler.php`

**Rôle :** Personnalise la réponse après authentification réussie.

```php
public function onAuthenticationSuccess(Request $request, TokenInterface $token): JsonResponse
{
    $user = $token->getUser();
    
    if (!$user instanceof User) {
        return new JsonResponse(['error' => 'Invalid user'], 401);
    }

    // Génération du token JWT
    $jwtToken = $this->jwtManager->create($user);

    // Retourne token + données utilisateur
    return new JsonResponse([
        'token' => $jwtToken,
        'user' => [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'role' => $user->getRole(),        // 'Gestionnaire', 'RH', etc.
            'division' => $user->getDivision(),
        ],
    ]);
}
```

**Pourquoi un handler personnalisé ?**
- Le handler par défaut de Lexik JWT retourne uniquement le token
- Le frontend a besoin des données utilisateur (role, division) pour le routage
- Évite un appel API supplémentaire (`/api/me`) juste après le login

### 5.3. Validation JWT pour les Requêtes Authentifiées

**Configuration dans `security.yaml` :**

```yaml
firewalls:
    api:
        pattern: ^/api
        stateless: true
        jwt: ~  # Active la validation JWT
```

**Flux de validation :**

```
1. Frontend envoie requête authentifiée
   GET /api/me
   Headers: { Authorization: "Bearer <token>" }

2. Symfony Security intercepte
   - Firewall "api" correspond au pattern ^/api
   - jwt: ~ active le JWTTokenAuthenticator

3. LexikJWTAuthenticationBundle
   - Extrait le token du header Authorization
   - Valide la signature (clés publique/privée)
   - Vérifie l'expiration (JWT_TTL)
   - Extrait l'email depuis le token (user_id_claim: email)

4. UserProvider charge l'utilisateur
   - SELECT * FROM users WHERE email = ?

5. Token d'authentification créé
   - Contient l'utilisateur et ses rôles
   - Disponible dans le contrôleur via $this->getUser()

6. Contrôleur retourne les données
   return $this->json($this->getUser());
```

### 5.4. Configuration JWT dans `lexik_jwt_authentication.yaml`

```yaml
lexik_jwt_authentication:
    secret_key: '%env(resolve:JWT_SECRET_KEY)%'      # Clé privée (RS256)
    public_key: '%env(resolve:JWT_PUBLIC_KEY)%'       # Clé publique (RS256)
    pass_phrase: '%env(JWT_PASSPHRASE)%'             # Passphrase pour la clé privée
    token_ttl: '%env(int:JWT_TTL)%'                   # Durée de vie (3600s = 1h)
    user_id_claim: email                              # Claim utilisé pour identifier l'utilisateur
```

**Génération des clés :**
```bash
php bin/console lexik:jwt:generate-keypair
```

---

## 6. 🔄 Transition : Authentification Mockée → Authentification Réelle

### Avant (Mock)

**Dans `App.tsx` (ancienne version) :**

```typescript
const handleLogin = (email: string, password: string) => {
  // Validation côté client
  const mockUsers = {
    'gestionnaire@ocp.ma': { role: 'Gestionnaire', name: 'Gestionnaire' },
    'rh@ocp.ma': { role: 'RH', name: 'RH' },
    // ...
  };
  
  if (mockUsers[email]) {
    setCurrentUser(mockUsers[email]);
    setIsAuthenticated(true);
  }
};
```

**Problèmes :**
- Aucune vérification réelle du mot de passe
- Pas de persistance (perte au rafraîchissement)
- Pas de sécurité (validation côté client uniquement)

### Après (Réel)

**Dans `App.tsx` (version actuelle) :**

```typescript
const handleLogin = async (email: string, password: string) => {
  // Appel API réel
  const response = await login(email, password);
  
  // Stockage du token
  setToken(response.token);
  
  // Stockage des données utilisateur
  setCurrentUser({
    name: response.user.name,
    email: response.user.email,
    role: response.user.role,
    division: response.user.division,
  });
  
  setIsAuthenticated(true);
};
```

**Dans `src/services/api.ts` :**

```typescript
export const login = async (email: string, password: string) => {
  const response = await fetch('http://localhost:8080/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  setToken(data.token);  // Stocke dans localStorage
  return data;
};
```

**Avantages :**
- ✅ Vérification réelle du mot de passe (hash bcrypt)
- ✅ Token JWT sécurisé (signature RSA, expiration)
- ✅ Persistance via localStorage
- ✅ Validation côté serveur (sécurité)
- ✅ Rôles basés sur la base de données

### Persistance de Session

**Au chargement de l'application :**

```typescript
useEffect(() => {
  const token = getToken();
  if (token) {
    // Vérifie si le token est valide
    getCurrentUser()
      .then(user => {
        setCurrentUser(user);
        setIsAuthenticated(true);
      })
      .catch(() => {
        // Token invalide, déconnexion
        removeToken();
      });
  }
}, []);
```

**Flux complet :**

```
1. Utilisateur se connecte
   → Token JWT stocké dans localStorage

2. Page rafraîchie
   → useEffect vérifie le token
   → Appel /api/me pour récupérer l'utilisateur
   → Si token valide → utilisateur connecté automatiquement
   → Si token invalide → redirection vers login

3. Requêtes API suivantes
   → Header Authorization: Bearer <token>
   → Symfony valide le token à chaque requête
```

---

## 7. 📊 Résumé des Endpoints API

### Authentification

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| POST | `/api/login` | Connexion utilisateur | Non (PUBLIC_ACCESS) |
| GET | `/api/me` | Informations utilisateur connecté | Oui (JWT) |

### EVP

| Méthode | Endpoint | Description | Rôle Requis |
|---------|----------|-------------|-------------|
| POST | `/api/evp/submit` | Soumettre un EVP | ROLE_GESTIONNAIRE |
| GET | `/api/evp` | Liste des EVP | Selon rôle |
| GET | `/api/evp/{id}` | Détails d'un EVP | Selon rôle |
| POST | `/api/evp/{id}/validate` | Valider un EVP | ROLE_RESPONSABLE_SERVICE, etc. |

### Employés

| Méthode | Endpoint | Description | Rôle Requis |
|---------|----------|-------------|-------------|
| GET | `/api/employees` | Liste des employés | ROLE_GESTIONNAIRE+ |
| POST | `/api/employees` | Créer un employé | ROLE_RH |
| PUT | `/api/employees/{id}` | Modifier un employé | ROLE_RH |
| DELETE | `/api/employees/{id}` | Supprimer un employé | ROLE_RH |

---

## 8. 🔧 Commandes Utiles

### Docker

```bash
# Démarrer les conteneurs
docker compose up -d

# Voir les logs
docker compose logs -f php
docker compose logs -f nginx

# Arrêter les conteneurs
docker compose down

# Reconstruire les images
docker compose build --no-cache
```

### Symfony (dans le conteneur PHP)

```bash
# Accéder au conteneur PHP
docker compose exec php bash

# Créer la base de données
php bin/console doctrine:schema:update --force

# Charger les fixtures
php bin/console doctrine:fixtures:load

# Générer les clés JWT
php bin/console lexik:jwt:generate-keypair

# Vider le cache
php bin/console cache:clear
```

### Frontend

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Build pour la production
npm run build
```

---

## 9. 📝 Conclusion

Cette architecture permet une **séparation claire** entre le frontend (React) et le backend (Symfony), communiquant via une **API RESTful sécurisée par JWT**. Le système de **rôles hiérarchiques** est implémenté à la fois dans la base de données (champ `role` dans `User`) et dans Symfony Security (rôles `ROLE_*`).

**Points clés :**
- ✅ Authentification sécurisée (JWT avec clés RSA)
- ✅ Validation hiérarchique à 5 niveaux
- ✅ Persistance des données (PostgreSQL)
- ✅ Conteneurisation complète (Docker)
- ✅ CORS configuré (Nginx)
- ✅ Calculs automatiques (formules Prime/Congé)

**Prochaines étapes possibles :**
- Implémentation complète des endpoints EVP
- Intégration Oracle ERP (export)
- Tests unitaires et d'intégration
- Déploiement en production (HTTPS, variables d'environnement sécurisées)

---

**Document généré le :** $(date)  
**Version :** 1.0  
**Auteur :** Équipe CollectEVP

