# 🚀 Solution Rapide : Utiliser SQLite au lieu de PostgreSQL

## ⚠️ Problème Actuel

L'erreur **"could not find driver"** signifie que l'extension PostgreSQL n'est pas installée dans PHP.

## ✅ SOLUTION RAPIDE : Passer à SQLite

SQLite est inclus avec PHP, donc pas besoin d'installer quoi que ce soit !

### Étape 1 : Modifier la configuration

**Créez ou modifiez le fichier `backend/.env.local` :**

```env
###> symfony/framework-bundle ###
APP_ENV=dev
APP_SECRET=collectevp-secret-key-2025-ocp-safi-production-change-in-prod
###< symfony/framework-bundle ###

###> doctrine/doctrine-bundle ###
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"
###< doctrine/doctrine-bundle ###

###> lexik/jwt-authentication-bundle ###
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=collectevp-jwt-passphrase-2025-ocp-safi
JWT_TTL=3600
###< lexik/jwt-authentication-bundle ###
```

### Étape 2 : Créer le dossier var si nécessaire

```bash
cd backend
mkdir -p var
```

### Étape 3 : Créer la base de données et charger les données

```bash
cd backend

# Créer la base de données SQLite
php bin/console doctrine:database:create

# Exécuter les migrations
php bin/console doctrine:migrations:migrate

# Charger les utilisateurs de test
php bin/console doctrine:fixtures:load
```

### Étape 4 : Redémarrer le serveur PHP

**Arrêtez le serveur actuel (Ctrl+C) et redémarrez-le :**

```bash
cd backend
php -S 127.0.0.1:8080 -t public
```

### Étape 5 : Tester

**Testez la connexion dans votre application avec :**
- Email : `gestionnaire@ocp.ma`
- Mot de passe : `password123`

## ✅ Avantages de SQLite

- ✅ **Inclus avec PHP** - Pas besoin d'installer quoi que ce soit
- ✅ **Pas de serveur séparé** - Tout est dans un fichier
- ✅ **Parfait pour le développement** - Simple et rapide
- ✅ **Fonctionne immédiatement** - Pas de configuration complexe

## ⚠️ Note

SQLite est parfait pour le développement, mais pour la production, utilisez PostgreSQL avec Docker.

---

**Avec SQLite, l'application devrait fonctionner immédiatement !** 🎉

