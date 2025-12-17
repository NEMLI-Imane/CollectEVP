import React, { useState, useEffect } from 'react';
import { User } from '../App';
import { getEmployees, Employee, getEVPSubmissions, createEVPSubmission, updateEVPSubmission, deleteEVPSubmission, EVPSubmission, createEmployeeRequest } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Switch } from './ui/switch';
import { FileEdit, LogOut, Clock, CheckCircle2, Menu, Plus, CalendarDays, Send, Award, MessageSquare, RefreshCw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface GestionnaireHomePageProps {
  user: User;
  onLogout: () => void;
}

interface PrimeData {
  tauxMonetaire: string;
  groupe: string;
  nombrePostes: string;
  scoreEquipe: string;
  noteHierarchique: string;
  scoreCollectif: string;
  montantCalcule: number;
  statut?: string;
  submittedAt?: string;
  commentaire?: string;
}

interface CongeData {
  dateDebut: Date | undefined;
  dateFin: Date | undefined;
  nombreJours: number;
  tranche: string;
  avanceSurConge: boolean;
  montantAvance: string;
  indemniteForfaitaire: string;
  indemniteCalculee: number;
  statut?: string;
  submittedAt?: string;
  commentaire?: string;
}

interface EmployeeEVP {
  id: number;
  matricule: string;
  nom: string;
  poste: string;
  primeData: PrimeData | null;
  congeData: CongeData | null;
  isSubmitted: boolean;
}

interface MasterEmployee {
  id: number;
  matricule: string;
  nom: string;
  poste: string;
}

export default function GestionnaireHomePage({ user, onLogout }: GestionnaireHomePageProps) {
  const [currentPage, setCurrentPage] = useState<'saisie' | 'historique'>('saisie');
  const [saisieTab, setSaisieTab] = useState<'prime' | 'conge'>('prime');
  const [employees, setEmployees] = useState<EmployeeEVP[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<EVPSubmission[]>([]); // Toutes les soumissions pour calculer les compteurs
  const [historicalSubmissions, setHistoricalSubmissions] = useState<EVPSubmission[]>([]); // Soumissions soumises pour l'historique
  const [searchTerm, setSearchTerm] = useState(''); // Terme de recherche pour l'historique
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'prime' | 'conge'>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'soumis' | 'a_revoir' | 'modifié'>('all');
  const [loadingSubmissions, setLoadingSubmissions] = useState(true); // Commencer en état de chargement
  const [loadingHistory, setLoadingHistory] = useState(false); // Chargement de l'historique

  // Dialog states
  const [primeDialogOpen, setPrimeDialogOpen] = useState(false);
  const [congeDialogOpen, setCongeDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeEVP | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Date input states (format JJ/MM/AAAA)
  const [dateDebutText, setDateDebutText] = useState('');
  const [dateFinText, setDateFinText] = useState('');

  // Prime form state
  const [primeForm, setPrimeForm] = useState<PrimeData>({
    tauxMonetaire: '',
    groupe: '1',
    nombrePostes: '',
    scoreEquipe: '',
    noteHierarchique: '',
    scoreCollectif: '',
    montantCalcule: 0,
  });

  // Congé form state
  const [congeForm, setCongeForm] = useState<CongeData>({
    dateDebut: undefined,
    dateFin: undefined,
    nombreJours: 0,
    tranche: '1',
    avanceSurConge: false,
    montantAvance: '',
    indemniteForfaitaire: '',
    indemniteCalculee: 0,
  });

  // Master employee list - chargée depuis l'API
  const [masterEmployees, setMasterEmployees] = useState<MasterEmployee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Charger les employés et soumissions depuis l'API au chargement
  useEffect(() => {
    loadMasterEmployees();
    // Ne pas charger les soumissions ici, attendre que saisieTab soit défini
  }, []);

  // Charger les soumissions quand on change d'onglet (Prime/Congé) ou au montage initial
  useEffect(() => {
    // S'assurer que saisieTab est défini avant de charger
    if (saisieTab) {
      loadEVPSubmissions(saisieTab);
    }
  }, [saisieTab]);

  // Charger l'historique quand on accède à la page historique
  useEffect(() => {
    if (currentPage === 'historique') {
      loadHistoricalSubmissions();
    }
  }, [currentPage]);

  // Recharger les employés et soumissions quand on accède à la page de saisie
  useEffect(() => {
    if (currentPage === 'saisie') {
      loadMasterEmployees();
      loadEVPSubmissions(saisieTab);
      syncEmployeesWithDatabase();
    }
  }, [currentPage]);

  const loadMasterEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const employees = await getEmployees();
      // Convertir les employés de l'API au format MasterEmployee
      const masterEmps: MasterEmployee[] = employees.map(emp => ({
        id: emp.id,
        matricule: emp.matricule,
        nom: emp.prenom ? `${emp.prenom} ${emp.nom}` : emp.nom,
        poste: emp.poste || '',
      }));
      setMasterEmployees(masterEmps);
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
      toast.error('Erreur lors du chargement des employés');
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Fonction pour charger les soumissions EVP depuis la base de données
  const loadEVPSubmissions = async (tab?: 'prime' | 'conge') => {
    try {
      setLoadingSubmissions(true);
      // Utiliser le paramètre tab ou l'état actuel de saisieTab
      const currentTab = tab || saisieTab;
      console.log(`🔄 Chargement des soumissions EVP pour l'onglet: ${currentTab}...`);
      const submissions = await getEVPSubmissions();
      console.log('📋 Soumissions reçues:', submissions);
      
      // Stocker toutes les soumissions pour calculer les compteurs
      setAllSubmissions(submissions);
      
      // Filtrer les soumissions en attente ou rejetées (pour permettre la modification)
      // Exclure "Modifié" car une fois modifié et soumis, elle doit disparaître du tableau de saisie
      // Le statut est maintenant dans Prime/Conge, pas dans EVPSubmission
      const pendingSubmissions = submissions.filter(
        (sub: EVPSubmission) => {
          if (currentTab === 'prime' && sub.isPrime && sub.prime) {
            const statut = sub.prime.statut || '';
            // Inclure uniquement les soumissions en attente ou rejetées (pas "Modifié" qui est déjà soumis)
            return !statut || statut === 'En attente' || statut === 'Rejeté' || statut === null;
          } else if (currentTab === 'conge' && sub.isConge && sub.conge) {
            const statut = sub.conge.statut || '';
            // Inclure uniquement les soumissions en attente ou rejetées (pas "Modifié" qui est déjà soumis)
            return !statut || statut === 'En attente' || statut === 'Rejeté' || statut === null;
          }
          return false;
        }
      );
      
      console.log('📋 Soumissions en attente:', pendingSubmissions);
      
      // Convertir les soumissions en format EmployeeEVP
      // Filtrer selon l'onglet actif : Prime ou Congé
      const evpEmployees: EmployeeEVP[] = pendingSubmissions
        .filter((submission: EVPSubmission) => {
          if (!submission.employee) return false;
          // Filtrer selon l'onglet actif (utiliser currentTab au lieu de saisieTab)
          if (currentTab === 'prime') {
            return submission.isPrime; // Afficher uniquement les soumissions avec Prime
          } else {
            return submission.isConge; // Afficher uniquement les soumissions avec Congé
          }
        })
        .map((submission: EVPSubmission) => {
          const emp = submission.employee;
          if (!emp) {
            console.warn('⚠️ Soumission sans employé:', submission);
            return null;
          }
          
          const nomComplet = emp.prenom ? `${emp.prenom} ${emp.nom}` : emp.nom;
          
          // Extraire les données Prime depuis l'entité Prime
          const primeData = submission.prime && submission.isPrime
            ? {
                tauxMonetaire: submission.prime.tauxMonetaire?.toString() || '',
                groupe: submission.prime.groupe?.toString() || '1',
                nombrePostes: submission.prime.nombrePostes?.toString() || '',
                scoreEquipe: submission.prime.scoreEquipe?.toString() || '',
                noteHierarchique: submission.prime.noteHierarchique?.toString() || '',
                scoreCollectif: submission.prime.scoreCollectif?.toString() || '',
                montantCalcule: typeof submission.prime.montantCalcule === 'string' ? parseFloat(submission.prime.montantCalcule) || 0 : (submission.prime.montantCalcule || 0),
                statut: submission.prime.statut || 'En attente',
              }
            : null;
          
          // Extraire les données Congé depuis l'entité Conge
          const congeData = submission.conge && submission.isConge
            ? {
                dateDebut: submission.conge.dateDebut ? new Date(submission.conge.dateDebut) : undefined,
                dateFin: submission.conge.dateFin ? new Date(submission.conge.dateFin) : undefined,
                nombreJours: submission.conge.nombreJours || 0,
                tranche: submission.conge.tranche?.toString() || '1',
                avanceSurConge: submission.conge.avanceSurConge || false,
                montantAvance: submission.conge.montantAvance?.toString() || '',
                indemniteForfaitaire: submission.conge.indemniteForfaitaire?.toString() || '',
                indemniteCalculee: typeof submission.conge.indemniteCalculee === 'string' ? parseFloat(submission.conge.indemniteCalculee) || 0 : (submission.conge.indemniteCalculee || 0),
                statut: submission.conge.statut || 'En attente',
              }
            : null;
          
          // Déterminer isSubmitted selon le type (Prime ou Congé)
          // Une soumission est considérée comme soumise si elle est "Soumis", "Modifié", "Validé Service", "Validé Division", ou "Validé"
          // MAIS si elle est "Rejeté", elle n'est PAS considérée comme soumise (elle réapparaît dans le tableau de saisie)
          let isSubmitted = currentTab === 'prime' 
            ? (primeData?.statut === 'Soumis' || primeData?.statut === 'Modifié' || primeData?.statut === 'Validé Service' || primeData?.statut === 'Validé Division' || primeData?.statut === 'Validé' || false)
            : (congeData?.statut === 'Soumis' || congeData?.statut === 'Modifié' || congeData?.statut === 'Validé Service' || congeData?.statut === 'Validé Division' || congeData?.statut === 'Validé' || false);
          
          // Si rejeté, ne pas considérer comme soumis (pour qu'il réapparaisse dans le tableau de saisie)
          if (currentTab === 'prime' && primeData?.statut === 'Rejeté') {
            isSubmitted = false;
          }
          if (currentTab === 'conge' && congeData?.statut === 'Rejeté') {
            isSubmitted = false;
          }
          
          return {
            id: submission.id,
            matricule: emp.matricule,
            nom: nomComplet,
            poste: emp.poste || '',
            primeData,
            congeData,
            isSubmitted,
          };
        })
        .filter((emp): emp is EmployeeEVP => emp !== null); // Filtrer les null
      
      console.log('✅ Employés EVP convertis:', evpEmployees);
      console.log('📊 Nombre d\'employés dans le tableau:', evpEmployees.length);
      setEmployees(evpEmployees);
      
      // Forcer un re-render si nécessaire
      if (evpEmployees.length > 0) {
        console.log('✅ Tableau mis à jour avec', evpEmployees.length, 'employé(s)');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des soumissions EVP:', error);
      toast.error('Erreur lors du chargement des soumissions: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Synchroniser les employés du tableau avec la base de données
  const syncEmployeesWithDatabase = async () => {
    try {
      const dbEmployees = await getEmployees();
      
      // Mettre à jour les employés dans le tableau avec les données de la BDD
      setEmployees(prevEmployees => {
        const updated = prevEmployees.map(emp => {
          const dbEmployee = dbEmployees.find(dbEmp => dbEmp.matricule === emp.matricule);
          if (dbEmployee) {
            // Mettre à jour les informations de l'employé avec les données de la BDD
            const newNom = `${dbEmployee.prenom} ${dbEmployee.nom}`;
            const newPoste = dbEmployee.poste;
            
            // Ne mettre à jour que si les données ont changé
            if (emp.nom !== newNom || emp.poste !== newPoste) {
              return {
                ...emp,
                nom: newNom,
                poste: newPoste,
              };
            }
          }
          return emp;
        });
        return updated;
      });
    } catch (error) {
      console.error('Erreur lors de la synchronisation des employés:', error);
      toast.error('Erreur lors de la synchronisation');
    }
  };

  // Master employee form
  const [masterEmployeeForm, setMasterEmployeeForm] = useState({
    matricule: '',
    nom: '',
    poste: '',
  });
  const [showMasterEmployeeDialog, setShowMasterEmployeeDialog] = useState(false);
  const [editingMasterEmployee, setEditingMasterEmployee] = useState<MasterEmployee | null>(null);

  // New employee form (for EVP saisie - select from dropdown)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestForm, setRequestForm] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    raison: '',
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculer les compteurs réels depuis toutes les soumissions chargées
  const submittedCount = allSubmissions.filter(sub => {
    if (saisieTab === 'prime' && sub.isPrime && sub.prime) {
      const statut = sub.prime.statut || '';
      return statut === 'Soumis' || statut === 'Validé' || statut === 'Validé Service' || statut === 'Validé Division';
    } else if (saisieTab === 'conge' && sub.isConge && sub.conge) {
      const statut = sub.conge.statut || '';
      return statut === 'Soumis' || statut === 'Validé' || statut === 'Validé Service' || statut === 'Validé Division';
    }
    return false;
  }).length;

  const pendingCount = allSubmissions.filter(sub => {
    if (saisieTab === 'prime' && sub.isPrime && sub.prime) {
      const statut = sub.prime.statut || '';
      return !statut || statut === 'En attente' || statut === null;
    } else if (saisieTab === 'conge' && sub.isConge && sub.conge) {
      const statut = sub.conge.statut || '';
      return !statut || statut === 'En attente' || statut === null;
    }
    return false;
  }).length;

  // Fonction pour charger les soumissions historiques (soumises, validées, rejetées)
  const loadHistoricalSubmissions = async () => {
    try {
      setLoadingHistory(true);
      console.log('🔄 Chargement de l\'historique des soumissions...');
      const submissions = await getEVPSubmissions();
      console.log('📋 Toutes les soumissions reçues:', submissions);
      
      // Filtrer uniquement les soumissions soumises (pas "En attente")
      const historical = submissions.filter((sub: EVPSubmission) => {
        // Si Prime, vérifier le statut dans Prime
        if (sub.isPrime && sub.prime) {
          const statut = sub.prime.statut || '';
          return statut !== 'En attente' && statut !== null && statut !== '';
        }
        // Si Congé, vérifier le statut dans Conge
        if (sub.isConge && sub.conge) {
          const statut = sub.conge.statut || '';
          return statut !== 'En attente' && statut !== null && statut !== '';
        }
        return false;
      });
      
      console.log('📋 Soumissions historiques:', historical);
      setHistoricalSubmissions(historical);
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'historique:', error);
      toast.error('Erreur lors du chargement de l\'historique: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filtrer l'historique selon le terme de recherche
  const filteredHistoricalSubmissions = historicalSubmissions.filter((sub: EVPSubmission) => {
    const emp = sub.employee;
    if (!emp) return false;
    
    // Filtre par recherche
    const searchLower = searchTerm.toLowerCase();
    const matricule = emp.matricule?.toLowerCase() || '';
    const nom = emp.nom?.toLowerCase() || '';
    const prenom = emp.prenom?.toLowerCase() || '';
    const poste = emp.poste?.toLowerCase() || '';
    const nomComplet = `${prenom} ${nom}`.toLowerCase();
    
    const matchesSearch = matricule.includes(searchLower) || 
           nom.includes(searchLower) || 
           prenom.includes(searchLower) ||
           nomComplet.includes(searchLower) ||
           poste.includes(searchLower);
    
    if (!matchesSearch) return false;

    // Fonction pour déterminer le statut affiché dans la colonne Statut
    const getPrimeStatusDisplay = () => {
      if (!sub.isPrime || !sub.prime) return null;
      if (sub.prime.statut === 'Rejeté') return 'a_revoir';
      if (sub.prime.statut === 'Modifié') return 'modifié';
      if (sub.prime.submittedAt) return 'soumis';
      return null;
    };

    const getCongeStatusDisplay = () => {
      if (!sub.isConge || !sub.conge) return null;
      if (sub.conge.statut === 'Rejeté') return 'a_revoir';
      if (sub.conge.statut === 'Modifié') return 'modifié';
      if (sub.conge.submittedAt) return 'soumis';
      return null;
    };

    // Filtre par type (Prime/Congé)
    if (historyTypeFilter === 'prime') {
      // Ne garder QUE les soumissions qui ont Prime ET PAS Congé
      if (!sub.isPrime || !sub.prime || (sub.isConge && sub.conge)) return false;
      
      // Filtre par statut si spécifié
      if (historyStatusFilter !== 'all') {
        const primeStatus = getPrimeStatusDisplay();
        return primeStatus === historyStatusFilter;
      }
      return true;
    } else if (historyTypeFilter === 'conge') {
      // Ne garder QUE les soumissions qui ont Congé ET PAS Prime
      if (!sub.isConge || !sub.conge || (sub.isPrime && sub.prime)) return false;
      
      // Filtre par statut si spécifié
      if (historyStatusFilter !== 'all') {
        const congeStatus = getCongeStatusDisplay();
        return congeStatus === historyStatusFilter;
      }
      return true;
    } else {
      // Filtre "Tous les EVP" - si un filtre de statut est spécifié, vérifier que TOUS les types présents correspondent
      if (historyStatusFilter !== 'all') {
        const primeStatus = getPrimeStatusDisplay();
        const congeStatus = getCongeStatusDisplay();
        
        // Si la demande a Prime ET Congé, les deux doivent avoir le statut sélectionné
        if (sub.isPrime && sub.prime && sub.isConge && sub.conge) {
          return primeStatus === historyStatusFilter && congeStatus === historyStatusFilter;
        }
        // Si seulement Prime, vérifier Prime
        if (sub.isPrime && sub.prime) {
          return primeStatus === historyStatusFilter;
        }
        // Si seulement Congé, vérifier Congé
        if (sub.isConge && sub.conge) {
          return congeStatus === historyStatusFilter;
        }
        return false;
      }
      return true;
    }
  });

  // Calculer les employés disponibles pour la liste déroulante
  // Filtrer les employés qui sont déjà dans les soumissions (non soumises)
  // Filtrer les employés disponibles selon l'onglet actif
  const availableEmployees = masterEmployees.filter(emp => {
    // Vérifier si l'employé est déjà dans le tableau avec le type correspondant
    const alreadyInTable = employees.some(e => {
      if (e.matricule !== emp.matricule || e.isSubmitted) return false;
      // Pour l'onglet Prime, vérifier si l'employé a déjà une Prime
      if (saisieTab === 'prime') {
        return e.primeData !== null;
      }
      // Pour l'onglet Congé, vérifier si l'employé a déjà un Congé
      return e.congeData !== null;
    });
    return !alreadyInTable;
  });

  // Prime Dialog Handlers
  const openPrimeDialog = (employee: EmployeeEVP) => {
    setSelectedEmployee(employee);
    if (employee.primeData) {
      setPrimeForm(employee.primeData);
    } else {
      setPrimeForm({
        tauxMonetaire: '',
        groupe: '1',
        nombrePostes: '',
        scoreEquipe: '',
        noteHierarchique: '',
        scoreCollectif: '',
        montantCalcule: 0,
      });
    }
    setPrimeDialogOpen(true);
  };

  const calculatePrime = () => {
    const taux = parseFloat(primeForm.tauxMonetaire) || 0;
    const postes = parseFloat(primeForm.nombrePostes) || 0;
    const scoreEquipe = parseFloat(primeForm.scoreEquipe) || 0;
    const noteHier = parseFloat(primeForm.noteHierarchique) || 0;
    const scoreCollectif = parseFloat(primeForm.scoreCollectif) || 0;

    // Formule simplifiée - à adapter selon la vraie logique métier
    const montant = taux * postes * (scoreEquipe + noteHier + scoreCollectif) / 100;
    
    setPrimeForm({ ...primeForm, montantCalcule: Math.round(montant) });
    toast.success('Montant calculé avec succès');
  };

  const savePrimeData = async () => {
    if (!selectedEmployee) return;

    if (!primeForm.tauxMonetaire || !primeForm.nombrePostes) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      // Sauvegarder dans la base de données
      const updateData = {
        type: 'Prime',
        tauxMonetaire: parseFloat(primeForm.tauxMonetaire) || null,
        groupe: parseInt(primeForm.groupe) || null,
        nombrePostes: parseInt(primeForm.nombrePostes) || null,
        scoreEquipe: parseInt(primeForm.scoreEquipe) || null,
        noteHierarchique: parseInt(primeForm.noteHierarchique) || null,
        scoreCollectif: parseInt(primeForm.scoreCollectif) || null,
      };

      const updatedSubmission = await updateEVPSubmission(selectedEmployee.id, updateData);
      console.log('✅ Prime sauvegardée dans la BDD:', updatedSubmission);

      // Mettre à jour le state local avec les données de la BDD
      const updatedPrimeData = {
        tauxMonetaire: updatedSubmission.tauxMonetaire?.toString() || primeForm.tauxMonetaire,
        groupe: updatedSubmission.groupe?.toString() || primeForm.groupe,
        nombrePostes: updatedSubmission.nombrePostes?.toString() || primeForm.nombrePostes,
        scoreEquipe: updatedSubmission.scoreEquipe?.toString() || primeForm.scoreEquipe,
        noteHierarchique: updatedSubmission.noteHierarchique?.toString() || primeForm.noteHierarchique,
        scoreCollectif: updatedSubmission.scoreCollectif?.toString() || primeForm.scoreCollectif,
        montantCalcule: typeof updatedSubmission.montantCalcule === 'string' 
          ? parseFloat(updatedSubmission.montantCalcule) || 0 
          : (updatedSubmission.montantCalcule || 0),
      };

      setEmployees(employees.map(emp =>
        emp.id === selectedEmployee.id
          ? { ...emp, primeData: updatedPrimeData }
          : emp
      ));

      setPrimeDialogOpen(false);
      toast.success('Prime enregistrée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la prime:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(`Erreur: ${errorMessage}`);
    }
  };

  // Congé Dialog Handlers
  const openCongeDialog = (employee: EmployeeEVP) => {
    setSelectedEmployee(employee);
    if (employee.congeData) {
      // Si l'indemnité forfaitaire existe, activer le switch (mettre '1' pour indiquer qu'il est activé)
      const indemniteForfaitaireValue = employee.congeData.indemniteForfaitaire ? '1' : '';
      
      setCongeForm({
        ...employee.congeData,
        montantAvance: '', // Plus de champ texte pour le montant d'avance
        indemniteForfaitaire: indemniteForfaitaireValue,
      });
      // Mettre à jour les champs texte avec les dates formatées
      setDateDebutText(employee.congeData.dateDebut ? formatDate(employee.congeData.dateDebut) : '');
      setDateFinText(employee.congeData.dateFin ? formatDate(employee.congeData.dateFin) : '');
    } else {
      setCongeForm({
        dateDebut: undefined,
        dateFin: undefined,
        nombreJours: 0,
        tranche: '1',
        avanceSurConge: false,
        montantAvance: '',
        indemniteForfaitaire: '',
        indemniteCalculee: 0,
      });
      setDateDebutText('');
      setDateFinText('');
    }
    setCongeDialogOpen(true);
  };

  // Fonction pour parser une date au format JJ/MM/AAAA
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || dateStr.length !== 10) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const jour = parseInt(parts[0], 10);
    const mois = parseInt(parts[1], 10) - 1; // Les mois sont 0-indexés en JS
    const annee = parseInt(parts[2], 10);
    
    if (isNaN(jour) || isNaN(mois) || isNaN(annee)) return null;
    if (jour < 1 || jour > 31 || mois < 0 || mois > 11) return null;
    
    const date = new Date(annee, mois, jour);
    // Vérifier que la date est valide
    if (date.getDate() !== jour || date.getMonth() !== mois || date.getFullYear() !== annee) {
      return null;
    }
    return date;
  };

  // Fonction pour formater une date au format JJ/MM/AAAA
  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    const jour = date.getDate().toString().padStart(2, '0');
    const mois = (date.getMonth() + 1).toString().padStart(2, '0');
    const annee = date.getFullYear();
    return `${jour}/${mois}/${annee}`;
  };

  // Fonction pour formater le texte de date (ajouter automatiquement les /)
  const formatDateInput = (value: string): string => {
    // Retirer tous les caractères non numériques
    const numbers = value.replace(/\D/g, '');
    
    // Limiter à 8 chiffres (JJMMAAAA)
    const limited = numbers.slice(0, 8);
    
    // Ajouter les séparateurs
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 4) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    } else {
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
    }
  };

  const calculateCongeJours = (debut: Date | undefined, fin: Date | undefined) => {
    if (!debut || !fin) return 0;
    // Calculer la différence en jours (inclusif des deux dates)
    const diff = fin.getTime() - debut.getTime();
    const jours = Math.ceil(diff / (1000 * 3600 * 24)) + 1;
    return jours > 0 ? jours : 0;
  };

  // Handler pour la date début
  const handleDateDebutChange = (value: string) => {
    const formatted = formatDateInput(value);
    setDateDebutText(formatted);
    
    if (formatted.length === 10) {
      const date = parseDate(formatted);
      if (date) {
        const jours = calculateCongeJours(date, congeForm.dateFin);
        setCongeForm({ ...congeForm, dateDebut: date, nombreJours: jours });
      } else {
        // Date invalide, réinitialiser
        setCongeForm({ ...congeForm, dateDebut: undefined, nombreJours: 0 });
      }
    } else {
      setCongeForm({ ...congeForm, dateDebut: undefined, nombreJours: 0 });
    }
  };

  // Handler pour la date fin
  const handleDateFinChange = (value: string) => {
    const formatted = formatDateInput(value);
    setDateFinText(formatted);
    
    if (formatted.length === 10) {
      const date = parseDate(formatted);
      if (date) {
        const jours = calculateCongeJours(congeForm.dateDebut, date);
        setCongeForm({ ...congeForm, dateFin: date, nombreJours: jours });
      } else {
        // Date invalide, réinitialiser
        setCongeForm({ ...congeForm, dateFin: undefined, nombreJours: 0 });
      }
    } else {
      setCongeForm({ ...congeForm, dateFin: undefined, nombreJours: 0 });
    }
  };

  const calculateConge = () => {
    const jours = congeForm.nombreJours;
    // Si l'indemnité forfaitaire est activée, utiliser une valeur par défaut de 1
    const indemniteForfaitaire = congeForm.indemniteForfaitaire ? parseFloat(congeForm.indemniteForfaitaire) || 1 : 0;
    const tranche = parseInt(congeForm.tranche) || 1;

    // Formule simplifiée
    const indemnite = (jours * indemniteForfaitaire * tranche) / 10;

    setCongeForm({ ...congeForm, indemniteCalculee: Math.round(indemnite) });
    toast.success('Indemnité calculée avec succès');
  };

  const saveCongeData = async () => {
    if (!selectedEmployee) return;

    if (!congeForm.dateDebut || !congeForm.dateFin) {
      toast.error('Veuillez remplir les dates de début et de fin');
      return;
    }

    try {
      // Sauvegarder dans la base de données
      // Si l'indemnité forfaitaire est activée, utiliser une valeur par défaut de 1
      const indemniteForfaitaireValue = congeForm.indemniteForfaitaire ? (parseFloat(congeForm.indemniteForfaitaire) || 1) : null;
      
      const updateData = {
        type: 'Congé',
        dateDebut: congeForm.dateDebut ? congeForm.dateDebut.toISOString().split('T')[0] : null,
        dateFin: congeForm.dateFin ? congeForm.dateFin.toISOString().split('T')[0] : null,
        tranche: parseInt(congeForm.tranche) || null,
        avanceSurConge: congeForm.avanceSurConge || false,
        montantAvance: null, // Plus de champ texte pour le montant d'avance
        indemniteForfaitaire: indemniteForfaitaireValue,
      };

      const updatedSubmission = await updateEVPSubmission(selectedEmployee.id, updateData);
      console.log('✅ Congé sauvegardé dans la BDD:', updatedSubmission);

      // Mettre à jour le state local avec les données de la BDD
      const updatedCongeData = {
        dateDebut: updatedSubmission.dateDebut ? new Date(updatedSubmission.dateDebut) : congeForm.dateDebut,
        dateFin: updatedSubmission.dateFin ? new Date(updatedSubmission.dateFin) : congeForm.dateFin,
        nombreJours: updatedSubmission.nombreJours || congeForm.nombreJours || 0,
        tranche: updatedSubmission.tranche?.toString() || congeForm.tranche,
        avanceSurConge: updatedSubmission.avanceSurConge || congeForm.avanceSurConge || false,
        montantAvance: updatedSubmission.montantAvance?.toString() || congeForm.montantAvance,
        indemniteForfaitaire: updatedSubmission.indemniteForfaitaire?.toString() || congeForm.indemniteForfaitaire,
        indemniteCalculee: typeof updatedSubmission.indemniteCalculee === 'string' 
          ? parseFloat(updatedSubmission.indemniteCalculee) || 0 
          : (updatedSubmission.indemniteCalculee || 0),
      };

      setEmployees(employees.map(emp =>
        emp.id === selectedEmployee.id
          ? { ...emp, congeData: updatedCongeData }
          : emp
      ));

      setCongeDialogOpen(false);
      toast.success('Congé enregistré avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du congé:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(`Erreur: ${errorMessage}`);
    }
  };

  // Submit handlers
  const submitEmployee = async (id: number) => {
    try {
      const employee = employees.find(e => e.id === id);
      if (!employee) {
        toast.error('Employé non trouvé');
        return;
      }

      if (!employee.primeData && !employee.congeData) {
        toast.error('Veuillez saisir au moins une prime ou un congé');
        return;
      }

      // Mettre à jour le statut dans la base de données
      console.log(`📤 Soumission de l'employé ${employee.nom} (ID: ${id})...`);
      
      // Récupérer la soumission actuelle pour vérifier le statut précédent
      const currentSubmission = allSubmissions.find((sub: EVPSubmission) => sub.id === id);
      const previousStatutPrime = currentSubmission?.prime?.statut;
      const previousStatutConge = currentSubmission?.conge?.statut;
      
      // Déterminer le nouveau statut :
      // - "Soumis" uniquement pour la première soumission (statut est "En attente" ou null)
      // - "Modifié" si précédemment rejeté ou modifié
      const isFirstSubmissionPrime = !previousStatutPrime || previousStatutPrime === 'En attente';
      const isFirstSubmissionConge = !previousStatutConge || previousStatutConge === 'En attente';
      
      const newStatutPrime = isFirstSubmissionPrime ? 'Soumis' : 'Modifié';
      const newStatutConge = isFirstSubmissionConge ? 'Soumis' : 'Modifié';
      
      // Mettre à jour le statut de la Prime ou du Congé dans la base de données
      if (saisieTab === 'prime' && employee.primeData) {
        // Envoyer les données Prime avec le statut
        const primeUpdateData: any = {
          ...employee.primeData,
          statut: newStatutPrime,
          submittedAt: new Date().toISOString()
        };
        // Si c'est une modification, supprimer le commentaire
        if (newStatutPrime === 'Modifié') {
          primeUpdateData.commentaire = null;
        }
        await updateEVPSubmission(id, { prime: primeUpdateData });
      } else if (saisieTab === 'conge' && employee.congeData) {
        // Envoyer les données Conge avec le statut
        const congeUpdateData: any = {
          ...employee.congeData,
          statut: newStatutConge,
          submittedAt: new Date().toISOString()
        };
        // Si c'est une modification, supprimer le commentaire
        if (newStatutConge === 'Modifié') {
          congeUpdateData.commentaire = null;
        }
        // Convertir les dates en format ISO string si elles sont des objets Date
        if (congeUpdateData.dateDebut instanceof Date) {
          congeUpdateData.dateDebut = congeUpdateData.dateDebut.toISOString().split('T')[0];
        }
        if (congeUpdateData.dateFin instanceof Date) {
          congeUpdateData.dateFin = congeUpdateData.dateFin.toISOString().split('T')[0];
        }
        await updateEVPSubmission(id, { conge: congeUpdateData });
      } else {
        toast.error('Aucune donnée de prime ou de congé à soumettre pour cet employé.');
        return;
      }
      
      console.log('✅ Soumission mise à jour dans la base de données');

      // Retirer l'employé de la liste après soumission
      setEmployees(employees.filter(emp => emp.id !== id));

      toast.success(`EVP de ${employee.nom} soumis pour validation`);
      
      // Recharger les données pour s'assurer de la synchronisation
      await loadEVPSubmissions(saisieTab);
    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(`Erreur lors de la soumission: ${errorMessage}`);
    }
  };

  const submitAll = async () => {
    try {
      const employeesWithData = employees.filter(e => e.primeData || e.congeData);

      if (employeesWithData.length === 0) {
        toast.error('Aucune donnée à soumettre');
        return;
      }

      // Mettre à jour le statut de tous les employés dans la base de données
      console.log(`📤 Soumission de ${employeesWithData.length} employé(s)...`);
      const updatePromises = employeesWithData.map(emp => {
        // Récupérer la soumission actuelle pour vérifier le statut précédent
        const currentSubmission = allSubmissions.find((sub: EVPSubmission) => sub.id === emp.id);
        const previousStatutPrime = currentSubmission?.prime?.statut;
        const previousStatutConge = currentSubmission?.conge?.statut;
        
        // Déterminer le nouveau statut :
        // - "Soumis" uniquement pour la première soumission (statut est "En attente" ou null)
        // - "Modifié" si précédemment rejeté ou modifié
        const isFirstSubmissionPrime = !previousStatutPrime || previousStatutPrime === 'En attente';
        const isFirstSubmissionConge = !previousStatutConge || previousStatutConge === 'En attente';
        
        const newStatutPrime = isFirstSubmissionPrime ? 'Soumis' : 'Modifié';
        const newStatutConge = isFirstSubmissionConge ? 'Soumis' : 'Modifié';
        
        if (saisieTab === 'prime' && emp.primeData) {
          const primeUpdateData: any = {
            ...emp.primeData,
            statut: newStatutPrime,
            submittedAt: new Date().toISOString()
          };
          // Si c'est une modification, supprimer le commentaire
          if (newStatutPrime === 'Modifié') {
            primeUpdateData.commentaire = null;
          }
          return updateEVPSubmission(emp.id, { prime: primeUpdateData });
        } else if (saisieTab === 'conge' && emp.congeData) {
          const congeUpdateData: any = {
            ...emp.congeData,
            statut: newStatutConge,
            submittedAt: new Date().toISOString()
          };
          // Si c'est une modification, supprimer le commentaire
          if (newStatutConge === 'Modifié') {
            congeUpdateData.commentaire = null;
          }
          // Convertir les dates en format ISO string si elles sont des objets Date
          if (congeUpdateData.dateDebut instanceof Date) {
            congeUpdateData.dateDebut = congeUpdateData.dateDebut.toISOString().split('T')[0];
          }
          if (congeUpdateData.dateFin instanceof Date) {
            congeUpdateData.dateFin = congeUpdateData.dateFin.toISOString().split('T')[0];
          }
          return updateEVPSubmission(emp.id, { conge: congeUpdateData });
        }
        return Promise.resolve();
      });
      await Promise.all(updatePromises);
      console.log('✅ Toutes les soumissions mises à jour dans la base de données');

      // Retirer tous les employés avec données de la liste après soumission
      setEmployees(employees.filter(emp => !emp.primeData && !emp.congeData));

      toast.success('Toutes les données ont été transmises pour validation hiérarchique', {
        description: `${employeesWithData.length} employé(s) soumis`,
      });
      
      // Recharger les données pour s'assurer de la synchronisation
      await loadEVPSubmissions(saisieTab);
    } catch (error) {
      console.error('❌ Erreur lors de la soumission multiple:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(`Erreur lors de la soumission: ${errorMessage}`);
    }
  };

  // Delete handlers
  const deleteEmployee = async (id: number) => {
    try {
      const employee = employees.find(e => e.id === id);
      if (!employee) {
        toast.error('Employé non trouvé');
        return;
      }

      // Déterminer le type à supprimer selon l'onglet actif
      const typeToDelete: 'Prime' | 'Congé' = saisieTab === 'prime' ? 'Prime' : 'Congé';

      console.log(`🗑️ Suppression de l'employé ${employee.nom} (ID: ${id}) pour ${typeToDelete}...`);
      await deleteEVPSubmission(id, typeToDelete);
      console.log('✅ Suppression effectuée dans la base de données');

      // Mettre à jour l'employé dans le tableau : retirer seulement les données du type supprimé
      setEmployees(prevEmployees => {
        return prevEmployees.map(emp => {
          if (emp.id === id) {
            // Retirer seulement les données du type supprimé
            if (typeToDelete === 'Prime') {
              // Si l'employé a encore des données Congé, on le garde avec seulement congeData
              if (emp.congeData) {
                return { ...emp, primeData: null };
              }
              // Sinon, on le retire complètement du tableau
              return null;
            } else {
              // Si l'employé a encore des données Prime, on le garde avec seulement primeData
              if (emp.primeData) {
                return { ...emp, congeData: null };
              }
              // Sinon, on le retire complètement du tableau
              return null;
            }
          }
          return emp;
        }).filter(emp => emp !== null) as EmployeeEVP[];
      });

      toast.success(`${typeToDelete} de ${employee.nom} supprimé avec succès`);
      
      // Recharger les données pour s'assurer de la synchronisation
      await loadEVPSubmissions(saisieTab);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(`Erreur lors de la suppression: ${errorMessage}`);
    }
  };

  const deleteAll = async () => {
    try {
      const employeesToDelete = employees.filter(e => {
        if (saisieTab === 'prime') return e.primeData;
        if (saisieTab === 'conge') return e.congeData;
        return false;
      });

      if (employeesToDelete.length === 0) {
        toast.error('Aucune donnée à supprimer');
        return;
      }

      const typeToDelete: 'Prime' | 'Congé' = saisieTab === 'prime' ? 'Prime' : 'Congé';

      console.log(`🗑️ Suppression de ${employeesToDelete.length} employé(s) pour ${typeToDelete}...`);
      const deletePromises = employeesToDelete.map(emp => 
        deleteEVPSubmission(emp.id, typeToDelete)
      );
      await Promise.all(deletePromises);
      console.log('✅ Toutes les suppressions effectuées dans la base de données');

      // Mettre à jour les employés dans le tableau : retirer seulement les données du type supprimé
      setEmployees(prevEmployees => {
        return prevEmployees.map(emp => {
          // Si cet employé avait des données du type à supprimer
          if ((typeToDelete === 'Prime' && emp.primeData) || (typeToDelete === 'Congé' && emp.congeData)) {
            // Retirer seulement les données du type supprimé
            if (typeToDelete === 'Prime') {
              // Si l'employé a encore des données Congé, on le garde avec seulement congeData
              if (emp.congeData) {
                return { ...emp, primeData: null };
              }
              // Sinon, on le retire complètement du tableau
              return null;
            } else {
              // Si l'employé a encore des données Prime, on le garde avec seulement primeData
              if (emp.primeData) {
                return { ...emp, congeData: null };
              }
              // Sinon, on le retire complètement du tableau
              return null;
            }
          }
          // Garder les autres employés tels quels
          return emp;
        }).filter(emp => emp !== null) as EmployeeEVP[];
      });

      toast.success('Toutes les données ont été supprimées avec succès', {
        description: `${employeesToDelete.length} employé(s) supprimé(s)`,
      });
      
      // Recharger les données pour s'assurer de la synchronisation
      await loadEVPSubmissions(saisieTab);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression multiple:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(`Erreur lors de la suppression: ${errorMessage}`);
    }
  };

  // Note: Les employés sont maintenant gérés par le RH, donc on ne permet plus l'ajout/modification/suppression ici
  // Les gestionnaires peuvent seulement sélectionner des employés existants

  // Add employee to EVP saisie from dropdown
  const handleAddEmployee = async (type: 'Prime' | 'Congé') => {
    try {
      console.log(`🔄 Début de l'ajout d'un employé pour ${type}, selectedEmployeeId:`, selectedEmployeeId);
      
      if (!selectedEmployeeId || selectedEmployeeId === '') {
        toast.error('Veuillez sélectionner un employé');
        return;
      }

      const employeeId = parseInt(selectedEmployeeId, 10);
      if (isNaN(employeeId)) {
        toast.error('ID employé invalide');
        setSelectedEmployeeId('');
        return;
      }

      console.log('🔍 Vérification de l\'employé avec ID:', employeeId);

      // Vérifier si l'employé existe
      const allEmployees = await getEmployees();
      const foundEmployee = allEmployees.find(emp => emp.id === employeeId);
      
      if (!foundEmployee) {
        toast.error('Employé non trouvé');
        setSelectedEmployeeId('');
        return;
      }

      console.log('✅ Employé trouvé:', foundEmployee);

      // Vérifier si l'employé a déjà une soumission en attente
      let existingSubmissions: EVPSubmission[] = [];
      try {
        existingSubmissions = await getEVPSubmissions();
        console.log('📋 Soumissions existantes:', existingSubmissions);
      } catch (error) {
        console.warn('⚠️ Erreur lors de la récupération des soumissions existantes, continuation...', error);
      }
      
      // Chercher une soumission existante pour cet employé en attente
      const existingSubmission = existingSubmissions.find(
        sub => sub.employee && sub.employee.id === employeeId && 
        (sub.statut === 'En attente' || !sub.statut || sub.statut === null)
      );
      
      let newSubmission: EVPSubmission;
      let isUpdate = false;
      
      if (existingSubmission) {
        // Si une soumission existe déjà, vérifier si le type est déjà présent
        if ((type === 'Prime' && existingSubmission.isPrime) || (type === 'Congé' && existingSubmission.isConge)) {
          toast.error(`Cet employé a déjà une soumission ${type} en attente`);
          setSelectedEmployeeId('');
          return;
        }
        
        // Mettre à jour la soumission existante pour ajouter le type manquant
        isUpdate = true;
        console.log(`📤 Mise à jour de la soumission EVP existante (ID: ${existingSubmission.id}) pour ajouter ${type}...`);
        newSubmission = await updateEVPSubmission(existingSubmission.id, { type });
        console.log('✅ Soumission mise à jour:', newSubmission);
      } else {
        // Créer une nouvelle soumission EVP via l'API avec le type correct
        console.log(`📤 Création d'une nouvelle soumission EVP pour ${type}...`);
        newSubmission = await createEVPSubmission(employeeId, type);
        console.log('✅ Soumission créée:', newSubmission);
      }
      
      if (!newSubmission || !newSubmission.id) {
        throw new Error('La soumission n\'a pas été créée correctement');
      }
      
      // Construire l'employé EVP à ajouter immédiatement au tableau
      if (newSubmission.employee) {
        const emp = newSubmission.employee;
        const nomComplet = emp.prenom ? `${emp.prenom} ${emp.nom}` : emp.nom;
        
        // Extraire les données Prime si présentes
        const primeData = newSubmission.prime && newSubmission.isPrime
          ? {
              tauxMonetaire: newSubmission.prime.tauxMonetaire?.toString() || '',
              groupe: newSubmission.prime.groupe?.toString() || '1',
              nombrePostes: newSubmission.prime.nombrePostes?.toString() || '',
              scoreEquipe: newSubmission.prime.scoreEquipe?.toString() || '',
              noteHierarchique: newSubmission.prime.noteHierarchique?.toString() || '',
              scoreCollectif: newSubmission.prime.scoreCollectif?.toString() || '',
              montantCalcule: typeof newSubmission.prime.montantCalcule === 'string' ? parseFloat(newSubmission.prime.montantCalcule) || 0 : (newSubmission.prime.montantCalcule || 0),
            }
          : null;
        
        // Extraire les données Congé si présentes
        const congeData = newSubmission.conge && newSubmission.isConge
          ? {
              dateDebut: newSubmission.conge.dateDebut ? new Date(newSubmission.conge.dateDebut) : undefined,
              dateFin: newSubmission.conge.dateFin ? new Date(newSubmission.conge.dateFin) : undefined,
              nombreJours: newSubmission.conge.nombreJours || 0,
              tranche: newSubmission.conge.tranche?.toString() || '1',
              avanceSurConge: newSubmission.conge.avanceSurConge || false,
              montantAvance: newSubmission.conge.montantAvance?.toString() || '',
              indemniteForfaitaire: newSubmission.conge.indemniteForfaitaire?.toString() || '',
              indemniteCalculee: typeof newSubmission.conge.indemniteCalculee === 'string' ? parseFloat(newSubmission.conge.indemniteCalculee) || 0 : (newSubmission.conge.indemniteCalculee || 0),
            }
          : null;
        
        const newEmployeeEVP: EmployeeEVP = {
          id: newSubmission.id,
          matricule: emp.matricule,
          nom: nomComplet,
          poste: emp.poste || '',
          primeData,
          congeData,
          isSubmitted: false,
        };
        
        console.log('✅ Employé EVP construit:', newEmployeeEVP);
        
        // Ajouter immédiatement au tableau pour un feedback visuel instantané
        setEmployees(prevEmployees => {
          // Vérifier qu'il n'est pas déjà présent
          const exists = prevEmployees.some(e => e.id === newEmployeeEVP.id || e.matricule === newEmployeeEVP.matricule);
          if (exists) {
            console.log('⚠️ Employé déjà dans le tableau, mise à jour...');
            return prevEmployees.map(e => 
              e.id === newEmployeeEVP.id || e.matricule === newEmployeeEVP.matricule ? newEmployeeEVP : e
            );
          }
          return [...prevEmployees, newEmployeeEVP];
        });
        
        console.log('✅ Employé ajouté au tableau:', newEmployeeEVP);
      }
      
      // Fermer le dialog et réinitialiser
      setSelectedEmployeeId('');
      setShowAddDialog(false);
      
      // Recharger depuis la BDD pour s'assurer de la synchronisation (en arrière-plan)
      setTimeout(async () => {
        try {
          await loadEVPSubmissions(saisieTab);
          await loadMasterEmployees();
        } catch (error) {
          console.warn('⚠️ Erreur lors du rechargement en arrière-plan:', error);
        }
      }, 500);
      
      toast.success(isUpdate 
        ? `Type ${type} ajouté à la soumission existante avec succès`
        : `Employé ajouté pour ${type} avec succès`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'employé:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'ajout de l\'employé';
      toast.error(`Erreur: ${errorMessage}`);
      // Réinitialiser l'état en cas d'erreur
      setSelectedEmployeeId('');
    }
  };

  // Request missing employee to RH
  const handleRequestEmployee = async () => {
    try {
      // Validation
      if (!requestForm.matricule || !requestForm.nom || !requestForm.prenom || !requestForm.raison) {
        toast.error('Veuillez remplir tous les champs');
        return;
      }

      console.log('📤 Envoi de la demande au RH:', requestForm);
      await createEmployeeRequest(requestForm);
      
      toast.success('Demande envoyée au service RH', {
        description: 'Le service RH traitera votre demande dans les plus brefs délais',
      });
      
      // Réinitialiser le formulaire
      setRequestForm({
        matricule: '',
        nom: '',
        prenom: '',
        raison: '',
      });
      setShowRequestDialog(false);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la demande:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(`Erreur lors de l'envoi de la demande: ${errorMessage}`);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center">
              <span className="text-white">OCP</span>
            </div>
            <div>
              <h1 className="text-slate-900">CollectEVP</h1>
              <p className="text-xs text-slate-500">Gestionnaire</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setCurrentPage('saisie')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'saisie'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileEdit className="w-5 h-5" />
            <span className="flex-1 text-left">Saisie EVP</span>
          </button>

          {currentPage === 'saisie' && (
            <div className="ml-4 space-y-1">
              <button
                onClick={() => setSaisieTab('prime')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                  saisieTab === 'prime'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Award className="w-4 h-4" />
                <span className="flex-1 text-left">Prime</span>
              </button>
              <button
                onClick={() => setSaisieTab('conge')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                  saisieTab === 'conge'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span className="flex-1 text-left">Congé</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setCurrentPage('historique')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'historique'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="flex-1 text-left">Historique</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Avatar>
              <AvatarFallback className="bg-emerald-600 text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="ghost"
            className="w-full mt-2 text-slate-600 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
            <h2 className="text-xl text-slate-900">
              {currentPage === 'saisie' 
                ? `Saisie des EVP - ${saisieTab === 'prime' ? 'Prime' : 'Congés'}` 
                : 'Historique'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.division}</p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-emerald-600 text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {currentPage === 'saisie' ? (
            <div className="space-y-6">
              {/* Welcome message */}
              <div className={`bg-gradient-to-r p-6 rounded-2xl border ${
                saisieTab === 'prime' 
                  ? 'from-emerald-50 to-white border-emerald-100' 
                  : 'from-blue-50 to-white border-blue-100'
              }`}>
                <h1 className="text-2xl text-slate-900 mb-2">
                  {saisieTab === 'prime' ? 'Saisie des Primes' : 'Saisie des Congés'}
                </h1>
                <p className="text-slate-600">
                  {saisieTab === 'prime' 
                    ? 'Gérez les primes de votre équipe' 
                    : 'Gérez les congés de votre équipe'} - {user.division}
                </p>
              </div>

              {/* Simple indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-slate-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">EVP soumis</p>
                      <p className="text-2xl text-slate-900">{submittedCount}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">En attente de soumission</p>
                      <p className="text-2xl text-orange-600">{pendingCount}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main table */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {saisieTab === 'prime' ? (
                        <Award className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <CalendarDays className="w-5 h-5 text-blue-600" />
                      )}
                      Tableau de saisie {saisieTab === 'prime' ? 'Primes' : 'Congés'} - Période: {(() => {
                        const now = new Date();
                        const month = now.toLocaleDateString('fr-FR', { month: 'long' });
                        const year = now.getFullYear();
                        return month.charAt(0).toUpperCase() + month.slice(1) + ' ' + year;
                      })()}
                    </span>
                    <div className="flex gap-3">
                      <Button
                        onClick={async () => {
                          await loadMasterEmployees();
                          await syncEmployeesWithDatabase();
                          toast.success('Données synchronisées avec la base de données');
                        }}
                        variant="outline"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        title="Synchroniser avec la base de données"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Synchroniser
                      </Button>
                      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                        {saisieTab === 'prime' ? (
                          <Button
                            onClick={() => setShowAddDialog(true)}
                            variant="outline"
                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter Prime
                          </Button>
                        ) : (
                          <Button
                            onClick={() => setShowAddDialog(true)}
                            variant="outline"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter Congé
                          </Button>
                        )}
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Ajouter un employé pour {saisieTab === 'prime' ? 'Prime' : 'Congé'}</DialogTitle>
                            <DialogDescription>
                              Sélectionnez un employé de votre équipe dans la liste déroulante
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <label className="text-sm text-slate-700 mb-2 block">Sélectionner un employé</label>
                              <Select value={selectedEmployeeId || ""} onValueChange={setSelectedEmployeeId}>
                                <SelectTrigger>
                                  <SelectValue placeholder={loadingEmployees ? "Chargement..." : masterEmployees.length === 0 ? "Aucun employé disponible" : availableEmployees.length === 0 ? "Tous les employés sont déjà dans la liste" : "Choisir un employé..."} />
                                </SelectTrigger>
                                <SelectContent>
                                  {loadingEmployees ? (
                                    <div className="px-2 py-1.5 text-sm text-slate-500">Chargement...</div>
                                  ) : masterEmployees.length === 0 ? (
                                    <div className="px-2 py-1.5 text-sm text-slate-500">Aucun employé disponible</div>
                                  ) : availableEmployees.length === 0 ? (
                                    <div className="px-2 py-1.5 text-sm text-slate-500">Tous les employés sont déjà dans la liste</div>
                                  ) : (
                                    availableEmployees.map((emp) => {
                                      const empId = String(emp.id);
                                      if (!empId || empId === '') {
                                        console.warn('Employé avec ID invalide:', emp);
                                        return null;
                                      }
                                      return (
                                        <SelectItem key={emp.id} value={empId}>
                                          {emp.matricule} - {emp.nom} ({emp.poste})
                                        </SelectItem>
                                      );
                                    }).filter(Boolean)
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            {selectedEmployeeId && masterEmployees.find(emp => emp.id.toString() === selectedEmployeeId) && (
                              <div className={`p-4 border rounded-xl ${
                                saisieTab === 'prime' 
                                  ? 'bg-emerald-50 border-emerald-100' 
                                  : 'bg-blue-50 border-blue-100'
                              }`}>
                                <p className={`text-sm ${saisieTab === 'prime' ? 'text-emerald-900' : 'text-blue-900'}`}>
                                  <strong>Matricule:</strong> {masterEmployees.find(emp => emp.id.toString() === selectedEmployeeId)?.matricule}
                                </p>
                                <p className={`text-sm ${saisieTab === 'prime' ? 'text-emerald-900' : 'text-blue-900'}`}>
                                  <strong>Nom:</strong> {masterEmployees.find(emp => emp.id.toString() === selectedEmployeeId)?.nom}
                                </p>
                                <p className={`text-sm ${saisieTab === 'prime' ? 'text-emerald-900' : 'text-blue-900'}`}>
                                  <strong>Poste:</strong> {masterEmployees.find(emp => emp.id.toString() === selectedEmployeeId)?.poste}
                                </p>
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => { setShowAddDialog(false); setSelectedEmployeeId(''); }}>
                              Annuler
                            </Button>
                            <Button 
                              onClick={() => handleAddEmployee(saisieTab === 'prime' ? 'Prime' : 'Congé')} 
                              className={saisieTab === 'prime' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}
                            >
                              Ajouter {saisieTab === 'prime' ? 'Prime' : 'Congé'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button
                        onClick={submitAll}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                        disabled={pendingCount === 0}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Soumettre tout pour validation
                      </Button>
                      <Button
                        onClick={deleteAll}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                        disabled={pendingCount === 0}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer tout
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Matricule</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Nom</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Poste</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">
                            {saisieTab === 'prime' ? 'Prime' : 'Congé'}
                          </th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">
                            {saisieTab === 'prime' ? 'Montant Prime (DH)' : 'Indemnité Congé (DH)'}
                          </th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 px-4 text-center text-slate-500">
                              {loadingSubmissions ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                                  <span>Chargement des employés...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <p>Aucun employé dans la liste de saisie EVP</p>
                                  <p className="text-xs text-slate-400">Cliquez sur "Ajouter employé" pour commencer</p>
                                </div>
                              )}
                            </td>
                          </tr>
                        ) : (
                          employees.map((employee) => (
                          <tr key={employee.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                                {employee.matricule}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-900">{employee.nom}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{employee.poste}</td>
                            <td className="py-3 px-4">
                              {saisieTab === 'prime' ? (
                                <Button
                                  size="sm"
                                  onClick={() => openPrimeDialog(employee)}
                                  className="bg-emerald-600 hover:bg-emerald-700 h-8"
                                >
                                  <Award className="w-3 h-3 mr-1" />
                                  Prime
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => openCongeDialog(employee)}
                                  className="bg-blue-600 hover:bg-blue-700 h-8"
                                >
                                  <CalendarDays className="w-3 h-3 mr-1" />
                                  Congé
                                </Button>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-slate-900">
                                {saisieTab === 'prime' 
                                  ? (employee.primeData ? `${employee.primeData.montantCalcule.toLocaleString()} DH` : '-')
                                  : (employee.congeData ? `${employee.congeData.indemniteCalculee.toLocaleString()} DH` : '-')
                                }
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => submitEmployee(employee.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 h-8"
                                  disabled={!employee.primeData && !employee.congeData}
                                >
                                  Soumettre
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => deleteEmployee(employee.id)}
                                  variant="destructive"
                                  className="bg-red-600 hover:bg-red-700 h-8"
                                  disabled={!employee.primeData && !employee.congeData}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className={`mt-6 p-4 rounded-xl border ${
                    saisieTab === 'prime' 
                      ? 'bg-emerald-50 border-emerald-100' 
                      : 'bg-blue-50 border-blue-100'
                  }`}>
                    <p className={`text-sm ${saisieTab === 'prime' ? 'text-emerald-900' : 'text-blue-900'}`}>
                      💡 <strong>Rappel:</strong> Cliquez sur "{saisieTab === 'prime' ? 'Prime' : 'Congé'}" pour saisir les données de chaque employé. 
                      Soumettez ligne par ligne ou utilisez le bouton "Soumettre tout" pour valider toutes les données en une fois.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Floating button for RH request - positioned at bottom right */}
              <div className="fixed bottom-8 right-8 z-50">
                <Button
                  onClick={() => setShowRequestDialog(true)}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 shadow-xl hover:shadow-2xl transition-all"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Envoyer une demande au RH
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-white p-6 rounded-2xl border border-emerald-100">
                <h1 className="text-2xl text-slate-900 mb-2">
                  Historique de mes soumissions
                </h1>
                <p className="text-slate-600">
                  Consultez l'historique des EVP soumis pour validation - {user.division}
                </p>
              </div>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Détail des soumissions par employé</CardTitle>
                </CardHeader>
                <CardContent className="p-4 border-b border-slate-200">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-64">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Rechercher par matricule, nom, poste..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="w-48">
                      <Select value={historyTypeFilter} onValueChange={(value: 'all' | 'prime' | 'conge') => setHistoryTypeFilter(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrer par type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les EVP</SelectItem>
                          <SelectItem value="prime">Prime</SelectItem>
                          <SelectItem value="conge">Congé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-48">
                      <Select value={historyStatusFilter} onValueChange={(value: 'all' | 'soumis' | 'a_revoir' | 'modifié') => setHistoryStatusFilter(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="soumis">Soumis</SelectItem>
                          <SelectItem value="a_revoir">A revoir</SelectItem>
                          <SelectItem value="modifié">Modifié</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardContent>
                  {loadingHistory ? (
                    <div className="text-center py-8">
                      <p className="text-slate-600">Chargement de l'historique...</p>
                    </div>
                  ) : filteredHistoricalSubmissions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-600">
                        {searchTerm ? 'Aucun résultat trouvé pour votre recherche.' : 'Aucune soumission dans l\'historique.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-slate-200">
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Matricule</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Nom</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Poste</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Type EVP</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Montant Prime (DH)</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Montant Indemnité (DH)</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Durée Congé</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Date soumission</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Statut</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Service</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Division</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Commentaire</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHistoricalSubmissions.map((submission: EVPSubmission) => {
                            const emp = submission.employee;
                            if (!emp) return null;
                            
                            const nomComplet = emp.prenom ? `${emp.prenom} ${emp.nom}` : emp.nom;
                            const types: string[] = [];
                            let montantPrime: string | number = '-';
                            let montantIndemnite: string | number = '-';
                            let dureeConge: string = '-';
                            
                            // Dates de soumission - deux lignes empilées
                            const formatDate = (dateStr: string | undefined) => {
                              if (!dateStr) return null;
                              return new Date(dateStr).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              });
                            };
                            const datePrime = formatDate(submission.prime?.submittedAt);
                            const dateConge = formatDate(submission.conge?.submittedAt);
                            
                            // Traiter Prime
                            if (submission.isPrime && submission.prime) {
                              types.push('Prime');
                              montantPrime = submission.prime.montantCalcule 
                                ? (typeof submission.prime.montantCalcule === 'string' 
                                    ? parseFloat(submission.prime.montantCalcule) 
                                    : submission.prime.montantCalcule)
                                : '-';
                            }
                            
                            // Traiter Congé
                            if (submission.isConge && submission.conge) {
                              types.push('Congé');
                              montantIndemnite = submission.conge.indemniteCalculee 
                                ? (typeof submission.conge.indemniteCalculee === 'string' 
                                    ? parseFloat(submission.conge.indemniteCalculee) 
                                    : submission.conge.indemniteCalculee)
                                : '-';
                              dureeConge = submission.conge.nombreJours 
                                ? `${submission.conge.nombreJours} jour(s)`
                                : '-';
                            }
                            
                            // Si aucun type, afficher "-" pour Type EVP
                            if (types.length === 0) {
                              types.push('-');
                            }

                            // Déterminer les réponses Service et Division pour Prime
                            const getPrimeServiceResponse = () => {
                              if (!submission.prime) return null;
                              const statut = submission.prime.statut || 'En attente';
                              if (statut === 'Rejeté') return 'Rejetée';
                              if (statut === 'Validé Service' || statut === 'Validé Division' || statut === 'Validé') return 'Validée';
                              return 'En attente';
                            };

                            const getPrimeDivisionResponse = () => {
                              if (!submission.prime) return null;
                              const statut = submission.prime.statut || 'En attente';
                              if (statut === 'Rejeté') return 'Rejetée';
                              if (statut === 'Validé Division' || statut === 'Validé') return 'Validée';
                              if (statut === 'Validé Service') return 'En attente';
                              return 'En attente';
                            };

                            // Déterminer les réponses Service et Division pour Congé
                            const getCongeServiceResponse = () => {
                              if (!submission.conge) return null;
                              const statut = submission.conge.statut || 'En attente';
                              if (statut === 'Rejeté') return 'Rejetée';
                              if (statut === 'Validé Service' || statut === 'Validé Division' || statut === 'Validé') return 'Validée';
                              return 'En attente';
                            };

                            const getCongeDivisionResponse = () => {
                              if (!submission.conge) return null;
                              const statut = submission.conge.statut || 'En attente';
                              // Si rejeté par le service, ne pas afficher de statut Division (laisser vide)
                              if (statut === 'Rejeté') return null;
                              if (statut === 'Validé Division' || statut === 'Validé') return 'Validée';
                              if (statut === 'Validé Service') return 'En attente';
                              return 'En attente';
                            };

                            // Commentaires - combiner Prime et Congé
                            const commentairePrime = submission.prime?.commentaire || null;
                            const commentaireConge = submission.conge?.commentaire || null;
                            
                            return (
                              <tr key={submission.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                                    {emp.matricule || '-'}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-900">{nomComplet || '-'}</td>
                                <td className="py-3 px-4 text-sm text-slate-600">{emp.poste || '-'}</td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-col gap-1">
                                    {types.map((type, idx) => (
                                      type === '-' ? (
                                        <span key={idx} className="text-slate-400 text-xs">-</span>
                                      ) : (
                                        <Badge 
                                          key={idx}
                                          className={type === 'Prime' 
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                            : 'bg-blue-50 text-blue-700 border border-blue-200'}
                                        >
                                          {type}
                                        </Badge>
                                      )
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-900">
                                  {montantPrime !== '-' ? `${typeof montantPrime === 'number' ? montantPrime.toLocaleString('fr-FR') : montantPrime} DH` : '-'}
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-900">
                                  {montantIndemnite !== '-' ? `${typeof montantIndemnite === 'number' ? montantIndemnite.toLocaleString('fr-FR') : montantIndemnite} DH` : '-'}
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-600">{dureeConge || '-'}</td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-col gap-1 text-sm text-slate-600">
                                    {datePrime && (
                                      <div>{datePrime}</div>
                                    )}
                                    {dateConge && (
                                      <div>{dateConge}</div>
                                    )}
                                    {!datePrime && !dateConge && <span>-</span>}
                                  </div>
                                </td>
                                {/* Colonne Statut */}
                                <td className="py-3 px-4">
                                  <div className="flex flex-col gap-1">
                                    {submission.isPrime && submission.prime && (
                                      <div className="mb-1">
                                        {submission.prime.statut === 'Rejeté' ? (
                                          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">A revoir</Badge>
                                        ) : submission.prime.statut === 'Modifié' ? (
                                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Modifié</Badge>
                                        ) : submission.prime.submittedAt ? (
                                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Soumis</Badge>
                                        ) : (
                                          <span className="text-slate-400 text-xs">-</span>
                                        )}
                                      </div>
                                    )}
                                    {submission.isConge && submission.conge && (
                                      <div>
                                        {submission.conge.statut === 'Rejeté' ? (
                                          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">A revoir</Badge>
                                        ) : submission.conge.statut === 'Modifié' ? (
                                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Modifié</Badge>
                                        ) : submission.conge.submittedAt ? (
                                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Soumis</Badge>
                                        ) : (
                                          <span className="text-slate-400 text-xs">-</span>
                                        )}
                                      </div>
                                    )}
                                    {!submission.isPrime && !submission.isConge && (
                                      <span className="text-slate-400 text-xs">-</span>
                                    )}
                                  </div>
                                </td>
                                {/* Colonne Service */}
                                <td className="py-3 px-4">
                                  <div className="flex flex-col gap-1">
                                    {submission.isPrime && submission.prime ? (
                                      <div className="mb-1">
                                        {getPrimeServiceResponse() === 'Validée' ? (
                                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Validée</Badge>
                                        ) : getPrimeServiceResponse() === 'Rejetée' ? (
                                          <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Rejetée</Badge>
                                        ) : getPrimeServiceResponse() === 'En attente' ? (
                                          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">En attente</Badge>
                                        ) : (
                                          <span className="text-slate-400 text-xs">-</span>
                                        )}
                                      </div>
                                    ) : null}
                                    {submission.isConge && submission.conge ? (
                                      <div>
                                        {getCongeServiceResponse() === 'Validée' ? (
                                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Validée</Badge>
                                        ) : getCongeServiceResponse() === 'Rejetée' ? (
                                          <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Rejetée</Badge>
                                        ) : getCongeServiceResponse() === 'En attente' ? (
                                          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">En attente</Badge>
                                        ) : (
                                          <span className="text-slate-400 text-xs">-</span>
                                        )}
                                      </div>
                                    ) : null}
                                    {!submission.isPrime && !submission.isConge && (
                                      <span className="text-slate-400 text-xs">-</span>
                                    )}
                                  </div>
                                </td>
                                {/* Colonne Division */}
                                <td className="py-3 px-4">
                                  <div className="flex flex-col gap-1">
                                    {submission.isPrime && submission.prime ? (
                                      <div className="mb-1">
                                        {getPrimeDivisionResponse() === 'Validée' ? (
                                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Validée</Badge>
                                        ) : getPrimeDivisionResponse() === 'En attente' ? (
                                          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">En attente</Badge>
                                        ) : (
                                          <span className="text-slate-400 text-xs">-</span>
                                        )}
                                      </div>
                                    ) : null}
                                    {submission.isConge && submission.conge ? (
                                      <div>
                                        {getCongeDivisionResponse() === 'Validée' ? (
                                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Validée</Badge>
                                        ) : getCongeDivisionResponse() === 'En attente' ? (
                                          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">En attente</Badge>
                                        ) : (
                                          <span className="text-slate-400 text-xs">-</span>
                                        )}
                                      </div>
                                    ) : null}
                                    {!submission.isPrime && !submission.isConge && (
                                      <span className="text-slate-400 text-xs">-</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-col gap-1 text-sm text-slate-600 italic">
                                    {/* Prime en haut - afficher le commentaire même si validé */}
                                    {commentairePrime ? (
                                      <div>
                                        <span className={submission.prime?.statut === 'Rejeté' ? 'text-red-600' : 'text-slate-600'}>{commentairePrime}</span>
                                      </div>
                                    ) : submission.isPrime && submission.prime ? (
                                      <span className="text-slate-400">-</span>
                                    ) : null}
                                    {/* Congé en bas - afficher le commentaire même si validé */}
                                    {commentaireConge ? (
                                      <div>
                                        <span className={submission.conge?.statut === 'Rejeté' ? 'text-red-600' : 'text-slate-600'}>{commentaireConge}</span>
                                      </div>
                                    ) : submission.isConge && submission.conge ? (
                                      <span className="text-slate-400">-</span>
                                    ) : null}
                                    {/* Si aucun type EVP, afficher "-" */}
                                    {!submission.isPrime && !submission.isConge && (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {!loadingHistory && filteredHistoricalSubmissions.length > 0 && (
                    <div className="mt-4 text-sm text-slate-600">
                      Affichage de {filteredHistoricalSubmissions.length} soumission(s)
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Prime Dialog */}
      <Dialog open={primeDialogOpen} onOpenChange={setPrimeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Saisie d'une prime de performance – Employé {selectedEmployee?.nom}</DialogTitle>
            <DialogDescription>
              Remplissez les informations nécessaires au calcul de la prime de performance
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-700">Taux monétaire</label>
              <Input
                type="number"
                placeholder="Ex: 150"
                value={primeForm.tauxMonetaire}
                onChange={(e) => setPrimeForm({ ...primeForm, tauxMonetaire: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700">Groupe</label>
              <Select value={primeForm.groupe} onValueChange={(value) => setPrimeForm({ ...primeForm, groupe: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Groupe 1</SelectItem>
                  <SelectItem value="2">Groupe 2</SelectItem>
                  <SelectItem value="3">Groupe 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700">Nombre de postes</label>
              <Input
                type="number"
                placeholder="Ex: 2"
                value={primeForm.nombrePostes}
                onChange={(e) => setPrimeForm({ ...primeForm, nombrePostes: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700">Score d'équipe</label>
              <Input
                type="number"
                placeholder="Ex: 85"
                value={primeForm.scoreEquipe}
                onChange={(e) => setPrimeForm({ ...primeForm, scoreEquipe: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700">Note hiérarchique</label>
              <Input
                type="number"
                placeholder="Ex: 90"
                value={primeForm.noteHierarchique}
                onChange={(e) => setPrimeForm({ ...primeForm, noteHierarchique: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700">Score collectif</label>
              <Input
                type="number"
                placeholder="Ex: 80"
                value={primeForm.scoreCollectif}
                onChange={(e) => setPrimeForm({ ...primeForm, scoreCollectif: e.target.value })}
              />
            </div>
          </div>

          {primeForm.montantCalcule > 0 && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-sm text-emerald-900 flex items-center gap-2">
                <Award className="w-5 h-5" />
                <strong>Montant calculé : {primeForm.montantCalcule.toLocaleString()} DH</strong>
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPrimeDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={calculatePrime} className="bg-blue-600 hover:bg-blue-700">
              Calculer
            </Button>
            <Button onClick={savePrimeData} className="bg-emerald-600 hover:bg-emerald-700">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Congé Dialog */}
      <Dialog open={congeDialogOpen} onOpenChange={setCongeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Saisie d'un congé – Employé {selectedEmployee?.nom}</DialogTitle>
            <DialogDescription>
              Remplissez les informations nécessaires au calcul de l'indemnité de congé
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-700 font-medium">Date début * (JJ/MM/AAAA)</label>
              <Input
                type="text"
                placeholder="JJ/MM/AAAA"
                value={dateDebutText}
                onChange={(e) => handleDateDebutChange(e.target.value)}
                maxLength={10}
                className="font-mono"
              />
              {dateDebutText.length === 10 && !congeForm.dateDebut && (
                <p className="text-xs text-red-500">Date invalide. Format attendu: JJ/MM/AAAA</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700 font-medium">Date fin * (JJ/MM/AAAA)</label>
              <Input
                type="text"
                placeholder="JJ/MM/AAAA"
                value={dateFinText}
                onChange={(e) => handleDateFinChange(e.target.value)}
                maxLength={10}
                className="font-mono"
                disabled={!congeForm.dateDebut}
              />
              {dateFinText.length === 10 && !congeForm.dateFin && (
                <p className="text-xs text-red-500">Date invalide. Format attendu: JJ/MM/AAAA</p>
              )}
              {!congeForm.dateDebut && (
                <p className="text-xs text-slate-500">Sélectionnez d'abord la date début</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700">Nombre de jours</label>
              <Input
                type="number"
                value={congeForm.nombreJours || 0}
                disabled
                className="bg-slate-50"
                placeholder={congeForm.dateDebut && congeForm.dateFin ? "Calculé automatiquement" : "Sélectionnez les dates"}
              />
              {congeForm.dateDebut && congeForm.dateFin && congeForm.nombreJours > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Du {dateDebutText} au {dateFinText} = {congeForm.nombreJours} jour{congeForm.nombreJours > 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700">Tranche</label>
              <Select value={congeForm.tranche} onValueChange={(value) => setCongeForm({ ...congeForm, tranche: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Tranche 1</SelectItem>
                  <SelectItem value="2">Tranche 2</SelectItem>
                  <SelectItem value="3">Tranche 3</SelectItem>
                  <SelectItem value="4">Tranche 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <label className="text-sm text-slate-700">Avance sur congé</label>
                <Switch
                  checked={congeForm.avanceSurConge}
                  onCheckedChange={(checked) => setCongeForm({ ...congeForm, avanceSurConge: checked })}
                />
              </div>
            </div>

            <div className="space-y-2 col-span-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <label className="text-sm text-slate-700">Indemnité forfaitaire de projet</label>
                <Switch
                  checked={!!congeForm.indemniteForfaitaire}
                  onCheckedChange={(checked) => setCongeForm({ ...congeForm, indemniteForfaitaire: checked ? '1' : '' })}
                />
              </div>
            </div>
          </div>

          {congeForm.indemniteCalculee > 0 && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="space-y-2">
                <p className="text-sm text-blue-900 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  <strong>
                    Congé du {dateDebutText} au {dateFinText} — {congeForm.nombreJours} jours
                  </strong>
                </p>
                <p className="text-sm text-blue-900">
                  <strong>Indemnité estimée : {congeForm.indemniteCalculee.toLocaleString()} DH</strong>
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCongeDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={calculateConge} className="bg-blue-600 hover:bg-blue-700">
              Calculer
            </Button>
            <Button onClick={saveCongeData} className="bg-emerald-600 hover:bg-emerald-700">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Employee Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer une demande au RH</DialogTitle>
            <DialogDescription>
              Signalez un employé manquant ou non déclaré au service des Ressources Humaines
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-900">
                <strong>Important :</strong> Cette demande sera envoyée au service RH qui ajoutera l'employé dans le système central. Vous recevrez une notification une fois l'employé ajouté.
              </p>
            </div>
            <div>
              <label className="text-sm text-slate-700 mb-2 block">Matricule de l'employé *</label>
              <Input 
                placeholder="Ex: 45890" 
                value={requestForm.matricule}
                onChange={(e) => setRequestForm({ ...requestForm, matricule: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-slate-700 mb-2 block">Nom *</label>
              <Input 
                placeholder="Ex: Benjelloun" 
                value={requestForm.nom}
                onChange={(e) => setRequestForm({ ...requestForm, nom: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-slate-700 mb-2 block">Prénom *</label>
              <Input 
                placeholder="Ex: Hassan" 
                value={requestForm.prenom}
                onChange={(e) => setRequestForm({ ...requestForm, prenom: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-slate-700 mb-2 block">Raison de la demande *</label>
              <Input 
                placeholder="Ex: Nouvel employé non enregistré" 
                value={requestForm.raison}
                onChange={(e) => setRequestForm({ ...requestForm, raison: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRequestDialog(false);
              setRequestForm({ matricule: '', nom: '', prenom: '', raison: '' });
            }}>
              Annuler
            </Button>
            <Button onClick={handleRequestEmployee} className="bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              Envoyer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
