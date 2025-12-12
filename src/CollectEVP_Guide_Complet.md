# CollectEVP – OCP Digital Payroll System
## Guide Complet de Fonctionnement

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture et Identité Visuelle](#architecture-et-identité-visuelle)
3. [Gestion des Utilisateurs et Rôles](#gestion-des-utilisateurs-et-rôles)
4. [Page de Connexion](#page-de-connexion)
5. [Interface Gestionnaire](#interface-gestionnaire)
6. [Interface Responsable Service](#interface-responsable-service)
7. [Interface Responsable Division](#interface-responsable-division)
8. [Interface RH (Ressources Humaines)](#interface-rh-ressources-humaines)
9. [Interface Administrateur](#interface-administrateur)
10. [Workflow de Validation](#workflow-de-validation)
11. [Calculs et Formules](#calculs-et-formules)

---

## Vue d'ensemble

**CollectEVP** est une application web moderne développée pour OCP Safi qui digitalise et automatise l'ensemble du processus de collecte, validation et traitement des **Éléments Variables de la Paie (EVP)**. L'application gère principalement quatre types d'éléments :

- **Primes** (rendement, exceptionnelles, etc.)
- **Heures supplémentaires**
- **Congés payés** (avec indemnités et avances)
- **Absences**

L'application suit une **logique de validation hiérarchique à 5 niveaux**, garantissant un contrôle rigoureux à chaque étape du processus.

---

## Architecture et Identité Visuelle

### Identité Visuelle OCP

L'application respecte scrupuleusement la charte graphique OCP :

**Couleurs principales :**
- **Vert OCP** : `#059669` (emerald-600) à `#064e3b` (emerald-900)
- **Blanc** : Fond principal des interfaces
- **Orange** (accent) : `#f97316` pour les alertes et actions importantes
- **Gris ardoise** : `#f8fafc` (slate-50) pour les fonds secondaires

**Design System :**
- **Typographie** : Inter et Poppins (configurées dans globals.css)
- **Coins arrondis** : Border-radius de 8px à 24px selon les éléments
- **Style minimaliste** : Espacement généreux, hiérarchie visuelle claire
- **Effets** : Ombres douces, dégradés subtils, transitions fluides

**Logo OCP :**
- Présent sur la page de connexion (grand logo en filigrane + logo dans badge)
- Badge OCP dans la barre latérale de chaque interface

---

## Gestion des Utilisateurs et Rôles

### Architecture des Rôles (5 Niveaux)

L'application implémente un système de rôles strictement hiérarchisé :

#### 1. **Gestionnaire** 
- **Email de test** : `gestionnaire@ocp.ma`
- **Division exemple** : Production
- **Responsabilités** :
  - Saisie des EVP pour les employés de son équipe
  - Gestion des primes et congés
  - Soumission ligne par ligne ou globale
  - Demande d'ajout d'employés au RH

#### 2. **Responsable Service**
- **Email de test** : `responsable.service@ocp.ma`
- **Division exemple** : Service Maintenance
- **Responsabilités** :
  - Validation/rejet des EVP soumis par les gestionnaires
  - Consultation du reporting mensuel (3 derniers mois par défaut)
  - Analyse graphique des EVP (barres, camemberts, tendances)

#### 3. **Responsable Division**
- **Email de test** : `responsable.division@ocp.ma`
- **Division exemple** : Division Production
- **Responsabilités** :
  - Validation/rejet des EVP approuvés par les Responsables Service
  - Gestion budgétaire (saisie du montant prévu mensuel)
  - Analyse des écarts budget prévu vs réalisé
  - Vue agrégée des indicateurs par service

#### 4. **RH (Ressources Humaines)**
- **Email de test** : `rh@ocp.ma`
- **Responsabilités** :
  - Consultation globale de tous les EVP validés
  - Gestion de la base de données employés (CRUD complet)
  - Traitement des demandes d'ajout d'employés des gestionnaires
  - Export vers Oracle ERP
  - Reporting consolidé toutes divisions

#### 5. **Administrateur**
- **Email de test** : `admin@ocp.ma`
- **Responsabilités** :
  - Gestion des utilisateurs système (création, modification, suppression)
  - Configuration de l'intégration ERP Oracle
  - Paramétrage des workflows
  - Gestion des permissions

---

## Page de Connexion

### Design

La page de connexion présente une **interface split-screen moderne** :

**Partie gauche (desktop uniquement) :**
- Fond en dégradé vert OCP (`from-emerald-600 via-emerald-700 to-emerald-900`)
- Grand logo OCP en filigrane (opacité 5%, 800px)
- Effets de lumière en overlay (cercles flous blancs et orange)
- Motifs géométriques décoratifs
- Badge OCP blanc avec logo haute résolution
- Titre "CollectEVP" en très grande police (text-6xl)
- Sous-titre descriptif

**Partie droite :**
- Formulaire de connexion sur fond blanc
- Card arrondie avec ombre (shadow-2xl, border-radius 24px)
- Titre "Bienvenue"
- Deux champs :
  - **Email** avec icône Mail et placeholder `votre.email@ocp.ma`
  - **Mot de passe** avec icône Lock et bouton Eye/EyeOff pour afficher/masquer
- Lien "Mot de passe oublié ?"
- Bouton de connexion en dégradé vert avec effet de shadow
- Footer avec copyright OCP

### Authentification

**Système actuel (Mock) :**
- 5 comptes de test préconfigurés (un par rôle)
- Validation côté client
- Accepte n'importe quel email @ocp.ma

**Notifications :**
- Toast de succès : "Connexion réussie !"
- Toast d'erreur : "Email ou mot de passe incorrect"
- Toast d'avertissement : "Veuillez remplir tous les champs"

---

## Interface Gestionnaire

### Vue d'ensemble

L'interface Gestionnaire est le point d'entrée de la saisie des EVP. Elle est divisée en **deux pages principales** avec **deux onglets** dans la page de saisie.

### Structure de Navigation

**Sidebar gauche :**
- Badge OCP + titre "CollectEVP" + rôle
- Menu principal :
  - **Saisie EVP** (avec sous-menu Prime/Congé)
  - **Historique**
- Profil utilisateur en bas
- Bouton Déconnexion

**Header supérieur :**
- Titre de la page courante
- Nom et division de l'utilisateur
- Avatar avec initiales

### Page 1 : Saisie EVP

#### Onglet "Prime"

**Indicateurs en haut :**
- **EVP soumis** : Compteur total (badge vert avec CheckCircle2)
- **En attente de soumission** : Compteur en orange (badge orange avec Clock)

**Tableau de saisie :**
- Colonnes : Matricule | Nom | Poste | Prime | Montant Prime (DH) | Actions
- Bouton **"Ajouter employé"** : 
  - Ouvre un dialogue avec liste déroulante
  - Sélection parmi les employés de la base master
  - Affichage du détail (matricule, nom, poste) avant ajout
- Bouton **"Soumettre tout pour validation"** :
  - Couleur : dégradé vert OCP
  - Icône Send
  - Désactivé si aucune donnée en attente

**Pour chaque ligne d'employé :**
- Badge matricule (border emerald)
- Bouton **"Prime"** : Ouvre le dialogue de saisie prime
- Affichage du montant calculé (ou "-" si vide)
- Bouton **"Soumettre"** : Envoie la ligne pour validation
  - Couleur : emerald si données présentes, outline sinon
  - Après soumission, la ligne est retirée du tableau

#### Dialogue de Saisie Prime

**Titre** : "Saisir la prime de [Nom Employé]"

**Champs de saisie :**
1. **Taux monétaire** (DH) - Input numérique
2. **Groupe** - Select (1, 2, 3, 4)
3. **Nombre de postes** - Input numérique
4. **Score équipe** (0-100) - Input numérique
5. **Note hiérarchique** (0-100) - Input numérique
6. **Score collectif** (0-100) - Input numérique
7. **Montant calculé** (DH) - Affichage en lecture seule, badge vert large

**Actions :**
- Bouton **"Calculer le montant"** : Applique la formule de calcul
- Bouton **"Annuler"** : Ferme sans sauvegarder
- Bouton **"Enregistrer"** : Sauvegarde les données dans l'état local
  - Validation : Taux et Nombre de postes obligatoires
  - Toast de succès

#### Onglet "Congé"

**Structure identique à l'onglet Prime** mais avec :
- Colonnes : Matricule | Nom | Poste | Congé | Indemnité Congé (DH) | Actions
- Bouton **"Congé"** au lieu de "Prime"
- Affichage de l'indemnité calculée

#### Dialogue de Saisie Congé

**Titre** : "Saisir le congé de [Nom Employé]"

**Champs de saisie :**
1. **Date de début** - Calendar picker
2. **Date de fin** - Calendar picker
3. **Nombre de jours** - Auto-calculé (lecture seule)
4. **Tranche** - Select (1, 2, 3, 4)
5. **Avance sur congé** - Switch (Oui/Non)
6. **Montant avance** (DH) - Input (si avance activée)
7. **Indemnité forfaitaire** (DH) - Input numérique
8. **Indemnité calculée** (DH) - Affichage en lecture seule, badge bleu large

**Calcul automatique :**
- Le nombre de jours se calcule automatiquement dès la sélection des deux dates
- Formule : `(dateFin - dateDebut) + 1 jour`

**Actions :**
- Bouton **"Calculer l'indemnité"** : Applique la formule
- Bouton **"Annuler"** : Ferme sans sauvegarder
- Bouton **"Enregistrer"** : Sauvegarde
  - Validation : Dates et Indemnité forfaitaire obligatoires

### Page 2 : Historique

**Contenu :**
- Liste des EVP précédemment soumis
- Filtres par date, type, statut
- Affichage du statut de validation (En attente, Validé par Service, Validé par Division, Approuvé RH, Rejeté)
- Badges colorés selon statut
- Détails consultables

### Fonctionnalités Spéciales

#### Gestion des Employés Master

**Dialogue "Ajouter employé master"** (accessible via bouton en bas de page) :
- Formulaire : Matricule | Nom | Poste
- Bouton **"Ajouter à la base"**
- Liste des employés master avec boutons Modifier/Supprimer

#### Demande au RH

**Bouton "Envoyer une demande au RH"** :
- **Position** : Fixé en bas à droite de la page (sticky button)
- **Icône** : MessageSquare
- **Couleur** : Orange (accent)
- **Action** : Ouvre un dialogue de demande d'ajout d'employé
- **Workflow** : 
  - Gestionnaire remplit le formulaire (matricule, nom, raison)
  - Demande envoyée au service RH
  - RH traite la demande dans son interface dédiée
  - Toast de confirmation

---

## Interface Responsable Service

### Vue d'ensemble

Interface dédiée à la **validation de premier niveau** des EVP soumis par les gestionnaires et au **reporting mensuel**.

### Structure de Navigation

**Sidebar :**
- Badge OCP vert plus foncé (emerald-700/800)
- Menu :
  - **Validation Service** (avec badge orange si demandes en attente)
  - **Reporting**

### Page 1 : Validation Service

#### Bannière de notification

Si des EVP sont en attente :
- Fond orange clair (bg-orange-50)
- Icône Bell
- Message : "[X] EVP en attente de validation"
- Sous-message : "Traitez les demandes pour éviter tout retard..."

#### Indicateurs statistiques (3 cards)

1. **En attente** - Badge orange avec CheckSquare
2. **Validés** - Badge vert avec CheckCircle2
3. **Rejetés** - Badge rouge avec XCircle

#### Filtres

**Barre de recherche :**
- Icône Search
- Placeholder : "Rechercher par nom ou matricule..."
- Filtrage en temps réel

**Select Statut :**
- Options : Tous les statuts | En attente | Validé | Rejeté

#### Tableau de validation

**Colonnes :**
- Matricule (badge vert)
- Employé (avec indicateur 📎 si justificatif présent)
- Type d'élément (Prime, Heures sup., Congé, Absence)
- Montant/Durée
- Date de soumission
- Statut (badge coloré)
- Actions

**Actions possibles :**
- Bouton **"Valider"** (vert, icône CheckCircle2)
- Bouton **"Rejeter"** (rouge outline, icône XCircle)
- Actions visibles uniquement si statut = "En attente"

#### Dialogues de validation/rejet

**Dialogue de validation :**
- Titre : "Valider cet EVP ?"
- Récapitulatif : Employé, Type, Montant
- Champ **Commentaire** (optionnel) - Textarea
- Boutons : Annuler | Confirmer la validation (vert)

**Dialogue de rejet :**
- Titre : "Rejeter cet EVP ?"
- Alerte : "Cette action nécessitera une nouvelle soumission..."
- Champ **Raison du rejet** (obligatoire) - Textarea
- Boutons : Annuler | Confirmer le rejet (rouge)

### Page 2 : Reporting

#### En-tête

- Titre : "Reporting Historique - [Service]"
- Filtre période :
  - **3 derniers mois** (par défaut)
  - **Tous les mois**
- Icône Calendar

#### Info Banner

Fond bleu clair expliquant que par défaut seuls les 3 derniers mois sont affichés.

#### Tableau mensuel

**Colonnes :**
- Mois
- Montant Total Payé (Primes) en DH
- Nombre de Jours de Congés
- Statut (En cours | Validé | Clôturé)

**Badges de statut :**
- **En cours** : bleu
- **Validé** : vert
- **Clôturé** : gris

#### Graphiques (2 colonnes)

**Graphique 1 - Évolution mensuelle (3 mois) :**
- Type : Bar Chart (Recharts)
- Données : 
  - Montant en K DH (barres vertes)
  - Jours congés (barres bleues)
- Axes X/Y, Grille, Tooltip, Légende

**Graphique 2 - Répartition par type d'EVP :**
- Type : Pie Chart (Recharts)
- Segments :
  - Primes (52%, vert)
  - Heures sup. (28%, bleu)
  - Congés (15%, orange)
  - Absences (5%, rouge)
- Labels avec pourcentages

#### Graphique tendance (si "Tous les mois" sélectionné)

- Type : Line Chart
- Tendance sur 6 mois
- Ligne verte avec points
- Affiche l'évolution du montant total

#### Cards statistiques (3 colonnes)

1. **Moyenne mensuelle (primes)** 
   - Fond dégradé vert
   - Montant moyen en DH
   - "Sur X mois"

2. **Total congés (3 mois)**
   - Fond dégradé bleu
   - Somme des jours

3. **Mois le plus actif**
   - Fond dégradé orange
   - Nom du mois avec le montant max

---

## Interface Responsable Division

### Vue d'ensemble

Interface de **validation de deuxième niveau** (après le Responsable Service) et de **gestion budgétaire avancée** avec analyse des écarts.

### Structure de Navigation

**Sidebar :**
- Badge OCP encore plus foncé (emerald-700/900)
- Menu :
  - **Validation Division**
  - **Reporting Avancé**

### Page 1 : Validation Division

#### Bannière d'en-tête

Fond dégradé vert foncé (emerald-700 to emerald-900) avec texte blanc :
- Titre : "Supervision Division"
- Sous-titre : "Vue agrégée des validations par service - [Division]"

#### Bannière de notification

Si validations en attente :
- Fond orange clair
- Icône AlertCircle
- Message : "[X] validation(s) du Responsable Service en attente"
- Explication du processus

#### Tableau de validation (niveau Division)

**Spécificité :** Ce tableau affiche les EVP **déjà validés par le Responsable Service** et qui attendent l'approbation du Responsable Division.

**Colonnes :**
- Matricule
- Employé
- Type
- Montant
- **Service** (nouveau)
- **Validé par** (nom du Responsable Service + date)
- Statut
- Actions

**Statuts possibles :**
- **En attente validation** (orange)
- **Approuvé Division** (vert)
- **Rejeté Division** (rouge)

**Actions :**
- Bouton **"Approuver"** (vert)
- Bouton **"Rejeter"** (rouge outline)

#### Indicateurs clés (4 cards)

1. **En attente** - Icône Clock, orange
2. **Validés ce mois** - Icône CheckCircle2, vert
3. **Rejetés** - Icône CheckCircle2, rouge
4. **Temps moyen** - Icône TrendingUp, bleu (exemple : "1.2j")

#### Tableau agrégé par service

**Titre** : "Indicateurs agrégés par service"

**Colonnes :**
- Service (Maintenance, Fabrication, Qualité, Logistique...)
- En attente (badge orange)
- Validés (badge vert)
- Rejetés (badge rouge)
- Temps moyen (texte)
- **Taux validation** (barre de progression + pourcentage)

**Calcul du taux :**
```
Taux = (Validés / (Validés + Rejetés)) × 100
```

**Affichage visuel :**
- Barre horizontale grise (bg-slate-100)
- Remplissage vert (bg-emerald-600) proportionnel au taux
- Pourcentage affiché à droite

### Page 2 : Reporting Avancé

#### En-tête

- Titre : "Reporting Avancé - [Division]"
- Bouton **"Saisir le montant prévu"** (vert, icône DollarSign)

#### Tableau de gestion budgétaire

**Titre** : "Gestion budgétaire mensuelle"

**Colonnes :**
1. **Mois**
2. **Montant Prévu (DH)**
   - Affichage du montant si saisi
   - "Non défini" en italique gris si null
3. **Montant Réalisé (DH)**
4. **Écart (Réalisé - Prévu)**
   - Calcul : `Réalisé - Prévu`
   - Couleur :
     - **Rouge** si écart positif (dépassement)
     - **Vert** si écart négatif (économie)
     - **Gris** si nul
   - Format : "+15,000 DH" ou "-5,000 DH"
   - Badge avec pourcentage d'écart
5. **Statut** (En cours | Validé | Clôturé)

**Formule de l'écart en % :**
```
Écart % = ((Réalisé - Prévu) / Prévu) × 100
```

#### Dialogue "Saisir le montant prévu"

**Déclencheur** : Bouton en haut de page

**Contenu :**
- Titre : "Définir le montant prévu"
- **Select Mois** : Liste déroulante des 6 mois
- **Input Montant** : Champ numérique avec label "Montant prévu (DH)"
- Info : "Ce montant servira de référence budgétaire..."

**Actions :**
- Bouton **"Annuler"**
- Bouton **"Enregistrer"** (vert)

**Validation :**
- Vérification que mois et montant sont saisis
- Vérification que le montant est > 0
- Toast de succès avec détail

**Effet :**
- Met à jour la colonne "Montant Prévu" du tableau
- Recalcule automatiquement l'écart
- Met à jour les graphiques

#### Graphiques budgétaires

**Graphique 1 - Comparaison Prévu vs Réalisé :**
- Type : Bar Chart groupé
- Deux barres par mois :
  - Montant prévu (bleu)
  - Montant réalisé (vert)
- Permet de visualiser rapidement les écarts

**Graphique 2 - Évolution de l'écart :**
- Type : Line Chart
- Ligne montrant l'évolution de l'écart sur 6 mois
- Zone de danger (rouge) si dépassement

#### Cards statistiques budgétaires

1. **Budget total prévu (6 mois)**
   - Somme des montants prévus
   - Fond dégradé bleu

2. **Budget total réalisé (6 mois)**
   - Somme des montants réalisés
   - Fond dégradé vert

3. **Écart global**
   - Total Réalisé - Total Prévu
   - Couleur dynamique (rouge/vert)
   - Pourcentage

4. **Mois avec plus grand écart**
   - Identification du mois problématique
   - Fond orange si dépassement

---

## Interface RH (Ressources Humaines)

### Vue d'ensemble

L'interface RH est le **centre de contrôle central** de l'application. Le RH a une vue globale sur tous les EVP validés, gère la base de données employés et exporte vers Oracle.

### Structure de Navigation

**Sidebar :**
- Badge OCP
- Menu principal :
  - **Dashboard** (vue d'ensemble)
  - **Employés** (gestion CRUD)
  - **Demandes du Gestionnaire** (nouveau)
  - **Reporting Global**
  - **Export Oracle**
  - **Paramètres**

### Page 1 : Dashboard

#### Cards statistiques principales (4 colonnes)

1. **Total EVP ce mois**
   - Icône LayoutDashboard
   - Badge vert
   - Nombre total

2. **Montant total (Primes)**
   - Icône TrendingUp
   - Badge bleu
   - En DH

3. **Congés totaux**
   - Icône Calendar
   - Badge orange
   - En jours

4. **Taux de validation global**
   - Icône CheckCircle2
   - Badge vert
   - En pourcentage

#### Tableau consolidé des EVP

**Colonnes :**
- Matricule
- Employé
- Division
- Service
- Type
- Montant/Durée
- Date soumission
- Date validation
- Statut (Validé | Rejeté)
- Validé par (nom du validateur)

**Filtres :**
- Recherche par nom/matricule
- Filtre par Division (dropdown)
- Filtre par Statut (dropdown)

**Pagination :**
- 20 lignes par page
- Navigation page précédente/suivante

#### Graphiques globaux

**Répartition par division** (Pie Chart) :
- Production : X%
- Qualité : Y%
- Logistique : Z%

**Évolution mensuelle globale** (Line Chart) :
- Tendance sur 6 mois toutes divisions confondues

### Page 2 : Employés

#### En-tête

- Titre : "Gestion de la base de données employés"
- Bouton **"Ajouter un employé"** (vert, icône UserPlus)

#### Filtres

- Recherche par nom/matricule
- Filtre par Division
- Filtre par Service
- Filtre par Poste

#### Tableau CRUD des employés

**Colonnes :**
- Matricule (badge)
- Nom
- Prénom
- Poste
- Service
- Division
- Actions (Modifier | Supprimer)

**Actions :**
- **Icône Edit** : Ouvre le dialogue de modification
- **Icône Trash2** : Supprime l'employé (avec confirmation)

#### Dialogue "Ajouter/Modifier un employé"

**Champs :**
1. Matricule (Input text)
2. Nom (Input text)
3. Prénom (Input text)
4. Poste (Select : technicien, cadre administratif, agent de maîtrise...)
5. Service (Select : Maintenance, Fabrication, Contrôle, Administration...)
6. Division (Select : Production, Qualité, Logistique...)

**Validation :**
- Tous les champs obligatoires
- Matricule unique
- Toast de succès/erreur

### Page 3 : Demandes du Gestionnaire

**Description :**
Page dédiée au traitement des demandes d'ajout d'employés envoyées par les gestionnaires via le bouton "Envoyer une demande au RH".

#### Tableau des demandes

**Colonnes :**
- Matricule demandé
- Nom & Prénom
- Raison de la demande (Nouvel employé, Employé non déclaré, Transfert...)
- Demandé par (nom du gestionnaire)
- Date de la demande
- Statut (En attente | Traité | Rejeté)
- Actions

**Actions possibles :**
- **Bouton "Traiter"** (vert) :
  - Marque la demande comme traitée
  - Ouvre le dialogue d'ajout d'employé avec les infos pré-remplies
  - Toast : "Demande traitée avec succès"
  
- **Bouton "Rejeter"** (rouge outline) :
  - Ouvre un dialogue de confirmation avec raison
  - Envoie une notification au gestionnaire
  - Toast : "Demande rejetée"

**Statistiques en haut de page :**
- Demandes en attente (badge orange)
- Demandes traitées ce mois (badge vert)
- Temps moyen de traitement

**Filtres :**
- Par statut
- Par gestionnaire
- Par date
- Recherche par matricule/nom

### Page 4 : Reporting Global

**Contenu :**
- Rapports consolidés toutes divisions
- Exports Excel/PDF des tableaux
- Graphiques de tendance multi-niveaux
- Comparaisons inter-divisions
- KPI globaux

### Page 5 : Export Oracle

#### Carte de configuration

**Paramètres de connexion Oracle ERP :**
- URL du serveur Oracle
- Nom de la base de données
- Port
- Nom d'utilisateur
- Mot de passe (masqué)
- **Switch "Activer l'intégration"**

**Bouton "Tester la connexion"** :
- États : idle | testing | success
- Animation pendant le test
- Toast de succès/erreur

#### Section d'export

**Filtres d'export :**
- Période (date début - date fin)
- Division (toutes ou spécifique)
- Type d'EVP (tous, primes, congés...)
- Statut (uniquement validés, ou tous)

**Boutons d'action :**
- **"Générer le fichier d'export"** (bleu) :
  - Crée un fichier XML/CSV au format Oracle
  - Prévisualisation des données
  - Compteur de lignes

- **"Envoyer vers Oracle ERP"** (vert) :
  - Envoie via API
  - Barre de progression
  - Confirmation de succès avec ID de transaction
  - Log d'export

**Historique des exports :**
- Tableau des exports précédents
- Date, Utilisateur, Nombre d'enregistrements, Statut, Actions (Re-télécharger)

### Page 6 : Paramètres

**Configuration application :**
- Période de paie (début/fin de mois)
- Délais de validation (nombre de jours)
- Notifications par email
- Formats d'export
- Sauvegardes automatiques

---

## Interface Administrateur

### Vue d'ensemble

Interface réservée à la **gestion complète du système**, des **utilisateurs** et de la **configuration technique**.

### Structure de Navigation

**Sidebar :**
- Badge OCP
- Menu :
  - **Gestion des Utilisateurs**
  - **Intégration ERP**
  - **Paramètres Système**

### Page 1 : Gestion des Utilisateurs

#### En-tête

- Titre : "Gestion des utilisateurs du système"
- Bouton **"Ajouter un utilisateur"** (vert, icône Plus)

#### Tableau des utilisateurs système

**Colonnes :**
- Nom
- Email
- Rôle (Gestionnaire | Responsable Service | Responsable Division | RH | Administrateur)
- Division
- Statut (Actif | Inactif)
- Actions

**Badge de statut :**
- **Actif** : vert avec CheckCircle2
- **Inactif** : gris

**Actions :**
- **Icône Edit** : Modifier l'utilisateur
- **Icône Trash2** : Supprimer (confirmation requise)
- **Switch** : Activer/Désactiver

#### Dialogue "Ajouter un utilisateur"

**Champs :**
1. **Nom complet** (Input text)
2. **Adresse email** (Input email avec validation @ocp.ma)
3. **Rôle** (Select) :
   - Gestionnaire
   - Responsable Service
   - Responsable Division
   - RH
   - Administrateur
4. **Division** (Select) :
   - Production
   - Qualité
   - Logistique
   - Maintenance
   - Ressources Humaines
5. **Mot de passe initial** (Input password)
6. **Confirmer mot de passe** (Input password)

**Validation :**
- Email unique
- Mot de passe >= 8 caractères
- Tous les champs obligatoires
- Format email @ocp.ma
- Mots de passe identiques

**Actions :**
- Annuler
- **Créer l'utilisateur** (vert)

**Toast de succès :**
"Utilisateur créé avec succès. Un email de bienvenue a été envoyé."

#### Gestion des permissions

**Card "Permissions par rôle"** :
- Tableau matriciel : Rôles (lignes) × Fonctionnalités (colonnes)
- Checkboxes pour activer/désactiver des permissions
- Exemples de fonctionnalités :
  - Saisir EVP
  - Valider niveau 1
  - Valider niveau 2
  - Exporter Oracle
  - Gérer utilisateurs
  - Configurer système

**Permissions prédéfinies :**
- **Gestionnaire** : Saisie uniquement
- **Responsable Service** : Saisie + Validation niveau 1 + Reporting service
- **Responsable Division** : Validation niveau 2 + Reporting avancé + Gestion budget
- **RH** : Tout sauf gestion utilisateurs et config système
- **Administrateur** : Accès total

### Page 2 : Intégration ERP

**Identique à la page Export Oracle du RH** mais avec plus de paramètres :
- Configuration des endpoints API
- Gestion des certificats SSL
- Mapping des champs (EVP → Oracle)
- Configuration des webhooks
- Logs techniques détaillés

#### Configuration du mapping

**Tableau de correspondance :**
- Champ CollectEVP → Champ Oracle
- Type de donnée
- Transformation (si nécessaire)
- Obligatoire (Oui/Non)

**Exemples :**
- Matricule → EMPLOYEE_ID
- Montant Prime → BONUS_AMOUNT
- Date congé début → LEAVE_START_DATE

### Page 3 : Paramètres Système

#### Général

- Nom de l'organisation (OCP Safi)
- Logo de l'entreprise (upload)
- Langue par défaut (Français, Arabe)
- Fuseau horaire (GMT+1)

#### Workflow

- **Délais de validation** :
  - Responsable Service : X jours
  - Responsable Division : Y jours
- **Rappels automatiques** (Switch)
- **Escalade automatique** après délai (Switch)
- **Notifications email** (Switch)

#### Sécurité

- Durée de session (minutes)
- Tentatives de connexion max avant blocage
- Politique de mot de passe :
  - Longueur minimale
  - Caractères spéciaux requis (Switch)
  - Expiration (nombre de jours)
- Authentification à deux facteurs (Switch)
- Journal d'audit (Switch)

#### Maintenance

- **Sauvegarde automatique** :
  - Fréquence (quotidienne, hebdomadaire)
  - Heure de sauvegarde
  - Nombre de sauvegardes à conserver
- **Purge des données** :
  - Supprimer les EVP après X mois
  - Archiver au lieu de supprimer (Switch)

#### Notifications

- Template d'email de bienvenue
- Template de rappel de validation
- Template de notification de rejet
- Template d'export réussi

---

## Workflow de Validation

### Processus complet étape par étape

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW DE VALIDATION                    │
└─────────────────────────────────────────────────────────────┘

ÉTAPE 1 : SAISIE
┌──────────────────────────────────────┐
│ Gestionnaire                          │
│ ─────────────                        │
│ • Ajoute un employé à la liste EVP   │
│ • Saisit Prime OU Congé              │
│ • Calcule le montant/indemnité       │
│ • Enregistre dans l'état local       │
│ • Soumet (ligne par ligne ou tout)   │
└──────────────────────────────────────┘
          │
          │ Soumission
          ↓
ÉTAPE 2 : VALIDATION SERVICE
┌──────────────────────────────────────┐
│ Responsable Service                   │
│ ───────────────────                  │
│ • Reçoit notification                │
│ • Examine l'EVP (+ justificatif)     │
│ • Vérifie les montants               │
│                                       │
│ DÉCISION :                           │
│ ├─→ VALIDER (passe à étape 3)       │
│ └─→ REJETER (retour Gestionnaire)   │
└──────────────────────────────────────┘
          │
          │ Si validé
          ↓
ÉTAPE 3 : VALIDATION DIVISION
┌──────────────────────────────────────┐
│ Responsable Division                  │
│ ────────────────────                 │
│ • Reçoit notification                │
│ • Voit validation du Resp. Service   │
│ • Vérifie budget division            │
│ • Analyse les écarts                 │
│                                       │
│ DÉCISION :                           │
│ ├─→ APPROUVER (passe à étape 4)     │
│ └─→ REJETER (retour Gestionnaire)   │
└──────────────────────────────────────┘
          │
          │ Si approuvé
          ↓
ÉTAPE 4 : CONSOLIDATION RH
┌──────────────────────────────────────┐
│ RH (Ressources Humaines)              │
│ ────────────────────────             │
│ • Collecte tous les EVP validés      │
│ • Vérifie cohérence globale          │
│ • Génère rapport consolidé           │
│ • Prépare fichier d'export           │
└──────────────────────────────────────┘
          │
          │ Export
          ↓
ÉTAPE 5 : EXPORT ORACLE
┌──────────────────────────────────────┐
│ Oracle ERP                            │
│ ──────────                           │
│ • Réception du fichier XML/CSV       │
│ • Intégration dans paie              │
│ • Génération fiches de paie          │
│ • Paiement effectué                  │
└──────────────────────────────────────┘
```

### Durées indicatives

- **Saisie Gestionnaire** : Temps réel
- **Validation Service** : 1-2 jours ouvrés
- **Validation Division** : 1-2 jours ouvrés
- **Traitement RH + Export** : 1-3 jours ouvrés

**Délai total** : 3 à 7 jours ouvrés du début à la fin

### Cas de rejet

Lorsqu'un EVP est rejeté à n'importe quelle étape :
1. Le Gestionnaire reçoit une notification
2. L'EVP retourne dans son interface avec le statut "Rejeté"
3. Le motif du rejet est affiché
4. Le Gestionnaire peut modifier et re-soumettre

### Traçabilité

Chaque EVP conserve un historique complet :
- Date de création
- Dates de chaque validation
- Noms des validateurs
- Commentaires à chaque étape
- Modifications effectuées
- Statut final

---

## Calculs et Formules

### Formule de calcul des Primes

```javascript
montantPrime = (tauxMonetaire × nombrePostes × (scoreEquipe + noteHierarchique + scoreCollectif)) / 100
```

**Paramètres :**
- **tauxMonetaire** : Montant de base en DH (ex: 1000 DH)
- **nombrePostes** : Nombre de postes dans l'équipe (ex: 5)
- **scoreEquipe** : Note de performance équipe, 0-100 (ex: 85)
- **noteHierarchique** : Note du supérieur, 0-100 (ex: 90)
- **scoreCollectif** : Note collective service, 0-100 (ex: 80)
- **groupe** : Coefficient multiplicateur selon le groupe (1, 2, 3, 4)

**Exemple de calcul :**
```
Taux = 1000 DH
Postes = 5
Score équipe = 85
Note hiérarchique = 90
Score collectif = 80

Total scores = 85 + 90 + 80 = 255

Montant = (1000 × 5 × 255) / 100 = 12,750 DH
```

**Arrondi :** Le résultat est arrondi à l'entier supérieur.

### Formule de calcul des Congés

#### Calcul du nombre de jours

```javascript
nombreJours = (dateFin - dateDebut) + 1
```

**Exemple :**
- Date début : 10 octobre 2025
- Date fin : 15 octobre 2025
- Nombre de jours = (15 - 10) + 1 = 6 jours

#### Calcul de l'indemnité

```javascript
indemniteConge = (nombreJours × indemniteForfaitaire × tranche) / 10
```

**Paramètres :**
- **nombreJours** : Calculé automatiquement (voir ci-dessus)
- **indemniteForfaitaire** : Montant journalier en DH (ex: 200 DH)
- **tranche** : Coefficient selon la période (1, 2, 3, 4)

**Exemple de calcul :**
```
Nombre de jours = 6
Indemnité forfaitaire = 200 DH
Tranche = 2

Indemnité = (6 × 200 × 2) / 10 = 240 DH
```

**Arrondi :** Le résultat est arrondi à l'entier supérieur.

#### Avance sur congé

Si l'option "Avance sur congé" est activée :
- Le Gestionnaire saisit un **montant d'avance** manuellement
- Ce montant est enregistré séparément
- Il sera déduit du paiement final dans Oracle
- L'indemnité calculée reste inchangée

### Formule de calcul de l'écart budgétaire

```javascript
ecart = montantRealise - montantPrevu
ecartPourcentage = (ecart / montantPrevu) × 100
```

**Exemple :**
```
Montant prévu = 150,000 DH
Montant réalisé = 125,000 DH

Écart = 125,000 - 150,000 = -25,000 DH
Écart % = (-25,000 / 150,000) × 100 = -16.67%
```

**Interprétation :**
- **Écart négatif** (vert) : Économie, budget respecté
- **Écart positif** (rouge) : Dépassement budgétaire
- **Écart nul** (gris) : Budget exact

### Calcul du taux de validation

```javascript
tauxValidation = (nombreValides / (nombreValides + nombreRejetes)) × 100
```

**Exemple :**
```
Validés = 45
Rejetés = 5
Total = 50

Taux = (45 / 50) × 100 = 90%
```

---

## Fonctionnalités Transversales

### Système de Notifications (Toast)

**Bibliothèque** : Sonner (v2.0.3)

**Types de notifications :**
- **Succès** (vert) : Actions réussies
- **Erreur** (rouge) : Échecs, validations
- **Info** (bleu) : Informations générales
- **Avertissement** (orange) : Alertes

**Exemples :**
```javascript
toast.success('EVP soumis avec succès');
toast.error('Veuillez remplir tous les champs');
toast.success('Prime enregistrée', { description: '2,500 DH calculés' });
```

### Recherche et Filtrage

**Fonctionnalité de recherche :**
- Temps réel (pas de bouton valider)
- Recherche insensible à la casse
- Recherche sur plusieurs champs (nom, matricule, email...)
- Icône Search dans l'input

**Filtres avancés :**
- Dropdowns (Select) avec options multiples
- Filtres combinables (recherche + division + statut)
- Réinitialisation des filtres

### Gestion des Dialogues

**Composant** : shadcn/ui Dialog

**Structure type :**
- DialogHeader (titre + description)
- DialogContent (formulaire/contenu)
- DialogFooter (boutons d'action)

**Comportement :**
- Fermeture sur Escape
- Fermeture sur clic extérieur
- Animation d'apparition/disparition
- Focus automatique sur le premier champ

### Badges et Indicateurs

**Couleurs par statut :**
- **En attente / Pending** : Orange (bg-orange-100, text-orange-700)
- **Validé / Approuvé** : Vert (bg-emerald-100, text-emerald-700)
- **Rejeté** : Rouge (bg-red-100, text-red-700)
- **En cours** : Bleu (bg-blue-100, text-blue-700)
- **Clôturé** : Gris (bg-slate-100, text-slate-700)

**Iconographie** :
- CheckCircle2 : Validation, succès
- XCircle : Rejet, erreur
- Clock : En attente
- AlertCircle : Avertissement
- Bell : Notification
- Award : Prime
- CalendarDays : Congé

### Composants Réutilisables

**Cards statistiques :**
- Icône (12x12, arrondis xl)
- Label (text-sm, text-slate-600)
- Valeur (text-2xl, text-slate-900)
- Couleur thématique selon le type

**Tableaux :**
- Header avec border-b-2
- Hover sur les lignes (hover:bg-slate-50)
- Badges pour les statuts
- Actions en dernière colonne
- Responsive (scroll horizontal si nécessaire)

**Boutons :**
- Primaire : Dégradé vert OCP
- Secondaire : Outline
- Danger : Rouge
- Ghost : Transparent
- Tailles : sm (h-8), default (h-10), lg (h-12)

---

## Technologies Utilisées

### Frontend

- **React** : Bibliothèque UI (version moderne avec Hooks)
- **TypeScript** : Typage statique (interfaces User, EVP, etc.)
- **Tailwind CSS** : Framework CSS utility-first (v4.0)
- **shadcn/ui** : Composants UI pré-construits
- **Lucide React** : Bibliothèque d'icônes
- **Recharts** : Graphiques et charts
- **date-fns** : Manipulation des dates
- **Sonner** : Système de notifications toast

### Composants UI (shadcn)

- Accordion, Alert, Avatar, Badge, Button
- Calendar, Card, Carousel, Chart, Checkbox
- Dialog, Dropdown Menu, Input, Label, Select
- Sheet, Switch, Table, Tabs, Textarea, Tooltip
- Et plus...

### État de l'application

- **useState** : Gestion d'état local (pas de Redux pour l'instant)
- États principaux :
  - `isAuthenticated` : Statut de connexion
  - `currentUser` : Utilisateur connecté
  - `employees` : Liste des employés EVP
  - `submissions` : EVP soumis
  - `validationRequests` : Demandes de validation
  - `monthlyBudgets` : Budgets mensuels

### Routing

**Routing par rôle :**
L'application ne utilise pas React Router mais affiche la page appropriée selon le rôle de l'utilisateur connecté :

```typescript
switch (currentUser?.role) {
  case 'Gestionnaire':
    return <GestionnaireHomePage />;
  case 'Responsable Service':
    return <ResponsableServicePage />;
  case 'Responsable Division':
    return <ResponsableDivisionPage />;
  case 'RH':
    return <RHPage />;
  case 'Administrateur':
    return <AdminPage />;
}
```

---

## Points Clés de l'Application

### Avantages de CollectEVP

1. **Digitalisation complète** : Fin du papier et des emails
2. **Traçabilité totale** : Historique de chaque action
3. **Validation hiérarchique** : Contrôle à plusieurs niveaux
4. **Calculs automatisés** : Réduction des erreurs manuelles
5. **Reporting en temps réel** : Tableaux de bord et graphiques
6. **Intégration Oracle** : Export direct vers la paie
7. **Gestion budgétaire** : Suivi des écarts prévisionnel/réalisé
8. **Interface intuitive** : Design OCP, ergonomie soignée
9. **Multi-rôles** : Chaque utilisateur voit uniquement ce qui le concerne
10. **Notifications** : Alertes et rappels automatiques

### Sécurité

- Authentification par email/mot de passe
- Permissions par rôle (RBAC)
- Sessions limitées dans le temps
- Logs d'audit de toutes les actions
- Données sensibles masquées (mots de passe)
- Export sécurisé vers Oracle (SSL)

### Performance

- Composants React optimisés
- Filtrage côté client pour réactivité
- Pagination des longues listes
- Lazy loading des graphiques
- Cache des données fréquemment utilisées

---

## Évolutions Futures Possibles

### Fonctionnalités à venir

1. **Application mobile** (React Native)
2. **Notifications push** en temps réel
3. **Signature électronique** pour les validations
4. **OCR** pour scanner les justificatifs papier
5. **IA** pour détecter les anomalies dans les montants
6. **Workflow personnalisable** par division
7. **Multi-langue** (Arabe, Anglais)
8. **Intégration Active Directory** pour SSO
9. **Tableau de bord prédictif** (Machine Learning)
10. **Export multi-formats** (Excel, PDF, CSV)

### Améliorations techniques

- Migration vers React Router pour URL routing
- Utilisation de Redux ou Zustand pour state management global
- API REST backend (Node.js/Express ou Java Spring)
- Base de données PostgreSQL ou Oracle
- WebSockets pour notifications en temps réel
- Tests unitaires (Jest, React Testing Library)
- Tests E2E (Cypress, Playwright)
- CI/CD (GitLab CI, GitHub Actions)
- Conteneurisation (Docker)
- Déploiement cloud (AWS, Azure, OCP private cloud)

---

## Conclusion

**CollectEVP** transforme radicalement le processus de gestion des éléments variables de la paie chez OCP Safi. En remplaçant les processus manuels et fragmentés par une plateforme centralisée, intuitive et automatisée, l'application :

- **Réduit les erreurs** grâce aux calculs automatiques
- **Accélère les validations** via un workflow numérique
- **Améliore la traçabilité** avec un historique complet
- **Facilite le pilotage** grâce aux reportings en temps réel
- **Optimise les budgets** avec l'analyse des écarts
- **Simplifie l'export** vers Oracle ERP

Chaque rôle dispose d'une interface adaptée à ses responsabilités, dans le respect de l'identité visuelle OCP et des meilleures pratiques UX/UI.

---

**Document rédigé le 13 novembre 2025**  
**Version 1.0**  
**© OCP Safi - CollectEVP Digital Payroll System**
