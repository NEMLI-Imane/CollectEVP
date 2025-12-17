import React, { useState, useEffect } from 'react';
import { User } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Switch } from './ui/switch';
import { LayoutDashboard, FileText, Download, Database, LogOut, CheckCircle2, Search, Menu, Users, UserPlus, MessageSquarePlus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, Employee, getEmployeeRequests, processEmployeeRequest, EmployeeRequest, getEVPSubmissions, EVPSubmission } from '../services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface RHPageProps {
  user: User;
  onLogout: () => void;
}

interface EVPRecord {
  id: number;
  matricule: string;
  employee: string;
  division: string;
  service: string;
  type: string;
  amount: string;
  submittedDate: string;
  validatedDate: string;
  status: 'pending' | 'validated' | 'rejected';
  validatedBy: string;
}


// ManagerRequest interface is now using EmployeeRequest from API

export default function RHPage({ user, onLogout }: RHPageProps) {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'reporting' | 'export' | 'settings' | 'employees' | 'requests'>('dashboard');
  const [exportView, setExportView] = useState<'primes' | 'conges'>('primes');
  const [exportData, setExportData] = useState<EVPSubmission[]>([]);
  const [loadingExport, setLoadingExport] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [erpIntegration, setErpIntegration] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success'>('idle');
  
  // Employees management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterService, setFilterService] = useState('all');
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    poste: '',
    service: '',
    division: '',
  });

  // Charger les employés depuis l'API au chargement et quand on accède à la page employees
  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (currentPage === 'employees') {
      loadEmployees();
    }
    if (currentPage === 'requests') {
      console.log('🔄 Chargement des demandes car currentPage = requests');
      loadEmployeeRequests();
    }
    if (currentPage === 'reporting') {
      console.log('🔄 Chargement de l\'historique pour le reporting');
      loadHistoricalSubmissions();
    }
    if (currentPage === 'export') {
      loadExportData();
    }
  }, [currentPage, exportView]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      console.log('Chargement des employés...');
      const data = await getEmployees();
      console.log('Employés chargés:', data);
      setEmployees(data);
      if (data.length === 0) {
        console.warn('Aucun employé trouvé dans la base de données');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
      toast.error('Erreur lors du chargement des employés: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeRequests = async () => {
    try {
      setLoadingRequests(true);
      console.log('📥 Chargement des demandes d\'employé depuis l\'API...');
      const data = await getEmployeeRequests();
      console.log('✅ Demandes chargées depuis l\'API:', data);
      console.log('📊 Nombre de demandes:', data.length);
      setManagerRequests(data);
      if (data.length === 0) {
        console.warn('⚠️ Aucune demande trouvée dans la base de données');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des demandes:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Détails de l\'erreur:', errorMessage);
      toast.error('Erreur lors du chargement des demandes: ' + errorMessage);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleProcessRequest = async (requestId: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        // Ouvrir le dialogue pour compléter les informations
        const request = managerRequests.find(r => r.id === requestId);
        if (request) {
          setSelectedRequest(request);
          setApproveForm({ poste: '', service: '', division: '' });
          setShowApproveDialog(true);
        }
      } else {
        // Rejeter directement
        await processEmployeeRequest(requestId, 'reject');
        toast.success('Demande rejetée avec succès');
        await loadEmployeeRequests();
        await loadEmployees(); // Recharger les employés au cas où
      }
    } catch (error) {
      console.error('Erreur lors du traitement de la demande:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(`Erreur lors du traitement: ${errorMessage}`);
    }
  };

  const handleApproveWithDetails = async () => {
    if (!selectedRequest) return;

    try {
      // Validation
      if (!approveForm.poste || !approveForm.service || !approveForm.division) {
        toast.error('Veuillez remplir tous les champs (poste, service, division)');
        return;
      }

      console.log('📤 Approbation de la demande avec détails:', { requestId: selectedRequest.id, approveForm });
      await processEmployeeRequest(selectedRequest.id, 'approve', approveForm);
      
      toast.success('Employé créé avec succès');
      setShowApproveDialog(false);
      setSelectedRequest(null);
      setApproveForm({ poste: '', service: '', division: '' });
      
      // Recharger les demandes et les employés
      await loadEmployeeRequests();
      await loadEmployees();
    } catch (error) {
      console.error('❌ Erreur lors de l\'approbation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(`Erreur lors de l'approbation: ${errorMessage}`);
    }
  };

  // Charger l'historique des soumissions pour le reporting
  const loadHistoricalSubmissions = async () => {
    try {
      setLoadingHistorical(true);
      console.log('📥 Chargement de l\'historique des soumissions EVP...');
      const allSubmissions = await getEVPSubmissions();
      
      // Filtrer pour ne garder que les soumissions soumises/validées/rejetées (pas "En attente")
      const historical = allSubmissions.filter(sub => {
        const primeStatus = sub.prime?.statut;
        const congeStatus = sub.conge?.statut;
        // Garder si au moins une des deux (Prime ou Congé) est soumise/validée/rejetée
        return (primeStatus && primeStatus !== 'En attente') || (congeStatus && congeStatus !== 'En attente');
      });

      // Trier par date de soumission (les plus récentes en premier)
      historical.sort((a, b) => {
        const dateA = a.prime?.submittedAt || a.conge?.submittedAt || '';
        const dateB = b.prime?.submittedAt || b.conge?.submittedAt || '';
        return dateB.localeCompare(dateA); // Ordre décroissant (plus récent en premier)
      });

      console.log('✅ Historique chargé:', historical.length, 'soumissions');
      setHistoricalSubmissions(historical);
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'historique:', error);
      toast.error('Erreur lors du chargement de l\'historique: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setLoadingHistorical(false);
    }
  };

  
  // Manager requests
  const [managerRequests, setManagerRequests] = useState<EmployeeRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EmployeeRequest | null>(null);
  const [approveForm, setApproveForm] = useState({
    poste: '',
    service: '',
    division: '',
  });

  // Reporting - Historical submissions
  const [historicalSubmissions, setHistoricalSubmissions] = useState<EVPSubmission[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [reportingSearchTerm, setReportingSearchTerm] = useState('');
  const [reportingFilterDivision, setReportingFilterDivision] = useState('all');
  const [reportingFilterType, setReportingFilterType] = useState<'all' | 'prime' | 'conge'>('all');
  const [reportingFilterStatus, setReportingFilterStatus] = useState('all');
  const [reportingFilterGestionnaire, setReportingFilterGestionnaire] = useState('all');

  // Filtrer les soumissions historiques pour le reporting
  const filteredHistoricalSubmissions = historicalSubmissions.filter(sub => {
    const employee = sub.employee;
    if (!employee) return false;

    // Filtre par recherche (matricule, nom, prénom, poste)
    const searchLower = reportingSearchTerm.toLowerCase();
    const matchesSearch = !reportingSearchTerm || 
      employee.matricule?.toLowerCase().includes(searchLower) ||
      employee.nom?.toLowerCase().includes(searchLower) ||
      employee.prenom?.toLowerCase().includes(searchLower) ||
      employee.poste?.toLowerCase().includes(searchLower);

    // Filtre par division
    const matchesDivision = reportingFilterDivision === 'all' || employee.division === reportingFilterDivision;

    // Fonction pour déterminer le statut affiché (soumis/validé/rejeté)
    const getPrimeStatusDisplay = () => {
      if (!sub.isPrime || !sub.prime) return null;
      const statut = sub.prime.statut || 'En attente';
      if (statut === 'Soumis' || statut === 'Modifié') return 'soumis';
      if (statut === 'Validé Service' || statut === 'Validé Division' || statut === 'Validé') return 'valide';
      if (statut === 'Rejeté') return 'rejete';
      return null;
    };

    const getCongeStatusDisplay = () => {
      if (!sub.isConge || !sub.conge) return null;
      const statut = sub.conge.statut || 'En attente';
      if (statut === 'Soumis' || statut === 'Modifié') return 'soumis';
      if (statut === 'Validé Service' || statut === 'Validé Division' || statut === 'Validé') return 'valide';
      if (statut === 'Rejeté') return 'rejete';
      return null;
    };

    // Filtre par type (Prime/Congé)
    let matchesType = true;
    if (reportingFilterType === 'prime') {
      // Ne garder QUE les soumissions qui ont Prime ET PAS Congé
      matchesType = sub.isPrime && sub.prime !== undefined && !(sub.isConge && sub.conge !== undefined);
    } else if (reportingFilterType === 'conge') {
      // Ne garder QUE les soumissions qui ont Congé ET PAS Prime
      matchesType = sub.isConge && sub.conge !== undefined && !(sub.isPrime && sub.prime !== undefined);
    }

    // Filtre par statut
    let matchesStatus = true;
    if (reportingFilterStatus !== 'all') {
      if (reportingFilterType === 'prime') {
        const primeStatus = getPrimeStatusDisplay();
        matchesStatus = primeStatus === reportingFilterStatus;
      } else if (reportingFilterType === 'conge') {
        const congeStatus = getCongeStatusDisplay();
        matchesStatus = congeStatus === reportingFilterStatus;
      } else {
        // Tous les EVP - vérifier que TOUS les types présents correspondent
        const primeStatus = getPrimeStatusDisplay();
        const congeStatus = getCongeStatusDisplay();
        
        // Si la demande a Prime ET Congé, les deux doivent avoir le statut sélectionné
        if (sub.isPrime && sub.prime && sub.isConge && sub.conge) {
          matchesStatus = primeStatus === reportingFilterStatus && congeStatus === reportingFilterStatus;
        } else if (sub.isPrime && sub.prime) {
          // Si seulement Prime
          matchesStatus = primeStatus === reportingFilterStatus;
        } else if (sub.isConge && sub.conge) {
          // Si seulement Congé
          matchesStatus = congeStatus === reportingFilterStatus;
        } else {
          matchesStatus = false;
        }
      }
    }

    // Filtre par gestionnaire
    const matchesGestionnaire = reportingFilterGestionnaire === 'all' || 
      sub.submittedBy?.name === reportingFilterGestionnaire;

    return matchesSearch && matchesDivision && matchesType && matchesStatus && matchesGestionnaire;
  });

  // Obtenir la liste unique des gestionnaires
  const uniqueGestionnaires = Array.from(
    new Set(historicalSubmissions.map(sub => sub.submittedBy?.name).filter(Boolean))
  ).sort();

  const records: EVPRecord[] = [
    { id: 1, matricule: 'OCP001', employee: 'Khalid Mansouri', division: 'Production', service: 'Maintenance', type: 'Prime', amount: '2500 DH', submittedDate: '2025-10-10', validatedDate: '2025-10-11', status: 'validated', validatedBy: 'F. Alami' },
    { id: 2, matricule: 'OCP002', employee: 'Salma Benjelloun', division: 'Production', service: 'Fabrication', type: 'Heures sup.', amount: '15h', submittedDate: '2025-10-10', validatedDate: '2025-10-12', status: 'validated', validatedBy: 'H. Mouhib' },
    { id: 3, matricule: 'OCP003', employee: 'Youssef Kadiri', division: 'Qualité', service: 'Contrôle', type: 'Congé', amount: '3 jours', submittedDate: '2025-10-11', validatedDate: '', status: 'pending', validatedBy: '' },
    { id: 4, matricule: 'OCP004', employee: 'Imane Semlali', division: 'Logistique', service: 'Expédition', type: 'Prime', amount: '3000 DH', submittedDate: '2025-10-11', validatedDate: '2025-10-12', status: 'validated', validatedBy: 'F. Alami' },
    { id: 5, matricule: 'OCP005', employee: 'Rachid Bousfiha', division: 'Production', service: 'Maintenance', type: 'Absence', amount: '2 jours', submittedDate: '2025-10-12', validatedDate: '', status: 'rejected', validatedBy: 'F. Alami' },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredRecords = records.filter(record => {
    const matchesDivision = filterDivision === 'all' || record.division === filterDivision;
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesSearch = record.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.matricule.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDivision && matchesStatus && matchesSearch;
  });

  const handleExportPDF = () => {
    toast.success('Export PDF lancé', {
      description: 'Le rapport sera téléchargé dans quelques instants',
    });
  };

  const handleExportCSVReporting = () => {
    toast.success('Export CSV lancé', {
      description: 'Le fichier sera téléchargé dans quelques instants',
    });
  };

  const loadExportData = async () => {
    try {
      setLoadingExport(true);
      console.log('📥 Chargement des données pour export...');
      const allSubmissions = await getEVPSubmissions();
      
      // Filtrer uniquement les soumissions validées (statut = "Validé" ou "Validé Division")
      const validatedSubmissions = allSubmissions.filter(sub => {
        if (exportView === 'primes') {
          return sub.isPrime && sub.prime && 
            (sub.prime.statut === 'Validé' || sub.prime.statut === 'Validé Division');
        } else {
          return sub.isConge && sub.conge && 
            (sub.conge.statut === 'Validé' || sub.conge.statut === 'Validé Division');
        }
      });

      console.log('✅ Données d\'export chargées:', validatedSubmissions.length);
      setExportData(validatedSubmissions);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données d\'export:', error);
      toast.error('Erreur lors du chargement des données: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setLoadingExport(false);
    }
  };

  const handleExportCSV = () => {
    try {
      let csvContent = '';
      let headers: string[] = [];
      let rows: string[][] = [];

      if (exportView === 'primes') {
        // Headers pour Prime
        headers = [
          'Matricule',
          'Nom',
          'Prénom',
          'Poste',
          'Service',
          'Division',
          'Taux Monétaire',
          'Groupe',
          'Nombre Postes',
          'Score Equipe',
          'Note Hiérarchique',
          'Score Collectif',
          'Statut',
          'Date Soumission',
          'Commentaire'
        ];

        // Rows pour Prime
        rows = exportData
          .filter(sub => sub.isPrime && sub.prime)
          .map(sub => {
            const emp = sub.employee;
            const prime = sub.prime!;
            return [
              emp?.matricule || '',
              emp?.nom || '',
              emp?.prenom || '',
              emp?.poste || '',
              emp?.service || '',
              emp?.division || '',
              prime.tauxMonetaire?.toString() || '',
              prime.groupe?.toString() || '',
              prime.nombrePostes?.toString() || '',
              prime.scoreEquipe?.toString() || '',
              prime.noteHierarchique?.toString() || '',
              prime.scoreCollectif?.toString() || '',
              prime.statut || '',
              prime.submittedAt ? new Date(prime.submittedAt).toLocaleDateString('fr-FR') : '',
              prime.commentaire || ''
            ];
          });
      } else {
        // Headers pour Congé
        headers = [
          'Matricule',
          'Nom',
          'Prénom',
          'Poste',
          'Service',
          'Division',
          'Date Début',
          'Date Fin',
          'Nombre Jours',
          'Tranche',
          'Avance sur Congé',
          'Montant Avance',
          'Indemnité Forfaitaire',
          'Statut',
          'Date Soumission',
          'Commentaire'
        ];

        // Rows pour Congé
        rows = exportData
          .filter(sub => sub.isConge && sub.conge)
          .map(sub => {
            const emp = sub.employee;
            const conge = sub.conge!;
            return [
              emp?.matricule || '',
              emp?.nom || '',
              emp?.prenom || '',
              emp?.poste || '',
              emp?.service || '',
              emp?.division || '',
              conge.dateDebut || '',
              conge.dateFin || '',
              conge.nombreJours?.toString() || '',
              conge.tranche?.toString() || '',
              conge.avanceSurConge ? 'Oui' : 'Non',
              conge.montantAvance?.toString() || '',
              conge.indemniteForfaitaire?.toString() || '',
              conge.statut || '',
              conge.submittedAt ? new Date(conge.submittedAt).toLocaleDateString('fr-FR') : '',
              conge.commentaire || ''
            ];
          });
      }

      // Construire le CSV
      csvContent = headers.join(';') + '\n';
      rows.forEach(row => {
        // Échapper les valeurs contenant des points-virgules ou des guillemets
        const escapedRow = row.map(cell => {
          const cellStr = String(cell || '');
          if (cellStr.includes(';') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        });
        csvContent += escapedRow.join(';') + '\n';
      });

      // Créer et télécharger le fichier
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `export_${exportView}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export CSV réussi', {
        description: `Le fichier ${exportView === 'primes' ? 'primes' : 'congés'} a été téléchargé`,
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'export CSV:', error);
      toast.error('Erreur lors de l\'export CSV: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  };

  const handleTestConnection = () => {
    setConnectionStatus('testing');
    setTimeout(() => {
      setConnectionStatus('success');
      toast.success('Connexion Oracle ERP réussie !');
      setTimeout(() => setConnectionStatus('idle'), 3000);
    }, 2000);
  };

  const handleAddEmployee = async () => {
    if (!employeeForm.matricule || !employeeForm.nom || !employeeForm.prenom || !employeeForm.poste || !employeeForm.service || !employeeForm.division) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const newEmployee = await createEmployee(employeeForm);
      setEmployees([...employees, newEmployee]);
      setEmployeeForm({ matricule: '', nom: '', prenom: '', poste: '', service: '', division: '' });
      setShowAddEmployeeDialog(false);
      setEditingEmployee(null);
      toast.success('Employé ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'employé:', error);
      toast.error('Erreur lors de l\'ajout de l\'employé');
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      matricule: employee.matricule,
      nom: employee.nom,
      prenom: employee.prenom,
      poste: employee.poste,
      service: employee.service,
      division: employee.division,
    });
    setShowAddEmployeeDialog(true);
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;
    if (!employeeForm.matricule || !employeeForm.nom || !employeeForm.prenom || !employeeForm.poste || !employeeForm.service || !employeeForm.division) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const updatedEmployee = await updateEmployee(editingEmployee.id, employeeForm);
      setEmployees(employees.map(emp => emp.id === editingEmployee.id ? updatedEmployee : emp));
      setEmployeeForm({ matricule: '', nom: '', prenom: '', poste: '', service: '', division: '' });
      setShowAddEmployeeDialog(false);
      setEditingEmployee(null);
      toast.success('Employé modifié avec succès');
    } catch (error) {
      console.error('Erreur lors de la modification de l\'employé:', error);
      toast.error('Erreur lors de la modification de l\'employé');
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      return;
    }

    try {
      await deleteEmployee(id);
      setEmployees(employees.filter(emp => emp.id !== id));
      toast.success('Employé supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'employé:', error);
      toast.error('Erreur lors de la suppression de l\'employé');
    }
  };


  const filteredEmployees = employees.filter(emp => {
    const matchesService = filterService === 'all' || emp.service === filterService;
    return matchesService;
  });
  
  console.log('Employés totaux:', employees.length);
  console.log('Employés filtrés:', filteredEmployees.length);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">En attente</Badge>;
      case 'validated':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Validé</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Rejeté</Badge>;
      default:
        return null;
    }
  };

  const totalRecords = records.length;
  const validatedCount = records.filter(r => r.status === 'validated').length;
  const pendingCount = records.filter(r => r.status === 'pending').length;
  const rejectedCount = records.filter(r => r.status === 'rejected').length;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center">
              <span className="text-white">OCP</span>
            </div>
            <div>
              <h1 className="text-slate-900">CollectEVP</h1>
              <p className="text-xs text-slate-500">Ressources Humaines</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'dashboard'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="flex-1 text-left">Tableau de bord RH</span>
          </button>

          <button
            onClick={() => setCurrentPage('reporting')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'reporting'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="flex-1 text-left">Reporting Global</span>
          </button>

          <button
            onClick={() => setCurrentPage('employees')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'employees'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="flex-1 text-left">Employés</span>
          </button>

          <button
            onClick={() => setCurrentPage('requests')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'requests'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <MessageSquarePlus className="w-5 h-5" />
            <span className="flex-1 text-left">Demandes Gestionnaire</span>
          </button>

          <button
            onClick={() => setCurrentPage('export')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'export'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Database className="w-5 h-5" />
            <span className="flex-1 text-left">Export</span>
          </button>

          <button
            onClick={() => setCurrentPage('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'settings'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Database className="w-5 h-5" />
            <span className="flex-1 text-left">Paramètres</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Avatar>
              <AvatarFallback className="bg-emerald-700 text-white">
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
              {currentPage === 'dashboard' && 'Tableau de bord RH'}
              {currentPage === 'reporting' && 'Reporting Global'}
              {currentPage === 'employees' && 'Gestion des Employés'}
              {currentPage === 'requests' && 'Demandes des Gestionnaires'}
              {currentPage === 'export' && 'Export'}
              {currentPage === 'settings' && 'Paramètres'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">RH - OCP Safi</p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-emerald-700 text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {currentPage === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white rounded-2xl p-6">
                <h1 className="text-2xl mb-2">Vue d'ensemble RH</h1>
                <p className="opacity-90">
                  Suivi complet des éléments variables de paie - Toutes divisions
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-600">Total EVP</p>
                    <p className="text-3xl text-slate-900 mt-1">{totalRecords}</p>
                    <p className="text-xs text-slate-500 mt-1">Ce mois</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-600">Validés</p>
                    <p className="text-3xl text-emerald-600 mt-1">{validatedCount}</p>
                    <p className="text-xs text-emerald-600 mt-1">Taux: {Math.round((validatedCount/totalRecords)*100)}%</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-600">En attente</p>
                    <p className="text-3xl text-orange-600 mt-1">{pendingCount}</p>
                    <p className="text-xs text-slate-500 mt-1">À traiter</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-600">Rejetés</p>
                    <p className="text-3xl text-red-600 mt-1">{rejectedCount}</p>
                    <p className="text-xs text-red-600 mt-1">Taux: {Math.round((rejectedCount/totalRecords)*100)}%</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Synthèse par division</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Production', 'Qualité', 'Logistique'].map(div => {
                      const divRecords = records.filter(r => r.division === div);
                      const divValidated = divRecords.filter(r => r.status === 'validated').length;
                      const divTotal = divRecords.length;
                      const rate = divTotal > 0 ? Math.round((divValidated/divTotal)*100) : 0;
                      
                      return (
                        <div key={div} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                          <div className="flex-1">
                            <p className="text-sm text-slate-900">{div}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-600"
                                  style={{ width: `${rate}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-slate-700">{rate}%</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl text-slate-900">{divTotal}</p>
                            <p className="text-xs text-slate-600">EVP</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentPage === 'reporting' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl text-slate-900">Reporting Global</h1>
              </div>

              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-64">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Rechercher par matricule, nom, prénom, poste..."
                          value={reportingSearchTerm}
                          onChange={(e) => setReportingSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <Select value={reportingFilterDivision} onValueChange={setReportingFilterDivision}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Division" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les divisions</SelectItem>
                        <SelectItem value="Production">Production</SelectItem>
                        <SelectItem value="Qualité">Qualité</SelectItem>
                        <SelectItem value="Logistique">Logistique</SelectItem>
                        <SelectItem value="Administration">Administration</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={reportingFilterType} onValueChange={(value: 'all' | 'prime' | 'conge') => setReportingFilterType(value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Type EVP" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les EVP</SelectItem>
                        <SelectItem value="prime">Prime</SelectItem>
                        <SelectItem value="conge">Congé</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={reportingFilterStatus} onValueChange={setReportingFilterStatus}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="soumis">Soumis</SelectItem>
                        <SelectItem value="valide">Validé</SelectItem>
                        <SelectItem value="rejete">Rejeté</SelectItem>
                      </SelectContent>
                    </Select>

                    {uniqueGestionnaires.length > 0 && (
                      <Select value={reportingFilterGestionnaire} onValueChange={setReportingFilterGestionnaire}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Gestionnaire" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les gestionnaires</SelectItem>
                          {uniqueGestionnaires.map((gestionnaire) => (
                            <SelectItem key={gestionnaire} value={gestionnaire}>
                              {gestionnaire}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Historique des soumissions EVP</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingHistorical ? (
                    <div className="text-center py-8 text-slate-500">Chargement de l'historique...</div>
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
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Soumis</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Service</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Division</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHistoricalSubmissions.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="text-center py-8 text-slate-500">
                                Aucune soumission trouvée
                              </td>
                            </tr>
                          ) : (
                            filteredHistoricalSubmissions.map((sub) => {
                              const employee = sub.employee;
                              const nomComplet = employee.prenom ? `${employee.prenom} ${employee.nom}` : employee.nom;
                              
                              // Type EVP - deux lignes empilées
                              const typeEVPItems = [];
                              if (sub.isPrime && sub.prime) typeEVPItems.push('Prime');
                              if (sub.isConge && sub.conge) typeEVPItems.push('Congé');

                              const montantPrime = sub.prime?.montantCalcule 
                                ? (typeof sub.prime.montantCalcule === 'string' 
                                    ? parseFloat(sub.prime.montantCalcule) 
                                    : sub.prime.montantCalcule).toFixed(2)
                                : '-';
                              
                              const montantIndemnite = sub.conge?.indemniteCalculee 
                                ? (typeof sub.conge.indemniteCalculee === 'string' 
                                    ? parseFloat(sub.conge.indemniteCalculee) 
                                    : sub.conge.indemniteCalculee).toFixed(2)
                                : '-';

                              const dureeConge = sub.conge?.nombreJours ? `${sub.conge.nombreJours} jour(s)` : '-';

                              // Dates de soumission - deux lignes empilées
                              const formatDate = (dateStr: string | undefined) => {
                                if (!dateStr) return null;
                                return new Date(dateStr).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                });
                              };
                              const datePrime = formatDate(sub.prime?.submittedAt);
                              const dateConge = formatDate(sub.conge?.submittedAt);

                              // Déterminer les réponses Service et Division pour Prime
                              const getPrimeServiceResponse = () => {
                                if (!sub.prime) return null;
                                const statut = sub.prime.statut || 'En attente';
                                if (statut === 'Rejeté') return 'Rejetée';
                                if (statut === 'Validé Service' || statut === 'Validé Division' || statut === 'Validé') return 'Validée';
                                return 'En attente';
                              };

                              const getPrimeDivisionResponse = () => {
                                if (!sub.prime) return null;
                                const statut = sub.prime.statut || 'En attente';
                                // Si rejeté par le service, ne pas afficher de statut Division (laisser vide)
                                if (statut === 'Rejeté') return null;
                                if (statut === 'Validé Division' || statut === 'Validé') return 'Validée';
                                if (statut === 'Validé Service') return 'En attente'; // Pas encore validé par division
                                return 'En attente';
                              };

                              // Déterminer les réponses Service et Division pour Congé
                              const getCongeServiceResponse = () => {
                                if (!sub.conge) return null;
                                const statut = sub.conge.statut || 'En attente';
                                if (statut === 'Rejeté') return 'Rejetée';
                                if (statut === 'Validé Service' || statut === 'Validé Division' || statut === 'Validé') return 'Validée';
                                return 'En attente';
                              };

                              const getCongeDivisionResponse = () => {
                                if (!sub.conge) return null;
                                const statut = sub.conge.statut || 'En attente';
                                // Si rejeté par le service, ne pas afficher de statut Division (laisser vide)
                                if (statut === 'Rejeté') return null;
                                if (statut === 'Validé Division' || statut === 'Validé') return 'Validée';
                                if (statut === 'Validé Service') return 'En attente'; // Pas encore validé par division
                                return 'En attente';
                              };

                              return (
                                <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                                  <td className="py-3 px-4">
                                    <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                                      {employee.matricule}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-sm text-slate-900">{nomComplet}</td>
                                  <td className="py-3 px-4 text-sm text-slate-700">{employee.poste || '-'}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex flex-col gap-1">
                                      {typeEVPItems.map((type, idx) => (
                                        <Badge 
                                          key={idx}
                                          className={type === 'Prime' 
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                            : 'bg-blue-50 text-blue-700 border border-blue-200'}
                                        >
                                          {type}
                                        </Badge>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-sm text-slate-900">{montantPrime !== '-' ? `${montantPrime} DH` : '-'}</td>
                                  <td className="py-3 px-4 text-sm text-slate-900">{montantIndemnite !== '-' ? `${montantIndemnite} DH` : '-'}</td>
                                  <td className="py-3 px-4 text-sm text-slate-700">{dureeConge}</td>
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
                                  {/* Colonne Soumis */}
                                  <td className="py-3 px-4">
                                    <div className="flex flex-col gap-1">
                                      {sub.isPrime && sub.prime && (
                                        <div className="mb-1">
                                          {/* Vérifier si c'est une resoumission : si submittedAt existe ET (statut est "Soumis" OU commentaire existe) */}
                                          {sub.prime.submittedAt && (sub.prime.statut === 'Soumis' || sub.prime.commentaire) && (
                                            <div className="flex flex-col gap-1">
                                              <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Modifié</Badge>
                                              <span className="text-xs text-slate-500">
                                                {new Date(sub.prime.submittedAt).toLocaleDateString('fr-FR', {
                                                  day: '2-digit',
                                                  month: '2-digit',
                                                  year: 'numeric'
                                                })}
                                              </span>
                                            </div>
                                          )}
                                          {/* Sinon, afficher "Oui" si soumis */}
                                          {(!sub.prime.submittedAt || (sub.prime.statut !== 'Soumis' && !sub.prime.commentaire)) && (
                                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Oui</Badge>
                                          )}
                                        </div>
                                      )}
                                      {sub.isConge && sub.conge && (
                                        <div>
                                          {/* Vérifier si c'est une resoumission : si submittedAt existe ET (statut est "Soumis" OU commentaire existe) */}
                                          {sub.conge.submittedAt && (sub.conge.statut === 'Soumis' || sub.conge.commentaire) && (
                                            <div className="flex flex-col gap-1">
                                              <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Modifié</Badge>
                                              <span className="text-xs text-slate-500">
                                                {new Date(sub.conge.submittedAt).toLocaleDateString('fr-FR', {
                                                  day: '2-digit',
                                                  month: '2-digit',
                                                  year: 'numeric'
                                                })}
                                              </span>
                                            </div>
                                          )}
                                          {/* Sinon, afficher "Oui" si soumis */}
                                          {(!sub.conge.submittedAt || (sub.conge.statut !== 'Soumis' && !sub.conge.commentaire)) && (
                                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Oui</Badge>
                                          )}
                                        </div>
                                      )}
                                      {!sub.isPrime && !sub.isConge && (
                                        <span className="text-slate-400 text-xs">-</span>
                                      )}
                                    </div>
                                  </td>
                                  {/* Colonne Service */}
                                  <td className="py-3 px-4">
                                    <div className="flex flex-col gap-1">
                                      {sub.isPrime && sub.prime && (
                                        <div className="mb-1">
                                          {getPrimeServiceResponse() === 'Validée' && (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Validée</Badge>
                                          )}
                                          {getPrimeServiceResponse() === 'Rejetée' && (
                                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Rejetée</Badge>
                                          )}
                                          {getPrimeServiceResponse() === 'En attente' && (
                                            <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">En attente</Badge>
                                          )}
                                        </div>
                                      )}
                                      {sub.isConge && sub.conge && (
                                        <div>
                                          {getCongeServiceResponse() === 'Validée' && (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Validée</Badge>
                                          )}
                                          {getCongeServiceResponse() === 'Rejetée' && (
                                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Rejetée</Badge>
                                          )}
                                          {getCongeServiceResponse() === 'En attente' && (
                                            <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">En attente</Badge>
                                          )}
                                        </div>
                                      )}
                                      {!sub.isPrime && !sub.isConge && (
                                        <span className="text-slate-400 text-xs">-</span>
                                      )}
                                    </div>
                                  </td>
                                  {/* Colonne Division */}
                                  <td className="py-3 px-4">
                                    <div className="flex flex-col gap-1">
                                      {sub.isPrime && sub.prime && (
                                        <div className="mb-1">
                                          {getPrimeDivisionResponse() === 'Validée' && (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Validée</Badge>
                                          )}
                                          {getPrimeDivisionResponse() === 'En attente' && (
                                            <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">En attente</Badge>
                                          )}
                                          {getPrimeDivisionResponse() === null && (
                                            <span className="text-slate-400 text-xs">-</span>
                                          )}
                                        </div>
                                      )}
                                      {sub.isConge && sub.conge && (
                                        <div>
                                        {getCongeDivisionResponse() === 'Validée' && (
                                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Validée</Badge>
                                        )}
                                        {getCongeDivisionResponse() === 'En attente' && (
                                          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">En attente</Badge>
                                        )}
                                        {getCongeDivisionResponse() === null && (
                                          <span className="text-slate-400 text-xs">-</span>
                                        )}
                                        </div>
                                      )}
                                      {!sub.isPrime && !sub.isConge && (
                                        <span className="text-slate-400 text-xs">-</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {currentPage === 'export' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white rounded-2xl p-6">
                <h1 className="text-2xl mb-2">Export des Données</h1>
                <p className="opacity-90">
                  Exportez les données validées des primes et congés au format CSV
                </p>
              </div>

              {/* Sous-onglets Export Primes / Export Congés */}
              <div className="flex gap-2 border-b border-slate-200">
                <button
                  onClick={() => setExportView('primes')}
                  className={`px-6 py-3 font-medium transition-all ${
                    exportView === 'primes'
                      ? 'border-b-2 border-emerald-600 text-emerald-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Export Primes
                </button>
                <button
                  onClick={() => setExportView('conges')}
                  className={`px-6 py-3 font-medium transition-all ${
                    exportView === 'conges'
                      ? 'border-b-2 border-emerald-600 text-emerald-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Export Congés
                </button>
              </div>

              <Card className="border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {exportView === 'primes' ? 'Liste des Primes Validées' : 'Liste des Congés Validés'}
                    </CardTitle>
                    <Button
                      onClick={handleExportCSV}
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={loadingExport || exportData.length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingExport ? (
                    <div className="text-center py-8 text-slate-500">Chargement des données...</div>
                  ) : exportData.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      Aucune donnée validée disponible pour l'export
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-slate-200">
                            {exportView === 'primes' ? (
                              <>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Matricule</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Nom</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Prénom</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Poste</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Service</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Division</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Taux Monétaire</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Groupe</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Nombre Postes</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Score Equipe</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Note Hiérarchique</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Score Collectif</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Statut</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Date Soumission</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Commentaire</th>
                              </>
                            ) : (
                              <>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Matricule</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Nom</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Prénom</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Poste</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Service</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Division</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Date Début</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Date Fin</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Nombre Jours</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Tranche</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Avance sur Congé</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Montant Avance</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Indemnité Forfaitaire</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Statut</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Date Soumission</th>
                                <th className="text-left py-3 px-4 text-sm text-slate-600">Commentaire</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {exportView === 'primes' ? (
                            exportData
                              .filter(sub => sub.isPrime && sub.prime)
                              .map((sub) => {
                                const emp = sub.employee;
                                const prime = sub.prime!;
                                return (
                                  <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="py-3 px-4 text-sm text-slate-900">{emp?.matricule || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-900">{emp?.nom || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-900">{emp?.prenom || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-700">{emp?.poste || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-700">{emp?.service || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-700">{emp?.division || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-900">{prime.tauxMonetaire || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-900">{prime.groupe || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-900">{prime.nombrePostes || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-900">{prime.scoreEquipe || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-900">{prime.noteHierarchique || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-900">{prime.scoreCollectif || '-'}</td>
                                    <td className="py-3 px-4">
                                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                                        {prime.statut || '-'}
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-600">
                                      {prime.submittedAt ? new Date(prime.submittedAt).toLocaleDateString('fr-FR') : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-600">{prime.commentaire || '-'}</td>
                                  </tr>
                                );
                              })
                          ) : (
                            exportData
                              .filter(sub => sub.isConge && sub.conge)
                              .map((sub) => {
                                const emp = sub.employee;
                                const conge = sub.conge!;
                                return (
                                  <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="py-3 px-4 text-sm text-slate-900">{emp?.matricule || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-900">{emp?.nom || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-900">{emp?.prenom || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-700">{emp?.poste || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-700">{emp?.service || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-700">{emp?.division || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-900">
                                      {conge.dateDebut ? new Date(conge.dateDebut).toLocaleDateString('fr-FR') : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-900">
                                      {conge.dateFin ? new Date(conge.dateFin).toLocaleDateString('fr-FR') : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-900">{conge.nombreJours || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-900">{conge.tranche || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-900">
                                      {conge.avanceSurConge ? 'Oui' : 'Non'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-900">{conge.montantAvance || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-slate-900">{conge.indemniteForfaitaire || '-'}</td>
                                    <td className="py-3 px-4">
                                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                                        {conge.statut || '-'}
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-600">
                                      {conge.submittedAt ? new Date(conge.submittedAt).toLocaleDateString('fr-FR') : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-600">{conge.commentaire || '-'}</td>
                                  </tr>
                                );
                              })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {currentPage === 'employees' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl text-slate-900">Gestion des Employés</h1>
                <Button onClick={() => setShowAddEmployeeDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Ajouter un employé
                </Button>
              </div>

              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Rechercher un employé..."
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={filterService} onValueChange={setFilterService}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Filtrer par service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les services</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Fabrication">Fabrication</SelectItem>
                        <SelectItem value="Administration">Administration</SelectItem>
                        <SelectItem value="Contrôle">Contrôle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Liste des Employés - Organisée par Service et Division</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-slate-500">Chargement des employés...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-slate-200">
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Matricule</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Nom</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Prénom</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Poste</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Service</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Division</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEmployees.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-slate-500">
                                {employees.length === 0 
                                  ? 'Aucun employé dans la base de données. Cliquez sur "Ajouter un employé" pour commencer.'
                                  : `Aucun employé trouvé pour le service "${filterService}"`}
                              </td>
                            </tr>
                          ) : (
                            filteredEmployees.map((employee) => (
                              <tr key={employee.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                                    {employee.matricule}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-900">{employee.nom}</td>
                                <td className="py-3 px-4 text-sm text-slate-900">{employee.prenom}</td>
                                <td className="py-3 px-4 text-sm text-slate-700">{employee.poste}</td>
                                <td className="py-3 px-4 text-sm text-slate-700">{employee.service}</td>
                                <td className="py-3 px-4 text-sm text-slate-700">{employee.division}</td>
                                <td className="py-3 px-4">
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditEmployee(employee)}
                                      className="h-8"
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
                                      Modifier
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteEmployee(employee.id)}
                                      className="h-8 border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" />
                                      Supprimer
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {currentPage === 'requests' && (
            <div className="space-y-6">
              <h1 className="text-2xl text-slate-900">Demandes des Gestionnaires</h1>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  <strong>Info :</strong> Les gestionnaires peuvent demander l'ajout d'employés manquants ou non déclarés dans le système.
                </p>
              </div>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Liste des demandes</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingRequests ? (
                    <div className="text-center py-8 text-slate-500">Chargement des demandes...</div>
                  ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Matricule</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Nom</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Prénom</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Raison</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Demandé par</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Date de demande</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Statut</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {managerRequests.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-slate-500">
                              Aucune demande pour le moment
                            </td>
                          </tr>
                        ) : (
                          managerRequests.map((request) => {
                            const requestDate = new Date(request.requestDate).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            });
                            return (
                              <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className="border-blue-200 text-blue-700">
                                    {request.matricule}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-900">{request.nom}</td>
                                <td className="py-3 px-4 text-sm text-slate-900">{request.prenom}</td>
                                <td className="py-3 px-4 text-sm text-slate-700">{request.raison}</td>
                                <td className="py-3 px-4 text-sm text-slate-700">{request.requestedBy?.name || 'N/A'}</td>
                                <td className="py-3 px-4 text-sm text-slate-600">{requestDate}</td>
                                <td className="py-3 px-4">
                                  {request.statut === 'En attente' && (
                                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">En attente</Badge>
                                  )}
                                  {request.statut === 'Traité' && (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Traité</Badge>
                                  )}
                                  {request.statut === 'Rejeté' && (
                                    <Badge className="bg-red-100 text-red-700 border-red-200">Rejeté</Badge>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {request.statut === 'En attente' && (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleProcessRequest(request.id, 'approve')}
                                        className="bg-emerald-600 hover:bg-emerald-700 h-8"
                                      >
                                        Ajouter
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleProcessRequest(request.id, 'reject')}
                                        className="border-red-200 text-red-600 hover:bg-red-50 h-8"
                                      >
                                        Rejeter
                                      </Button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {currentPage === 'settings' && (
            <div className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Configuration Oracle ERP</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-900">Intégration Oracle ERP</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Synchronisation automatique des données validées
                      </p>
                    </div>
                    <Switch
                      checked={erpIntegration}
                      onCheckedChange={setErpIntegration}
                    />
                  </div>

                  {erpIntegration && (
                    <>
                      <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
                        <div>
                          <label className="text-sm text-slate-700 mb-2 block">URL du serveur Oracle</label>
                          <Input
                            placeholder="https://erp.ocp.ma/api"
                            defaultValue="https://erp.ocp.ma/api/v1"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-slate-700 mb-2 block">Clé API</label>
                          <Input
                            type="password"
                            placeholder="••••••••••••••••"
                            defaultValue="sk_live_xxxxxxxxxxxxx"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-slate-700 mb-2 block">Fréquence de synchronisation</label>
                          <Select defaultValue="daily">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="realtime">Temps réel</SelectItem>
                              <SelectItem value="hourly">Toutes les heures</SelectItem>
                              <SelectItem value="daily">Quotidienne</SelectItem>
                              <SelectItem value="weekly">Hebdomadaire</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={handleTestConnection}
                          disabled={connectionStatus === 'testing'}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {connectionStatus === 'testing' ? 'Test en cours...' : 'Tester la connexion'}
                        </Button>
                        {connectionStatus === 'success' && (
                          <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-sm">Connexion réussie</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Dialog pour ajouter/modifier un employé */}
      <Dialog open={showAddEmployeeDialog} onOpenChange={(open) => {
        setShowAddEmployeeDialog(open);
        if (!open) {
          setEditingEmployee(null);
          setEmployeeForm({ matricule: '', nom: '', prenom: '', poste: '', service: '', division: '' });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Modifier un employé' : 'Ajouter un nouvel employé'}</DialogTitle>
            <DialogDescription>
              {editingEmployee ? 'Modifiez les informations de l\'employé' : 'Remplissez les informations de l\'employé pour l\'ajouter au système'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-700">Matricule</label>
              <Input
                placeholder="Ex: 45876"
                value={employeeForm.matricule}
                onChange={(e) => setEmployeeForm({ ...employeeForm, matricule: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700">Nom</label>
              <Input
                placeholder="Ex: Bennani"
                value={employeeForm.nom}
                onChange={(e) => setEmployeeForm({ ...employeeForm, nom: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700">Prénom</label>
              <Input
                placeholder="Ex: Ahmed"
                value={employeeForm.prenom}
                onChange={(e) => setEmployeeForm({ ...employeeForm, prenom: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700">Poste</label>
              <Select
                value={employeeForm.poste}
                onValueChange={(value) => setEmployeeForm({ ...employeeForm, poste: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un poste" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technicien">Technicien</SelectItem>
                  <SelectItem value="agent de maîtrise">Agent de maîtrise</SelectItem>
                  <SelectItem value="cadre administratif">Cadre administratif</SelectItem>
                  <SelectItem value="cadre supérieur">Cadre supérieur</SelectItem>
                  <SelectItem value="ouvrier">Ouvrier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700">Service</label>
              <Select
                value={employeeForm.service}
                onValueChange={(value) => setEmployeeForm({ ...employeeForm, service: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Fabrication">Fabrication</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                  <SelectItem value="Contrôle">Contrôle</SelectItem>
                  <SelectItem value="Expédition">Expédition</SelectItem>
                  <SelectItem value="Logistique">Logistique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700">Division</label>
              <Select
                value={employeeForm.division}
                onValueChange={(value) => setEmployeeForm({ ...employeeForm, division: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Qualité">Qualité</SelectItem>
                  <SelectItem value="Logistique">Logistique</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddEmployeeDialog(false);
                setEditingEmployee(null);
                setEmployeeForm({ matricule: '', nom: '', prenom: '', poste: '', service: '', division: '' });
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingEmployee ? (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier l'employé
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Ajouter l'employé
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour compléter les informations lors de l'approbation d'une demande */}
      <Dialog open={showApproveDialog} onOpenChange={(open) => {
        setShowApproveDialog(open);
        if (!open) {
          setSelectedRequest(null);
          setApproveForm({ poste: '', service: '', division: '' });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compléter les informations de l'employé</DialogTitle>
            <DialogDescription>
              Ajoutez les informations manquantes pour créer l'employé dans le système
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-2">Informations de la demande :</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500">Matricule :</span>
                    <span className="ml-2 font-semibold text-slate-900">{selectedRequest.matricule}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Nom :</span>
                    <span className="ml-2 font-semibold text-slate-900">{selectedRequest.nom}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Prénom :</span>
                    <span className="ml-2 font-semibold text-slate-900">{selectedRequest.prenom}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Raison :</span>
                    <span className="ml-2 font-semibold text-slate-900">{selectedRequest.raison}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-700">Poste *</label>
                  <Select
                    value={approveForm.poste}
                    onValueChange={(value) => setApproveForm({ ...approveForm, poste: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un poste" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technicien">Technicien</SelectItem>
                      <SelectItem value="agent de maîtrise">Agent de maîtrise</SelectItem>
                      <SelectItem value="cadre administratif">Cadre administratif</SelectItem>
                      <SelectItem value="cadre supérieur">Cadre supérieur</SelectItem>
                      <SelectItem value="ouvrier">Ouvrier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-700">Service *</label>
                  <Select
                    value={approveForm.service}
                    onValueChange={(value) => setApproveForm({ ...approveForm, service: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Fabrication">Fabrication</SelectItem>
                      <SelectItem value="Administration">Administration</SelectItem>
                      <SelectItem value="Contrôle">Contrôle</SelectItem>
                      <SelectItem value="Expédition">Expédition</SelectItem>
                      <SelectItem value="Logistique">Logistique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-sm text-slate-700">Division *</label>
                  <Select
                    value={approveForm.division}
                    onValueChange={(value) => setApproveForm({ ...approveForm, division: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une division" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Production">Production</SelectItem>
                      <SelectItem value="Qualité">Qualité</SelectItem>
                      <SelectItem value="Logistique">Logistique</SelectItem>
                      <SelectItem value="Administration">Administration</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setSelectedRequest(null);
                setApproveForm({ poste: '', service: '', division: '' });
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleApproveWithDetails}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Confirmer et créer l'employé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour compléter les informations lors de l'approbation d'une demande */}
      <Dialog open={showApproveDialog} onOpenChange={(open) => {
        setShowApproveDialog(open);
        if (!open) {
          setSelectedRequest(null);
          setApproveForm({ poste: '', service: '', division: '' });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compléter les informations de l'employé</DialogTitle>
            <DialogDescription>
              Ajoutez les informations manquantes pour créer l'employé dans le système
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-2">Informations de la demande :</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500">Matricule :</span>
                    <span className="ml-2 font-semibold text-slate-900">{selectedRequest.matricule}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Nom :</span>
                    <span className="ml-2 font-semibold text-slate-900">{selectedRequest.nom}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Prénom :</span>
                    <span className="ml-2 font-semibold text-slate-900">{selectedRequest.prenom}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Raison :</span>
                    <span className="ml-2 font-semibold text-slate-900">{selectedRequest.raison}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-700">Poste *</label>
                  <Select
                    value={approveForm.poste}
                    onValueChange={(value) => setApproveForm({ ...approveForm, poste: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un poste" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technicien">Technicien</SelectItem>
                      <SelectItem value="agent de maîtrise">Agent de maîtrise</SelectItem>
                      <SelectItem value="cadre administratif">Cadre administratif</SelectItem>
                      <SelectItem value="cadre supérieur">Cadre supérieur</SelectItem>
                      <SelectItem value="ouvrier">Ouvrier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-700">Service *</label>
                  <Select
                    value={approveForm.service}
                    onValueChange={(value) => setApproveForm({ ...approveForm, service: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Fabrication">Fabrication</SelectItem>
                      <SelectItem value="Administration">Administration</SelectItem>
                      <SelectItem value="Contrôle">Contrôle</SelectItem>
                      <SelectItem value="Expédition">Expédition</SelectItem>
                      <SelectItem value="Logistique">Logistique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-sm text-slate-700">Division *</label>
                  <Select
                    value={approveForm.division}
                    onValueChange={(value) => setApproveForm({ ...approveForm, division: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une division" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Production">Production</SelectItem>
                      <SelectItem value="Qualité">Qualité</SelectItem>
                      <SelectItem value="Logistique">Logistique</SelectItem>
                      <SelectItem value="Administration">Administration</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setSelectedRequest(null);
                setApproveForm({ poste: '', service: '', division: '' });
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleApproveWithDetails}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Confirmer et créer l'employé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
