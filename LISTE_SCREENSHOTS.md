# Liste des Screenshots à Prendre pour le Chapitre Expérimentation

## Instructions
1. Créez un dossier `screenshots/` à la racine du projet
2. Prenez les captures d'écran dans l'ordre indiqué
3. Nommez-les exactement comme indiqué ci-dessous
4. Assurez-vous d'avoir des données réalistes dans l'application

---

## Screenshots Requis (16 au total)

### 1. Authentification
- **Fichier** : `01_login.png`
- **Description** : Page de connexion avec le formulaire email/password
- **Contexte** : Afficher la page de login avant connexion

### 2. Gestionnaire - Saisie Prime
- **Fichier** : `02_gestionnaire_saisie_prime.png`
- **Description** : Interface de saisie des primes avec formulaire rempli
- **Contexte** : 
  - Un employé sélectionné
  - Formulaire rempli avec des valeurs réalistes
  - Montant calculé visible
  - Bouton "Ajouter" visible

### 3. Gestionnaire - Saisie Congé
- **Fichier** : `03_gestionnaire_saisie_conge.png`
- **Description** : Interface de saisie des congés avec formulaire rempli
- **Contexte** :
  - Dates de début et fin sélectionnées
  - Nombre de jours calculé
  - Indemnité calculée
  - Formulaire complet

### 4. Gestionnaire - Validation
- **Fichier** : `04_gestionnaire_validation.png`
- **Description** : Tableau des soumissions en attente avec plusieurs lignes
- **Contexte** :
  - Plusieurs soumissions dans le tableau
  - Boutons "Soumettre tout" et "Supprimer tout" visibles
  - Au moins 2-3 lignes avec des données

### 5. Gestionnaire - Historique
- **Fichier** : `05_gestionnaire_historique.png`
- **Description** : Onglet historique avec filtres et plusieurs soumissions
- **Contexte** :
  - Plusieurs soumissions avec différents statuts
  - Filtres par type et statut visibles
  - Commentaires de rejet visibles si applicable

### 6. Responsable Service - Validation
- **Fichier** : `06_respo_service_validation.png`
- **Description** : Tableau des soumissions en attente de validation
- **Contexte** :
  - Plusieurs soumissions à valider
  - Boutons "Valider" et "Rejeter" visibles
  - Types EVP (Prime/Congé) affichés

### 7. Responsable Service - Dialog Validation
- **Fichier** : `07_respo_service_dialog_validation.png`
- **Description** : Dialog/modal de validation avec options Valider/Rejeter
- **Contexte** :
  - Dialog ouvert
  - Champs de commentaire visible
  - Boutons "Valider" et "Rejeter" visibles

### 8. Responsable Service - Historique
- **Fichier** : `08_respo_service_historique.png`
- **Description** : Onglet historique avec soumissions traitées
- **Contexte** :
  - Plusieurs soumissions avec statuts variés
  - Filtres actifs
  - Tableau complet

### 9. Responsable Division - Validation
- **Fichier** : `09_respo_division_validation.png`
- **Description** : Interface de validation division avec soumissions validées par le service
- **Contexte** :
  - Soumissions en attente de validation division
  - Boutons d'action visibles
  - Informations complètes affichées

### 10. Responsable Division - Historique
- **Fichier** : `10_respo_division_historique.png`
- **Description** : Historique des validations division
- **Contexte** :
  - Plusieurs soumissions avec différents statuts
  - Filtres par type et statut
  - Tableau complet

### 11. RH - Reporting
- **Fichier** : `11_rh_reporting.png`
- **Description** : Page de reporting global avec données consolidées
- **Contexte** :
  - Tableau avec plusieurs soumissions validées
  - Filtres par division, type, statut
  - Barre de recherche visible
  - Données de plusieurs divisions

### 12. RH - Gestion Employés
- **Fichier** : `12_rh_gestion_employes.png`
- **Description** : Interface de gestion des employés avec tableau
- **Contexte** :
  - Tableau avec plusieurs employés
  - Bouton "Ajouter employé" visible
  - Boutons Modifier/Supprimer visibles
  - Filtres actifs

### 13. RH - Demandes Employés
- **Fichier** : `13_rh_demandes_employes.png`
- **Description** : Page de traitement des demandes d'ajout d'employés
- **Contexte** :
  - Tableau avec demandes en attente
  - Boutons "Approuver" et "Rejeter" visibles
  - Informations des demandes affichées

### 14. Admin - Utilisateurs
- **Fichier** : `14_admin_utilisateurs.png`
- **Description** : Tableau de gestion des utilisateurs
- **Contexte** :
  - Liste de tous les utilisateurs
  - Colonnes : Nom, Email, Rôle, Division, Statut
  - Boutons Modifier/Supprimer visibles
  - Bouton "Ajouter utilisateur" visible

### 15. Admin - Ajout Utilisateur
- **Fichier** : `15_admin_ajout_utilisateur.png`
- **Description** : Dialog/modal d'ajout d'utilisateur
- **Contexte** :
  - Dialog ouvert
  - Formulaire avec tous les champs (nom, email, rôle, division, password)
  - Boutons "Annuler" et "Ajouter" visibles

### 16. Admin - Permissions
- **Fichier** : `16_admin_permissions.png`
- **Description** : Tableau des permissions par rôle
- **Contexte** :
  - Cartes/tableaux montrant les permissions pour chaque rôle
  - 5 rôles affichés (Gestionnaire, Responsable Service, Responsable Division, RH, Administrateur)
  - Liste des permissions pour chaque rôle

---

## Conseils pour les Screenshots

1. **Résolution** : Utilisez une résolution d'écran standard (1920x1080 ou similaire)
2. **Qualité** : Assurez-vous que le texte est lisible
3. **Données** : Utilisez des données réalistes et cohérentes
4. **Navigation** : Prenez les screenshots dans l'ordre logique d'utilisation
5. **Format** : PNG recommandé pour une meilleure qualité
6. **Taille** : Les images seront redimensionnées dans LaTeX, mais gardez une bonne qualité source

## Structure des dossiers

```
CollectEVP Front/
├── screenshots/
│   ├── 01_login.png
│   ├── 02_gestionnaire_saisie_prime.png
│   ├── 03_gestionnaire_saisie_conge.png
│   ├── 04_gestionnaire_validation.png
│   ├── 05_gestionnaire_historique.png
│   ├── 06_respo_service_validation.png
│   ├── 07_respo_service_dialog_validation.png
│   ├── 08_respo_service_historique.png
│   ├── 09_respo_division_validation.png
│   ├── 10_respo_division_historique.png
│   ├── 11_rh_reporting.png
│   ├── 12_rh_gestion_employes.png
│   ├── 13_rh_demandes_employes.png
│   ├── 14_admin_utilisateurs.png
│   ├── 15_admin_ajout_utilisateur.png
│   └── 16_admin_permissions.png
└── CHAPITRE_EXPERIMENTATION.tex
```

## Notes importantes

- Assurez-vous que les données affichées sont cohérentes entre les différents screenshots
- Les noms d'employés et utilisateurs doivent être réalistes
- Les montants et calculs doivent être corrects
- Les statuts doivent refléter un workflow logique (soumis → validé service → validé division)

