import { useState, useEffect } from 'react';
import { User } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { CheckSquare, CheckCircle2, XCircle, Filter, Search, LogOut, Bell, BarChart3, Menu, Calendar, History } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { toast } from 'sonner';
import { getEVPSubmissions, EVPSubmission, validateEVPSubmission } from '../services/api';
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

interface ResponsableServicePageProps {
  user: User;
  onLogout: () => void;
}

interface EVPSubmission {
  id: number;
  employee: string;
  matricule: string;
  type: string;
  amount: string;
  submittedBy: string;
  submittedDate: string;
  status: 'pending' | 'validated' | 'rejected';
  hasJustificatif: boolean;
}

interface MonthlyReport {
  mois: string;
  montantTotal: number;
  joursConges: number;
  statut: 'En cours' | 'Validé' | 'Clôturé';
}

export default function ResponsableServicePage({ user, onLogout }: ResponsableServicePageProps) {
  const [currentPage, setCurrentPage] = useState<'validation' | 'historique'>('validation');
  const [submissions, setSubmissions] = useState<EVPSubmission[]>([]);
  const [historicalSubmissions, setHistoricalSubmissions] = useState<EVPSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<EVPSubmission | null>(null);
  const [validationDialog, setValidationDialog] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [validationType, setValidationType] = useState<'Prime' | 'Congé' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'prime' | 'conge'>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'validé' | 'en_attente' | 'rejeté'>('all');

  // Charger les soumissions depuis l'API
  useEffect(() => {
    if (currentPage === 'validation') {
      loadSubmissions();
    } else if (currentPage === 'historique') {
      loadHistory();
    }
  }, [currentPage]);

  const loadSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      console.log('📥 Chargement des soumissions EVP pour validation service...');
      const allSubmissions = await getEVPSubmissions();
      
      // Filtrer pour ne garder que les soumissions qui ont au moins un type en attente
      // (statut = "Soumis" ou "Modifié" ou "Rejeté" après validation service par la division)
      // Les types rejetés par le respo service ou validés seront filtrés dans le rendu
      const submittedSubmissions = allSubmissions.filter(sub => {
        const primeStatus = sub.prime?.statut;
        const congeStatus = sub.conge?.statut;
        
        // Vérifier si au moins un type est encore "Soumis" ou "Modifié" (en attente de validation)
        // OU rejeté par la division après validation service (doit revenir chez le respo service)
        // IMPORTANT: Si un type est rejeté par le service (valideService = false), on vérifie quand même
        // si l'autre type est encore en attente ou rejeté par la division
        // Vérifier si un type est encore en attente (pas validé, pas rejeté par le service)
        const hasPrimePending = sub.isPrime && sub.prime && (
          (primeStatus === 'Soumis' || 
           primeStatus === 'Modifié' || 
           (primeStatus === 'Rejeté' && sub.valideService)) && // Rejeté par la division (doit revenir)
          primeStatus !== 'Validé Service' && 
          primeStatus !== 'Validé Division' && 
          primeStatus !== 'Validé' // Exclure les types déjà validés
        );
        const hasCongePending = sub.isConge && sub.conge && (
          (congeStatus === 'Soumis' || 
           congeStatus === 'Modifié' || 
           (congeStatus === 'Rejeté' && sub.valideService)) && // Rejeté par la division (doit revenir)
          congeStatus !== 'Validé Service' && 
          congeStatus !== 'Validé Division' && 
          congeStatus !== 'Validé' // Exclure les types déjà validés
        );
        
        // Cas spécial: Si un type est rejeté par le service (valideService = false), 
        // vérifier si l'autre type est encore en attente ou rejeté par la division
        // Si Prime est rejeté par le service mais Congé est encore en attente, garder la soumission
        const primeRejectedByService = sub.isPrime && sub.prime && 
          primeStatus === 'Rejeté' && !sub.valideService;
        const congeRejectedByService = sub.isConge && sub.conge && 
          congeStatus === 'Rejeté' && !sub.valideService;
        
        // Si les deux types sont rejetés par le service, ne pas garder la soumission
        if (primeRejectedByService && congeRejectedByService) {
          console.log('🚫 Soumission exclue (les deux types rejetés par le service):', sub.id);
          return false; // Les deux sont rejetés par le service, ne pas garder
        }
        
        // Si Prime est rejeté par le service, vérifier si Congé est encore en attente
        if (primeRejectedByService) {
          // Si Congé est "Soumis" ou "Modifié", il est encore en attente → garder la soumission
          if (sub.isConge && sub.conge && (congeStatus === 'Soumis' || congeStatus === 'Modifié')) {
            return true;
          }
          // Si Congé est aussi rejeté, vérifier s'il était rejeté par la division
          // Si Congé est rejeté ET a un commentaire, alors il était probablement rejeté par la division
          // (car le commentaire de la division est toujours présent, même après que valideService soit mis à false)
          if (sub.isConge && sub.conge && congeStatus === 'Rejeté' && sub.conge.commentaire) {
            return true; // Congé était probablement rejeté par la division (a un commentaire), garder la soumission
          }
          // Si Congé est rejeté mais n'a pas de commentaire, ne pas garder (les deux sont rejetés par le service)
          console.log('🚫 Soumission exclue (Prime rejeté par service, Congé aussi rejeté par service):', sub.id);
          return false;
        }
        
        // Si Congé est rejeté par le service, vérifier si Prime est encore en attente
        if (congeRejectedByService) {
          // Si Prime est "Soumis" ou "Modifié", il est encore en attente → garder la soumission
          if (sub.isPrime && sub.prime && (primeStatus === 'Soumis' || primeStatus === 'Modifié')) {
            return true;
          }
          // Si Prime est aussi rejeté, vérifier s'il était rejeté par la division
          // Si Prime est rejeté ET a un commentaire, alors il était probablement rejeté par la division
          // (car le commentaire de la division est toujours présent, même après que valideService soit mis à false)
          if (sub.isPrime && sub.prime && primeStatus === 'Rejeté' && sub.prime.commentaire) {
            return true; // Prime était probablement rejeté par la division (a un commentaire), garder la soumission
          }
          // Si Prime est rejeté mais n'a pas de commentaire, ne pas garder (les deux sont rejetés par le service)
          console.log('🚫 Soumission exclue (Congé rejeté par service, Prime aussi rejeté par service):', sub.id);
          return false;
        }
        
        // Garder la soumission si au moins un type est encore en attente ou rejeté par la division
        return hasPrimePending || hasCongePending;
      });

      // Trier par date de soumission (les plus récentes en premier)
      submittedSubmissions.sort((a, b) => {
        const dateA = a.prime?.submittedAt || a.conge?.submittedAt || '';
        const dateB = b.prime?.submittedAt || b.conge?.submittedAt || '';
        return dateB.localeCompare(dateA);
      });

      console.log('✅ Soumissions chargées:', submittedSubmissions.length);
      console.log('📊 Détail des soumissions filtrées:', submittedSubmissions.map(s => ({
        id: s.id,
        employee: s.employee?.nom,
        primeStatus: s.prime?.statut,
        congeStatus: s.conge?.statut,
        valideService: s.valideService,
        primeRejectedByService: s.isPrime && s.prime && s.prime.statut === 'Rejeté' && !s.valideService,
        congeRejectedByService: s.isConge && s.conge && s.conge.statut === 'Rejeté' && !s.valideService
      })));
      setSubmissions(submittedSubmissions);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des soumissions:', error);
      toast.error('Erreur lors du chargement des soumissions: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      console.log('📥 Chargement de l\'historique des validations service...');
      const allSubmissions = await getEVPSubmissions();
      
      // Filtrer pour ne garder que les soumissions qui ont été traitées par le service
      // (statut = "Soumis", "Modifié", "Validé Service", "Validé Division", "Rejeté")
      const historySubmissions = allSubmissions.filter(sub => {
        const primeStatus = sub.prime?.statut;
        const congeStatus = sub.conge?.statut;
        
        // Vérifier si au moins un type a un statut (a été traité)
        const hasPrimeProcessed = sub.isPrime && sub.prime && primeStatus;
        const hasCongeProcessed = sub.isConge && sub.conge && congeStatus;
        
        // Garder la soumission si au moins un type a un statut
        return hasPrimeProcessed || hasCongeProcessed;
      });

      // Trier par date de soumission (les plus récentes en premier)
      historySubmissions.sort((a, b) => {
        const dateA = a.prime?.submittedAt || a.conge?.submittedAt || '';
        const dateB = b.prime?.submittedAt || b.conge?.submittedAt || '';
        return dateB.localeCompare(dateA);
      });

      console.log('✅ Historique chargé:', historySubmissions.length);
      setHistoricalSubmissions(historySubmissions);
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'historique:', error);
      toast.error('Erreur lors du chargement de l\'historique: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setLoadingHistory(false);
    }
  };
  
  // Reporting states
  const [selectedMonth, setSelectedMonth] = useState('recent');
  const [monthlyReports] = useState<MonthlyReport[]>([
    { mois: 'Octobre 2025', montantTotal: 125000, joursConges: 45, statut: 'En cours' },
    { mois: 'Septembre 2025', montantTotal: 142000, joursConges: 52, statut: 'Validé' },
    { mois: 'Août 2025', montantTotal: 138000, joursConges: 78, statut: 'Clôturé' },
    { mois: 'Juillet 2025', montantTotal: 155000, joursConges: 85, statut: 'Clôturé' },
    { mois: 'Juin 2025', montantTotal: 148000, joursConges: 48, statut: 'Clôturé' },
    { mois: 'Mai 2025', montantTotal: 132000, joursConges: 42, statut: 'Clôturé' },
  ]);

  // Chart data for recent 3 months
  const recentMonthsData = monthlyReports.slice(0, 3).reverse().map(report => ({
    mois: report.mois.split(' ')[0],
    montant: report.montantTotal / 1000,
    conges: report.joursConges,
  }));

  // Type distribution data
  const typeDistribution = [
    { name: 'Primes', value: 52, color: '#059669' },
    { name: 'Heures sup.', value: 28, color: '#3b82f6' },
    { name: 'Congés', value: 15, color: '#f97316' },
    { name: 'Absences', value: 5, color: '#ef4444' },
  ];

  // Monthly trend data (all months)
  const monthlyTrendData = monthlyReports.slice().reverse().map(report => ({
    mois: report.mois.split(' ')[0],
    montant: report.montantTotal / 1000,
  }));

  const handleValidation = (submission: EVPSubmission, action: 'approve' | 'reject', type: 'Prime' | 'Congé') => {
    console.log('🔘 handleValidation appelé:', { submissionId: submission.id, action, type });
    if (!type) {
      console.error('❌ ERREUR: Le type doit être spécifié!');
      toast.error('Erreur: le type doit être spécifié');
      return;
    }
    setSelectedSubmission(submission);
    setValidationDialog(action);
    setComment('');
    setValidationType(type);
    console.log('✅ Dialog ouvert, type:', type, 'validationType:', type);
  };

  const confirmValidation = async () => {
    if (!selectedSubmission) return;

    try {
      // Si rejet, le commentaire est obligatoire
      if (validationDialog === 'reject' && !comment.trim()) {
        toast.error('Veuillez saisir un commentaire pour le rejet');
        return;
      }

      console.log('📤 Validation de la soumission:', {
        submissionId: selectedSubmission.id,
        action: validationDialog,
        type: validationType,
        comment: validationDialog === 'reject' ? comment : undefined
      });

      // Pour le rejet, le type DOIT être spécifié
      if (validationDialog === 'reject' && !validationType) {
        toast.error('Erreur: le type (Prime ou Congé) doit être spécifié pour le rejet');
        return;
      }

      const requestData: {
        niveau: 'service';
        commentaire?: string;
        type?: 'Prime' | 'Congé';
      } = {
        niveau: 'service',
      };

      if (validationDialog === 'reject') {
        requestData.commentaire = comment;
        // Le type est obligatoire pour le rejet
        if (validationType) {
          requestData.type = validationType;
        } else {
          toast.error('Erreur: le type (Prime ou Congé) doit être spécifié pour le rejet');
          return;
        }
      } else if (validationType) {
        // Pour l'approbation, le type est optionnel mais peut être fourni
        requestData.type = validationType;
      }

      console.log('📤 Appel API validateEVPSubmission:', {
        submissionId: selectedSubmission.id,
        action: validationDialog,
        requestData
      });

      const response = await validateEVPSubmission(selectedSubmission.id, validationDialog === 'approve' ? 'approve' : 'reject', requestData);
      
      console.log('✅ Réponse API:', response);

      const actionText = validationDialog === 'approve' ? 'validé' : 'rejeté';
      const employee = selectedSubmission.employee;
      const employeeName = employee?.prenom 
        ? `${employee.prenom} ${employee.nom}`
        : employee?.nom || 'Employé';
      const typeText = validationType ? ` (${validationType})` : '';
      
      toast.success(`EVP ${actionText} avec succès${typeText}`, {
        description: `${employeeName}`,
      });

      setValidationDialog(null);
      setSelectedSubmission(null);
      setComment('');
      setValidationType(null);

      // Recharger les soumissions
      console.log('🔄 Rechargement des soumissions...');
      // Forcer le rechargement en vidant d'abord les soumissions
      setSubmissions([]);
      await loadSubmissions();
      console.log('✅ Soumissions rechargées');
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(`Erreur lors de la validation: ${errorMessage}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredSubmissions = submissions.filter(sub => {
    const employee = sub.employee;
    if (!employee) return false;

    // Filtre par recherche (matricule, nom, prénom, poste)
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      employee.matricule?.toLowerCase().includes(searchLower) ||
      employee.nom?.toLowerCase().includes(searchLower) ||
      employee.prenom?.toLowerCase().includes(searchLower) ||
      employee.poste?.toLowerCase().includes(searchLower);

    return matchesSearch;
  });

  const filteredHistory = historicalSubmissions.filter(sub => {
    const employee = sub.employee;
    if (!employee) return false;

    // Filtre par recherche (matricule, nom, prénom, poste)
    const searchLower = historySearchTerm.toLowerCase();
    const matchesSearch = !historySearchTerm || 
      employee.matricule?.toLowerCase().includes(searchLower) ||
      employee.nom?.toLowerCase().includes(searchLower) ||
      employee.prenom?.toLowerCase().includes(searchLower) ||
      employee.poste?.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // Fonctions pour déterminer le statut (même logique que dans le rendu)
    const getPrimeStatus = () => {
      if (!sub.prime) return null;
      const statut = sub.prime.statut || 'En attente';
      // Si validé par le service
      if (statut === 'Validé Service') return 'Validé';
      // Si rejeté par le gestionnaire (pas encore validé par le service)
      if (statut === 'Rejeté' && !sub.valideService) return 'En attente';
      // Si rejeté par la division après validation service
      if (statut === 'Rejeté' && sub.valideService) return 'Rejeté';
      // Si validé par la division
      if (statut === 'Validé Division' || statut === 'Validé') return 'Validé';
      // Si soumis ou modifié (en attente de validation)
      if (statut === 'Soumis' || statut === 'Modifié') return 'En attente';
      return null;
    };

    const getCongeStatus = () => {
      if (!sub.conge) return null;
      const statut = sub.conge.statut || 'En attente';
      // Si validé par le service
      if (statut === 'Validé Service') return 'Validé';
      // Si rejeté par le gestionnaire (pas encore validé par le service)
      if (statut === 'Rejeté' && !sub.valideService) return 'En attente';
      // Si rejeté par la division après validation service
      if (statut === 'Rejeté' && sub.valideService) return 'Rejeté';
      // Si validé par la division
      if (statut === 'Validé Division' || statut === 'Validé') return 'Validé';
      // Si soumis ou modifié (en attente de validation)
      if (statut === 'Soumis' || statut === 'Modifié') return 'En attente';
      return null;
    };

    // Filtre par type (Prime/Congé)
    if (historyTypeFilter === 'prime') {
      // Garder les soumissions qui ont Prime (même si elles ont aussi Congé)
      if (!sub.isPrime || !sub.prime) return false;
      
      // Si un filtre de statut est spécifié, vérifier le statut de la prime
      if (historyStatusFilter !== 'all') {
        const primeStatus = getPrimeStatus();
        if (historyStatusFilter === 'validé') {
          return primeStatus === 'Validé';
        } else if (historyStatusFilter === 'en_attente') {
          return primeStatus === 'En attente';
        } else if (historyStatusFilter === 'rejeté') {
          return primeStatus === 'Rejeté';
        }
      }
      return true;
    } else if (historyTypeFilter === 'conge') {
      // Garder les soumissions qui ont Congé (même si elles ont aussi Prime)
      if (!sub.isConge || !sub.conge) return false;
      
      // Si un filtre de statut est spécifié, vérifier le statut du congé
      if (historyStatusFilter !== 'all') {
        const congeStatus = getCongeStatus();
        if (historyStatusFilter === 'validé') {
          return congeStatus === 'Validé';
        } else if (historyStatusFilter === 'en_attente') {
          return congeStatus === 'En attente';
        } else if (historyStatusFilter === 'rejeté') {
          return congeStatus === 'Rejeté';
        }
      }
      return true;
    } else {
      // Filtre "Tous les EVP" - si un filtre de statut est spécifié, vérifier que TOUS les types présents correspondent
      if (historyStatusFilter !== 'all') {
        const primeStatus = getPrimeStatus();
        const congeStatus = getCongeStatus();
        
        // Si la demande a Prime ET Congé, les deux doivent avoir le statut sélectionné
        if (sub.isPrime && sub.prime && sub.isConge && sub.conge) {
          if (historyStatusFilter === 'validé') {
            return primeStatus === 'Validé' && congeStatus === 'Validé';
          } else if (historyStatusFilter === 'en_attente') {
            return primeStatus === 'En attente' && congeStatus === 'En attente';
          } else if (historyStatusFilter === 'rejeté') {
            return primeStatus === 'Rejeté' && congeStatus === 'Rejeté';
          }
        }
        // Si seulement Prime, vérifier Prime
        if (sub.isPrime && sub.prime) {
          if (historyStatusFilter === 'validé') {
            return primeStatus === 'Validé';
          } else if (historyStatusFilter === 'en_attente') {
            return primeStatus === 'En attente';
          } else if (historyStatusFilter === 'rejeté') {
            return primeStatus === 'Rejeté';
          }
        }
        // Si seulement Congé, vérifier Congé
        if (sub.isConge && sub.conge) {
          if (historyStatusFilter === 'validé') {
            return congeStatus === 'Validé';
          } else if (historyStatusFilter === 'en_attente') {
            return congeStatus === 'En attente';
          } else if (historyStatusFilter === 'rejeté') {
            return congeStatus === 'Rejeté';
          }
        }
        return false;
      }
      return true;
    }

    return true;
  });

  const filteredReports = selectedMonth === 'recent' ? monthlyReports.slice(0, 3) : monthlyReports;

  const pendingCount = submissions.length; // Toutes les soumissions affichées sont en attente
  const validatedCount = 0; // Pas de soumissions validées dans cette vue
  const rejectedCount = 0; // Pas de soumissions rejetées dans cette vue

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

  const getReportStatusBadge = (statut: string) => {
    switch (statut) {
      case 'En cours':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">En cours</Badge>;
      case 'Validé':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Validé</Badge>;
      case 'Clôturé':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Clôturé</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-700 to-emerald-800 rounded-xl flex items-center justify-center">
              <span className="text-white">OCP</span>
            </div>
            <div>
              <h1 className="text-slate-900">CollectEVP</h1>
              <p className="text-xs text-slate-500">Responsable Service</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setCurrentPage('validation')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'validation'
                ? 'bg-gradient-to-r from-emerald-700 to-emerald-800 text-white shadow-lg shadow-emerald-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="flex-1 text-left">Validation Service</span>
            {pendingCount > 0 && currentPage !== 'validation' && (
              <Badge className="bg-orange-500 text-white">{pendingCount}</Badge>
            )}
          </button>

          <button
            onClick={() => setCurrentPage('historique')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'historique'
                ? 'bg-gradient-to-r from-emerald-700 to-emerald-800 text-white shadow-lg shadow-emerald-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="flex-1 text-left">Historique</span>
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
              {currentPage === 'validation' ? 'Validation Service' : 'Historique'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
              </Button>
            )}
            <div className="text-right">
              <p className="text-sm text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.division}</p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-emerald-700 text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {currentPage === 'validation' ? (
            <div className="space-y-6">
              {/* Notification banner */}
              {pendingCount > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-900">
                        <strong>{pendingCount} EVP en attente de validation</strong>
                      </p>
                      <p className="text-xs text-orange-700">
                        Traitez les demandes pour éviter tout retard dans le traitement de la paie
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-slate-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                      <CheckSquare className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">En attente</p>
                      <p className="text-2xl text-slate-900">{pendingCount}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Validés</p>
                      <p className="text-2xl text-emerald-600">{validatedCount}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Rejetés</p>
                      <p className="text-2xl text-red-600">{rejectedCount}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-64">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Rechercher par nom ou matricule..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>

              {/* Submissions table */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>EVP soumis par les gestionnaires</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSubmissions ? (
                    <div className="text-center py-8 text-slate-500">Chargement des soumissions...</div>
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
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Actions</th>
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Commentaire</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSubmissions.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="text-center py-8 text-slate-500">
                                Aucune soumission en attente de validation
                              </td>
                            </tr>
                          ) : (
                            filteredSubmissions
                              .map((sub) => {
                              const employee = sub.employee;
                              const nomComplet = employee?.prenom ? `${employee.prenom} ${employee.nom}` : employee?.nom || '-';
                              
                              // Type EVP - ne garder que les types qui ne sont pas rejetés par le respo service
                              // et qui ne sont pas déjà validés
                              const typeEVPItems = [];
                              
                              // Prime : afficher seulement si statut = "Soumis", "Modifié" ou "Rejeté" par la division
                              // EXCLURE si statut = "Rejeté" ET valideService = false (rejeté par le respo service)
                              // EXCLURE si statut = "Validé Service", "Validé Division", "Validé" (déjà validé)
                              if (sub.isPrime && sub.prime) {
                                const primeStatus = sub.prime.statut;
                                // Afficher si : Soumis, Modifié
                                if (primeStatus === 'Soumis' || primeStatus === 'Modifié') {
                                  typeEVPItems.push('Prime');
                                } else if (primeStatus === 'Rejeté') {
                                  // Si rejeté, vérifier si c'est un rejet par la division ou par le respo service
                                  // Règle: 
                                  // - Si valideService = true, c'est un rejet par la division → AFFICHER
                                  // - Si valideService = false ET que l'autre type (Congé) est aussi rejeté ET a un commentaire,
                                  //   alors Congé était rejeté par la division, donc Prime était aussi rejeté par la division → AFFICHER
                                  // - Sinon (valideService = false), c'est un rejet par le respo service → NE PAS AFFICHER
                                  if (sub.valideService) {
                                    // valideService = true signifie que Prime était rejeté par la division
                                    typeEVPItems.push('Prime');
                                  } else if (sub.isConge && sub.conge && sub.conge.statut === 'Rejeté' && sub.conge.commentaire) {
                                    // Si valideService = false mais que Congé est aussi rejeté ET a un commentaire,
                                    // alors Congé était rejeté par la division (le commentaire vient de la division),
                                    // donc Prime était aussi rejeté par la division avant → AFFICHER
                                    typeEVPItems.push('Prime');
                                  }
                                  // Sinon (valideService = false ET Congé n'est pas rejeté ou n'a pas de commentaire),
                                  // c'est un rejet par le respo service, ne pas afficher
                                }
                                // Ne pas afficher si : statut = "Validé Service", "Validé Division", "Validé"
                                // (ces statuts ne sont pas dans les conditions ci-dessus, donc ils ne seront pas ajoutés)
                              }
                              // Congé : même logique
                              if (sub.isConge && sub.conge) {
                                const congeStatus = sub.conge.statut;
                                if (congeStatus === 'Soumis' || congeStatus === 'Modifié') {
                                  typeEVPItems.push('Congé');
                                } else if (congeStatus === 'Rejeté') {
                                  // Même logique que pour Prime
                                  // Règle: 
                                  // - Si valideService = true, c'est un rejet par la division → AFFICHER
                                  // - Si valideService = false ET que l'autre type (Prime) est aussi rejeté ET a un commentaire,
                                  //   alors Prime était rejeté par la division, donc Congé était aussi rejeté par la division → AFFICHER
                                  // - Sinon (valideService = false), c'est un rejet par le respo service → NE PAS AFFICHER
                                  if (sub.valideService) {
                                    // valideService = true signifie que Congé était rejeté par la division
                                    typeEVPItems.push('Congé');
                                  } else if (sub.isPrime && sub.prime && sub.prime.statut === 'Rejeté' && sub.prime.commentaire) {
                                    // Si valideService = false mais que Prime est aussi rejeté ET a un commentaire,
                                    // alors Prime était rejeté par la division (le commentaire vient de la division),
                                    // donc Congé était aussi rejeté par la division avant → AFFICHER
                                    typeEVPItems.push('Congé');
                                  }
                                  // Sinon (valideService = false ET Prime n'est pas rejeté ou n'a pas de commentaire),
                                  // c'est un rejet par le respo service, ne pas afficher
                                }
                                // Ne pas afficher si : statut = "Validé Service", "Validé Division", "Validé"
                                // (ces statuts ne sont pas dans les conditions ci-dessus, donc ils ne seront pas ajoutés)
                              }
                              
                              // Si aucun type n'est visible, ne pas afficher la ligne
                              if (typeEVPItems.length === 0) {
                                return null;
                              }

                              // Afficher les montants seulement pour les types visibles
                              const montantPrime = (typeEVPItems.includes('Prime') && sub.prime?.montantCalcule)
                                ? (typeof sub.prime.montantCalcule === 'string' 
                                    ? parseFloat(sub.prime.montantCalcule) 
                                    : sub.prime.montantCalcule).toFixed(2)
                                : '-';
                              
                              const montantIndemnite = (typeEVPItems.includes('Congé') && sub.conge?.indemniteCalculee)
                                ? (typeof sub.conge.indemniteCalculee === 'string' 
                                    ? parseFloat(sub.conge.indemniteCalculee) 
                                    : sub.conge.indemniteCalculee).toFixed(2)
                                : '-';

                              const dureeConge = (typeEVPItems.includes('Congé') && sub.conge?.nombreJours) 
                                ? `${sub.conge.nombreJours} jour(s)` 
                                : '-';

                              // Dates de soumission - afficher seulement pour les types visibles
                              const formatDate = (dateStr: string | undefined) => {
                                if (!dateStr) return null;
                                return new Date(dateStr).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                });
                              };
                              const datePrime = typeEVPItems.includes('Prime') ? formatDate(sub.prime?.submittedAt) : null;
                              const dateConge = typeEVPItems.includes('Congé') ? formatDate(sub.conge?.submittedAt) : null;

                              return (
                                <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                                  <td className="py-3 px-4">
                                    <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                                      {employee?.matricule || '-'}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-sm text-slate-900">{nomComplet}</td>
                                  <td className="py-3 px-4 text-sm text-slate-700">{employee?.poste || '-'}</td>
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
                                  <td className="py-3 px-4">
                                    <div className="flex flex-col gap-2">
                                      {/* Actions pour Prime - afficher SEULEMENT si Prime est dans typeEVPItems (donc visible) */}
                                      {typeEVPItems.includes('Prime') && sub.isPrime && sub.prime && (
                                        <div className="flex gap-2 mb-1">
                                          <Button
                                            size="sm"
                                            onClick={() => handleValidation(sub, 'approve', 'Prime')}
                                            className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                                          >
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Valider
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleValidation(sub, 'reject', 'Prime')}
                                            className="border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs"
                                          >
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Rejeter
                                          </Button>
                                        </div>
                                      )}
                                      {/* Actions pour Congé - afficher SEULEMENT si Congé est dans typeEVPItems (donc visible) */}
                                      {typeEVPItems.includes('Congé') && sub.isConge && sub.conge && (
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() => handleValidation(sub, 'approve', 'Congé')}
                                            className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                                          >
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Valider
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleValidation(sub, 'reject', 'Congé')}
                                            className="border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs"
                                          >
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Rejeter
                                          </Button>
                                        </div>
                                      )}
                                      {/* Si aucun type n'est visible, afficher un message */}
                                      {typeEVPItems.length === 0 && (
                                        <span className="text-xs text-slate-400 italic">Tous validés</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex flex-col gap-1">
                                      {/* Commentaire de rejet par la division pour Prime */}
                                      {sub.isPrime && sub.prime && sub.prime.statut === 'Rejeté' && sub.valideService && sub.prime.commentaire && (
                                        <div className="mb-1 text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                                          <strong>Prime:</strong> {sub.prime.commentaire}
                                        </div>
                                      )}
                                      {/* Commentaire de rejet par la division pour Congé */}
                                      {sub.isConge && sub.conge && sub.conge.statut === 'Rejeté' && sub.valideService && sub.conge.commentaire && (
                                        <div className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                                          <strong>Congé:</strong> {sub.conge.commentaire}
                                        </div>
                                      )}
                                      {/* Si aucun commentaire */}
                                      {(!sub.isPrime || !sub.prime || !(sub.prime.statut === 'Rejeté' && sub.valideService && sub.prime.commentaire)) && 
                                       (!sub.isConge || !sub.conge || !(sub.conge.statut === 'Rejeté' && sub.valideService && sub.conge.commentaire)) && (
                                        <span className="text-slate-400 text-xs">-</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                              .filter(row => row !== null)
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : currentPage === 'historique' ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white rounded-2xl p-6">
                <h1 className="text-2xl mb-2">Historique des Validations</h1>
                <p className="opacity-90">
                  Historique complet des validations traitées par le service - {user.division}
                </p>
              </div>

              {/* Filters */}
              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-64">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Rechercher par nom ou matricule..."
                          value={historySearchTerm}
                          onChange={(e) => setHistorySearchTerm(e.target.value)}
                          className="pl-10"
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
                      <Select value={historyStatusFilter} onValueChange={(value: 'all' | 'validé' | 'en_attente' | 'rejeté') => setHistoryStatusFilter(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="validé">Validé</SelectItem>
                          <SelectItem value="en_attente">En attente</SelectItem>
                          <SelectItem value="rejeté">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* History table */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Historique des validations</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
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
                            <th className="text-left py-3 px-4 text-sm text-slate-600">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHistory.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="text-center py-8 text-slate-500">
                                Aucun historique disponible
                              </td>
                            </tr>
                          ) : (
                            filteredHistory.map((sub) => {
                              const employee = sub.employee;
                              const nomComplet = employee?.prenom ? `${employee.prenom} ${employee.nom}` : employee?.nom || '-';
                              
                              // Type EVP - ne garder que les types qui ont un statut (traités)
                              // Si un filtre de type est actif, n'afficher que ce type
                              const typeEVPItems = [];
                              if (historyTypeFilter === 'prime') {
                                // Filtre Prime : n'afficher que Prime
                                if (sub.isPrime && sub.prime && sub.prime.statut) typeEVPItems.push('Prime');
                              } else if (historyTypeFilter === 'conge') {
                                // Filtre Congé : n'afficher que Congé
                                if (sub.isConge && sub.conge && sub.conge.statut) typeEVPItems.push('Congé');
                              } else {
                                // Filtre "Tous" : afficher tous les types traités
                                if (sub.isPrime && sub.prime && sub.prime.statut) typeEVPItems.push('Prime');
                                if (sub.isConge && sub.conge && sub.conge.statut) typeEVPItems.push('Congé');
                              }

                              // Afficher les montants seulement pour le type sélectionné dans le filtre
                              const montantPrime = (historyTypeFilter === 'prime' || historyTypeFilter === 'all') && sub.prime?.montantCalcule 
                                ? (typeof sub.prime.montantCalcule === 'string' 
                                    ? parseFloat(sub.prime.montantCalcule) 
                                    : sub.prime.montantCalcule).toFixed(2)
                                : '-';
                              
                              const montantIndemnite = (historyTypeFilter === 'conge' || historyTypeFilter === 'all') && sub.conge?.indemniteCalculee 
                                ? (typeof sub.conge.indemniteCalculee === 'string' 
                                    ? parseFloat(sub.conge.indemniteCalculee) 
                                    : sub.conge.indemniteCalculee).toFixed(2)
                                : '-';

                              const dureeConge = (historyTypeFilter === 'conge' || historyTypeFilter === 'all') && sub.conge?.nombreJours ? `${sub.conge.nombreJours} jour(s)` : '-';

                              // Dates de soumission
                              const formatDate = (dateStr: string | undefined) => {
                                if (!dateStr) return null;
                                return new Date(dateStr).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                });
                              };
                              // Afficher les dates seulement pour le type sélectionné dans le filtre
                              const datePrime = (historyTypeFilter === 'prime' || historyTypeFilter === 'all') ? formatDate(sub.prime?.submittedAt) : null;
                              const dateConge = (historyTypeFilter === 'conge' || historyTypeFilter === 'all') ? formatDate(sub.conge?.submittedAt) : null;

                              // Fonctions pour déterminer le statut dans l'historique
                              // "Validé" si validé par respo service
                              // "En attente" si rejeté au gestionnaire (statut = "Rejeté" et valideService = false)
                              // "Rejeté" si rejeté par respo division (statut = "Rejeté" et valideService = true)
                              const getPrimeStatus = () => {
                                if (!sub.prime) return null;
                                const statut = sub.prime.statut || 'En attente';
                                // Si validé par le service
                                if (statut === 'Validé Service') return 'Validé';
                                // Si rejeté par le gestionnaire (pas encore validé par le service)
                                if (statut === 'Rejeté' && !sub.valideService) return 'En attente';
                                // Si rejeté par la division après validation service
                                if (statut === 'Rejeté' && sub.valideService) return 'Rejeté';
                                // Si validé par la division
                                if (statut === 'Validé Division' || statut === 'Validé') return 'Validé';
                                // Si soumis ou modifié (en attente de validation)
                                if (statut === 'Soumis' || statut === 'Modifié') return 'En attente';
                                return null;
                              };

                              const getCongeStatus = () => {
                                if (!sub.conge) return null;
                                const statut = sub.conge.statut || 'En attente';
                                // Si validé par le service
                                if (statut === 'Validé Service') return 'Validé';
                                // Si rejeté par le gestionnaire (pas encore validé par le service)
                                if (statut === 'Rejeté' && !sub.valideService) return 'En attente';
                                // Si rejeté par la division après validation service
                                if (statut === 'Rejeté' && sub.valideService) return 'Rejeté';
                                // Si validé par la division
                                if (statut === 'Validé Division' || statut === 'Validé') return 'Validé';
                                // Si soumis ou modifié (en attente de validation)
                                if (statut === 'Soumis' || statut === 'Modifié') return 'En attente';
                                return null;
                              };

                              return (
                                <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                                  <td className="py-3 px-4">
                                    <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                                      {employee?.matricule || '-'}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-sm text-slate-900">{nomComplet}</td>
                                  <td className="py-3 px-4 text-sm text-slate-700">{employee?.poste || '-'}</td>
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
                                  <td className="py-3 px-4">
                                    <div className="flex flex-col gap-1">
                                      {typeEVPItems.map((type, idx) => {
                                        const isPrimeType = type === 'Prime';
                                        const isCongeType = type === 'Congé';
                                        
                                        // Obtenir le statut pour ce type
                                        const status = isPrimeType 
                                          ? getPrimeStatus()
                                          : getCongeStatus();
                                        
                                        if (!status) {
                                          return null;
                                        }
                                        
                                        if (status === 'Validé') {
                                          return (
                                            <div key={idx}>
                                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                                                Validé
                                              </Badge>
                                            </div>
                                          );
                                        }
                                        
                                        if (status === 'En attente') {
                                          return (
                                            <div key={idx}>
                                              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                                                En attente
                                              </Badge>
                                            </div>
                                          );
                                        }
                                        
                                        if (status === 'Rejeté') {
                                          return (
                                            <div key={idx}>
                                              <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                                                Rejeté
                                              </Badge>
                                            </div>
                                          );
                                        }
                                        
                                        return null;
                                      })}
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
          ) : null}
        </main>
      </div>

      {/* Validation Dialog */}
      <Dialog open={validationDialog !== null} onOpenChange={(open) => {
        if (!open) {
          setValidationDialog(null);
          setSelectedSubmission(null);
          setComment('');
          setValidationType(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {validationDialog === 'approve' ? 'Valider l\'EVP' : 'Rejeter l\'EVP'}
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission && (() => {
                const employee = selectedSubmission.employee;
                const employeeName = employee?.prenom 
                  ? `${employee.prenom} ${employee.nom}`
                  : employee?.nom || 'Employé';
                return `${employeeName}${validationType ? ` - ${validationType}` : ''}`;
              })()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-700 mb-2 block">
                Commentaire {validationDialog === 'reject' ? '(obligatoire)' : '(optionnel)'}
              </label>
              <Textarea
                placeholder={validationDialog === 'reject' ? 'Veuillez indiquer la raison du rejet...' : 'Ajoutez un commentaire (optionnel)...'}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setValidationDialog(null);
              setSelectedSubmission(null);
              setComment('');
              setValidationType(null);
            }}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                console.log('🔘 Bouton Rejeter/Valider cliqué:', {
                  validationDialog,
                  validationType,
                  comment: comment.trim(),
                  selectedSubmissionId: selectedSubmission?.id
                });
                confirmValidation();
              }}
              disabled={validationDialog === 'reject' && !comment.trim()}
              className={
                validationDialog === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {validationDialog === 'approve' ? 'Valider' : 'Rejeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
