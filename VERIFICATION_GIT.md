# ✅ Vérification - Fichiers qui NE DOIVENT PAS être sur Git

## 📋 Liste des fichiers/dossiers à vérifier

Ces fichiers/dossiers sont **présents dans votre dossier local** mais **NE DOIVENT PAS être sur Git**. Ils seront **installés/créés automatiquement** chez vos professeurs selon les commandes du README.

### 1. Dépendances (seront réinstallées)

| Fichier/Dossier | Commande README | Statut |
|----------------|----------------|--------|
| `node_modules/` | `npm install` (ligne 90) | ❌ Ne doit PAS être sur Git |
| `backend/vendor/` | `composer install` (ligne 51) | ❌ Ne doit PAS être sur Git |

### 2. Fichiers de configuration (seront créés)

| Fichier | Commande README | Statut |
|---------|----------------|--------|
| `backend/.env.local` | `cp .env .env.local` (ligne 58) | ❌ Ne doit PAS être sur Git |

### 3. Clés JWT (seront générées)

| Fichier | Commande README | Statut |
|---------|----------------|--------|
| `backend/config/jwt/private.pem` | `lexik:jwt:generate-keypair` (ligne 71) | ❌ Ne doit PAS être sur Git |
| `backend/config/jwt/public.pem` | `lexik:jwt:generate-keypair` (ligne 71) | ❌ Ne doit PAS être sur Git |

### 4. Base de données (sera recréée)

| Fichier | Commande README | Statut |
|---------|----------------|--------|
| `backend/var/data.db` | `doctrine:database:create` (ligne 74) | ❌ Ne doit PAS être sur Git |
| `backend/var/data.db-journal` | Créé automatiquement | ❌ Ne doit PAS être sur Git |
| `backend/var/data.db-shm` | Créé automatiquement | ❌ Ne doit PAS être sur Git |
| `backend/var/data.db-wal` | Créé automatiquement | ❌ Ne doit PAS être sur Git |

### 5. Dossier Docker (non utilisé)

| Dossier | Raison | Statut |
|---------|--------|--------|
| `docker/` | Projet utilise SQLite, pas Docker | ❌ Ne doit PAS être sur Git |

### 6. Build (sera régénéré)

| Dossier | Raison | Statut |
|---------|--------|--------|
| `build/` | Build de production, sera régénéré | ❌ Ne doit PAS être sur Git |

### 7. Cache et logs (seront régénérés)

| Fichier/Dossier | Raison | Statut |
|-----------------|--------|--------|
| `backend/var/cache/*` | Cache Symfony, régénéré automatiquement | ❌ Ne doit PAS être sur Git |
| `backend/var/log/*` | Logs, régénérés automatiquement | ❌ Ne doit PAS être sur Git |

## 🔍 Comment vérifier

Exécutez cette commande pour voir ce qui est tracké par Git :

```bash
git ls-files | Select-String -Pattern "node_modules|vendor|data.db|docker|build|\.env\.local|jwt.*\.pem"
```

**Résultat attendu** : Aucun fichier ne doit apparaître.

## ✅ Checklist avant de pousser

- [ ] `node_modules/` n'est pas dans `git ls-files`
- [ ] `backend/vendor/` n'est pas dans `git ls-files`
- [ ] `backend/var/data.db` n'est pas dans `git ls-files`
- [ ] `docker/` n'est pas dans `git ls-files`
- [ ] `build/` n'est pas dans `git ls-files`
- [ ] `backend/.env.local` n'est pas dans `git ls-files`
- [ ] `backend/config/jwt/*.pem` n'est pas dans `git ls-files`

## 🛠️ Si des fichiers sont encore trackés

```bash
# Retirer tous les fichiers ignorés du tracking
git rm -r --cached node_modules/
git rm -r --cached backend/vendor/
git rm -r --cached docker/
git rm -r --cached build/
git rm --cached backend/var/data.db
git rm --cached backend/.env.local
git rm --cached backend/config/jwt/private.pem
git rm --cached backend/config/jwt/public.pem

# Commit
git commit -m "Remove ignored files from Git tracking"
```

