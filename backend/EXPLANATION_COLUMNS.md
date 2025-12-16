# 📋 Explication des Colonnes de `evp_submissions`

## Colonnes importantes

### 1. `submitted_by_id` (ID de l'utilisateur qui crée la soumission)
- **Utilité** : Enregistre quel gestionnaire/utilisateur a créé cette soumission EVP
- **Pourquoi toujours 6 ?** : C'est probablement l'ID de votre utilisateur connecté dans la table `users`. Si vous voyez toujours 6, c'est que vous vous connectez toujours avec le même compte.
- **Utilité pratique** : 
  - Traçabilité : savoir qui a créé chaque soumission
  - Filtrage : permettre à chaque gestionnaire de voir uniquement ses soumissions
  - Audit : historique des actions

### 2. `statut` (État de validation de la soumission)
- **Valeurs possibles** :
  - `'En attente'` : Soumission créée, en attente de traitement
  - `'Validé Service'` : Validée par le responsable de service
  - `'Validé Division'` : Validée par le responsable de division
  - `'Approuvé RH'` : Approuvée par les Ressources Humaines
  - `'Rejeté'` : Rejetée à une étape de validation
- **Utilité** : Suivre le workflow de validation de chaque soumission

### 3. `is_prime` et `is_conge` (Booléens pour le type)
- **`is_prime = true`** : Cette soumission contient une Prime (données dans la table `primes`)
- **`is_conge = true`** : Cette soumission contient un Congé (données dans la table `conges`)
- **Logique** : 
  - Quand vous ajoutez un employé, les deux sont à `false`
  - Quand vous ajoutez une Prime → `is_prime` passe à `true` et une entrée est créée dans `primes`
  - Quand vous ajoutez un Congé → `is_conge` passe à `true` et une entrée est créée dans `conges`
  - Une soumission peut avoir les deux à `true` si elle contient à la fois une Prime et un Congé

## Colonnes supprimées

- ❌ `justificatif_path` : Supprimée (non utilisée)
- ❌ `has_justificatif` : Supprimée (non utilisée)

