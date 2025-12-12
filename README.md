# CollectEVP - Système de Gestion des Éléments Variables de Paie

Application web complète pour la gestion des EVP (Éléments Variables de Paie) chez OCP Safi.

## 🚀 Démarrage Rapide

### Prérequis

- Docker Desktop pour Windows (installé et lancé)
- Git

### Installation en 1 clic

**Double-cliquez sur `DEMARRER.bat`** à la racine du projet.

Le script va automatiquement :
- ✅ Démarrer tous les conteneurs Docker
- ✅ Installer les dépendances PHP
- ✅ Créer la base de données PostgreSQL
- ✅ Exécuter les migrations
- ✅ Charger les utilisateurs et employés de test
- ✅ Générer les clés JWT pour l'authentification

**⏱️ Temps estimé : 2-3 minutes**

### Vérification

Ouvrez **PowerShell** et testez l'API :

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/login" -Method POST -ContentType "application/json" -Body '{"email":"gestionnaire@ocp.ma","password":"password123"}'
```

**Résultat attendu :** Un JSON avec un `token` et les informations de l'utilisateur.

## 🌐 Accès à l'Application

- **API Backend** : http://localhost:8080
- **Frontend React** : (à configurer selon votre setup Vite)

## 👥 Comptes de Test

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| gestionnaire@ocp.ma | password123 | Gestionnaire |
| responsable.service@ocp.ma | password123 | Responsable Service |
| responsable.division@ocp.ma | password123 | Responsable Division |
| rh@ocp.ma | password123 | RH |
| admin@ocp.ma | password123 | Administrateur |

## 📡 Endpoints API

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

## 🔧 Commandes Utiles

### Voir les logs

```cmd
docker compose logs -f php
```

### Arrêter l'application

```cmd
docker compose down
```

### Redémarrer l'application

```cmd
docker compose restart
```

### Vérifier l'état des conteneurs

```cmd
docker compose ps
```

### Accéder au shell PHP

```cmd
docker compose exec php bash
```

## ❌ Dépannage

### Erreur : "Port 8080 already in use"

Modifiez le port dans `docker-compose.yml` (ligne 45) :

```yaml
ports:
  - "8081:80"  # Changez 8080 en 8081
```

Puis redémarrez :
```cmd
docker compose down
docker compose up -d
```

### Erreur : "Connection refused"

1. Vérifiez que Docker Desktop est bien lancé
2. Vérifiez les conteneurs : `docker compose ps`
3. Redémarrez : `docker compose restart`

### Erreur : "JWT keys not found"

Générez les clés manuellement :

```cmd
docker compose exec php php bin/console lexik:jwt:generate-keypair
```

### Erreur : "Unable to read the .env file"

Le fichier `.env` doit exister dans le dossier `backend/`. Vérifiez qu'il est présent.

## 📚 Documentation

- **Documentation métier** : `src/CollectEVP_Guide_Complet.md`
- **Architecture backend** : `backend/README.md`

## 🏗️ Structure du Projet

```
CollectEVP Front/
├── backend/              # Backend Symfony
│   ├── src/             # Code source PHP
│   ├── config/          # Configuration Symfony
│   └── public/          # Point d'entrée web
├── src/                 # Frontend React
├── docker-compose.yml   # Orchestration Docker
└── DEMARRER.bat         # Script de démarrage
```

## 🎯 Prochaines Étapes

1. ✅ Backend est prêt et fonctionnel
2. 🔄 Connecter le frontend React à l'API
3. 🔄 Tester les endpoints API
4. 🔄 Implémenter les fonctionnalités manquantes

## 📝 Notes

- Tous les mots de passe de test sont : `password123`
- L'API utilise l'authentification JWT
- Les données de test sont chargées automatiquement via les fixtures
