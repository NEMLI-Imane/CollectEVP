import { useState, useEffect } from 'react';
import { User } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { CheckSquare, BarChart3, LogOut, TrendingUp, Clock, CheckCircle2, Menu, XCircle, AlertCircle, Calendar, DollarSign, Search, History } from 'lucide-react';
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

interface ResponsableDivisionPageProps {
  user: User;
  onLogout: () => void;
}

interface ValidationRequest {
  id: number;
  employee: string;
  matricule: string;
  type: string;
  amount: string;
  service: string;
  validatedBy: string;
  validatedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  hasJustificatif: boolean;
}

interface MonthlyBudget {
  mois: string;
  montantPrevu: number | null;
  montantRealise: number;
  statut: 'En cours' | 'Validé' | 'Clôturé';
}

export default function ResponsableDivisionPage({ user, onLogout }: ResponsableDivisionPageProps) {
  const [currentPage, setCurrentPage] = useState<'validation' | 'reporting' | 'historique'>('validation');
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
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'approved' | 'rejected'>('all');

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
      console.log('📥 Chargement des soumissions EVP pour validation division...');
      const allSubmissions = await getEVPSubmissions();
      
      // Filtrer pour ne garder que les soumissions validées par le service (statut = "Validé Service")
      // Une soumission reste visible tant qu'au moins un type (Prime ou Congé) est encore "Validé Service"
      const submittedSubmissions = allSubmissions.filter(sub => {
        const primeStatus = sub.prime?.statut;
        const congeStatus = sub.conge?.statut;
        
        // Vérifier si au moins un type est "Validé Service" (en attente de validation division)
        const hasPrimePending = sub.isPrime && sub.prime && primeStatus === 'Validé Service';
        const hasCongePending = sub.isConge && sub.conge && congeStatus === 'Validé Service';
        
        // Garder la soumission si au moins un type est "Validé Service"
        return hasPrimePending || hasCongePending;
      });

      // Trier par date de soumission (les plus récentes en premier)
      submittedSubmissions.sort((a, b) => {
        const dateA = a.prime?.submittedAt || a.conge?.submittedAt || '';
        const dateB = b.prime?.submittedAt || b.conge?.submittedAt || '';
        return dateB.localeCompare(dateA);
      });

      console.log('✅ Soumissions chargées:', submittedSubmissions.length);
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
      console.log('📥 Chargement de l\'historique des validations division...');
      const allSubmissions = await getEVPSubmissions();
      
      // Filtrer pour ne garder que les soumissions qui ont été traitées par la division
      // (statut = "Validé Division" ou "Rejeté" après validation service)
      const historySubmissions = allSubmissions.filter(sub => {
        const primeStatus = sub.prime?.statut;
        const congeStatus = sub.conge?.statut;
        
        // Vérifier si au moins un type a été traité par la division
        const hasPrimeProcessed = sub.isPrime && sub.prime && 
          (primeStatus === 'Validé Division' || primeStatus === 'Validé' || 
           (primeStatus === 'Rejeté' && sub.valideService));
        const hasCongeProcessed = sub.isConge && sub.conge && 
          (congeStatus === 'Validé Division' || congeStatus === 'Validé' || 
           (congeStatus === 'Rejeté' && sub.valideService));
        
        // Garder la soumission si au moins un type a été traité par la division
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

  // Budget management states
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudget[]>([
    { mois: 'Octobre 2025', montantPrevu: 150000, montantRealise: 125000, statut: 'En cours' },
    { mois: 'Septembre 2025', montantPrevu: 145000, montantRealise: 142000, statut: 'Validé' },
    { mois: 'Août 2025', montantPrevu: 140000, montantRealise: 138000, statut: 'Clôturé' },
    { mois: 'Juillet 2025', montantPrevu: 150000, montantRealise: 155000, statut: 'Clôturé' },
    { mois: 'Juin 2025', montantPrevu: 145000, montantRealise: 148000, statut: 'Clôturé' },
    { mois: 'Mai 2025', montantPrevu: null, montantRealise: 132000, statut: 'Clôturé' },
  ]);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const serviceData = [
    { service: 'Maintenance', pending: 8, validated: 45, rejected: 3, avgTime: '1.2j' },
    { service: 'Fabrication', pending: 12, validated: 68, rejected: 5, avgTime: '1.5j' },
    { service: 'Qualité', pending: 5, validated: 32, rejected: 2, avgTime: '0.8j' },
    { service: 'Logistique', pending: 6, validated: 28, rejected: 1, avgTime: '1.0j' },
  ];

  const chartData = [
    { service: 'Maintenance', validated: 45, rejected: 3 },
    { service: 'Fabrication', validated: 68, rejected: 5 },
    { service: 'Qualité', validated: 32, rejected: 2 },
    { service: 'Logistique', validated: 28, rejected: 1 },
  ];

  const typeDistribution = [
    { name: 'Primes', value: 48, color: '#059669' },
    { name: 'Heures sup.', value: 32, color: '#3b82f6' },
    { name: 'Congés', value: 12, color: '#f97316' },
    { name: 'Absences', value: 8, color: '#ef4444' },
  ];

  // Monthly trend data for charts
  const monthlyTrendData = monthlyBudgets.slice().reverse().map(budget => ({
    mois: budget.mois.split(' ')[0],
    prevu: budget.montantPrevu ? budget.montantPrevu / 1000 : 0,
    realise: budget.montantRealise / 1000,
  }));

  const handleValidation = (submission: EVPSubmission, action: 'approve' | 'reject', type?: 'Prime' | 'Congé') => {
    setSelectedSubmission(submission);
    setValidationDialog(action);
    setComment('');
    setValidationType(type || null);
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

      await validateEVPSubmission(selectedSubmission.id, validationDialog === 'approve' ? 'approve' : 'reject', {
        niveau: 'division',
        commentaire: validationDialog === 'reject' ? comment : undefined,
        type: validationType || undefined
      });

      const actionText = validationDialog === 'approve' ? 'approuvé' : 'rejeté';
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
      await loadSubmissions();
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(`Erreur lors de la validation: ${errorMessage}`);
    }
  };

  const openBudgetDialog = () => {
    setSelectedMonth('');
    setBudgetAmount('');
    setShowBudgetDialog(true);
  };

  const saveBudget = () => {
    if (!selectedMonth || !budgetAmount) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Veuillez saisir un montant valide');
      return;
    }

    setMonthlyBudgets(monthlyBudgets.map(budget =>
      budget.mois === selectedMonth
        ? { ...budget, montantPrevu: amount }
        : budget
    ));

    toast.success('Montant prévu enregistré avec succès', {
      description: `${selectedMonth}: ${amount.toLocaleString()} DH`,
    });

    setShowBudgetDialog(false);
    setSelectedMonth('');
    setBudgetAmount('');
  };

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">En attente validation</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Approuvé Division</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Rejeté Division</Badge>;
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

    // Filtre par type (Prime/Congé)
    if (historyTypeFilter === 'prime') {
      // Ne garder QUE les soumissions qui ont Prime ET PAS Congé (et qui sont traitées par la division)
      if (!sub.isPrime || !sub.prime || (sub.isConge && sub.conge)) return false;
      
      const primeStatus = sub.prime.statut;
      const isPrimeProcessed = primeStatus === 'Validé Division' || 
                               primeStatus === 'Validé' || 
                               (primeStatus === 'Rejeté' && sub.valideService);
      
      if (!isPrimeProcessed) return false;
      
      // Si un filtre de statut est spécifié, vérifier le statut de la prime
      if (historyStatusFilter !== 'all') {
        const hasApprovedPrime = primeStatus === 'Validé Division' || primeStatus === 'Validé';
        const hasRejectedPrime = primeStatus === 'Rejeté' && sub.valideService;
        
        if (historyStatusFilter === 'approved') {
          return hasApprovedPrime;
        } else if (historyStatusFilter === 'rejected') {
          return hasRejectedPrime;
        }
      }
      return true;
    } else if (historyTypeFilter === 'conge') {
      // Ne garder QUE les soumissions qui ont Congé ET PAS Prime (et qui sont traitées par la division)
      if (!sub.isConge || !sub.conge || (sub.isPrime && sub.prime)) return false;
      
      const congeStatus = sub.conge.statut;
      const isCongeProcessed = congeStatus === 'Validé Division' || 
                               congeStatus === 'Validé' || 
                               (congeStatus === 'Rejeté' && sub.valideService);
      
      if (!isCongeProcessed) return false;
      
      // Si un filtre de statut est spécifié, vérifier le statut du congé
      if (historyStatusFilter !== 'all') {
        const hasApprovedConge = congeStatus === 'Validé Division' || congeStatus === 'Validé';
        const hasRejectedConge = congeStatus === 'Rejeté' && sub.valideService;
        
        if (historyStatusFilter === 'approved') {
          return hasApprovedConge;
        } else if (historyStatusFilter === 'rejected') {
          return hasRejectedConge;
        }
      }
      return true;
    } else {
      // Filtre "Tous les EVP" - si un filtre de statut est spécifié, vérifier que TOUS les types présents correspondent
      if (historyStatusFilter !== 'all') {
        const primeStatus = sub.prime?.statut;
        const congeStatus = sub.conge?.statut;
        
        const hasApprovedPrime = sub.isPrime && sub.prime && 
          (primeStatus === 'Validé Division' || primeStatus === 'Validé');
        const hasApprovedConge = sub.isConge && sub.conge && 
          (congeStatus === 'Validé Division' || congeStatus === 'Validé');
        const hasRejectedPrime = sub.isPrime && sub.prime && 
          primeStatus === 'Rejeté' && sub.valideService;
        const hasRejectedConge = sub.isConge && sub.conge && 
          congeStatus === 'Rejeté' && sub.valideService;

        // Si la demande a Prime ET Congé, les deux doivent avoir le statut sélectionné
        if (sub.isPrime && sub.prime && sub.isConge && sub.conge) {
          if (historyStatusFilter === 'approved') {
            return hasApprovedPrime && hasApprovedConge;
          } else if (historyStatusFilter === 'rejected') {
            return hasRejectedPrime && hasRejectedConge;
          }
        }
        // Si seulement Prime, vérifier Prime
        if (sub.isPrime && sub.prime && !(sub.isConge && sub.conge)) {
          if (historyStatusFilter === 'approved') {
            return hasApprovedPrime;
          } else if (historyStatusFilter === 'rejected') {
            return hasRejectedPrime;
          }
        }
        // Si seulement Congé, vérifier Congé
        if (sub.isConge && sub.conge && !(sub.isPrime && sub.prime)) {
          if (historyStatusFilter === 'approved') {
            return hasApprovedConge;
          } else if (historyStatusFilter === 'rejected') {
            return hasRejectedConge;
          }
        }
        return false;
      }
      return true;
    }
  });

  const totalPending = serviceData.reduce((sum, s) => sum + s.pending, 0);
  const totalValidated = serviceData.reduce((sum, s) => sum + s.validated, 0);
  const totalRejected = serviceData.reduce((sum, s) => sum + s.rejected, 0);
  const avgTime = '1.2j';

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-xl flex items-center justify-center">
              <span className="text-white">OCP</span>
            </div>
            <div>
              <h1 className="text-slate-900">CollectEVP</h1>
              <p className="text-xs text-slate-500">Responsable Division</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setCurrentPage('validation')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'validation'
                ? 'bg-gradient-to-r from-emerald-700 to-emerald-900 text-white shadow-lg shadow-emerald-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="flex-1 text-left">Validation Division</span>
            {submissions.length > 0 && currentPage !== 'validation' && (
              <Badge className="bg-orange-500 text-white">{submissions.length}</Badge>
            )}
          </button>

          <button
            onClick={() => setCurrentPage('historique')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'historique'
                ? 'bg-gradient-to-r from-emerald-700 to-emerald-900 text-white shadow-lg shadow-emerald-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="flex-1 text-left">Historique</span>
          </button>

          <button
            onClick={() => setCurrentPage('reporting')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'reporting'
                ? 'bg-gradient-to-r from-emerald-700 to-emerald-900 text-white shadow-lg shadow-emerald-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="flex-1 text-left">Reporting Avancé</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Avatar>
              <AvatarFallback className="bg-emerald-800 text-white">
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
              {currentPage === 'validation' ? 'Validation Division' : 
               currentPage === 'historique' ? 'Historique' : 'Reporting Avancé'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.division}</p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-emerald-800 text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {currentPage === 'validation' ? (
            <div className="space-y-6">
              {/* Header with stats */}
              <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white rounded-2xl p-6">
                <h1 className="text-2xl mb-2">Supervision Division</h1>
                <p className="opacity-90">
                  Vue agrégée des validations par service - {user.division}
                </p>
              </div>

              {/* Notification banner for pending validations */}
              {submissions.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-900">
                        <strong>{submissions.length} validation(s) du Responsable Service en attente</strong>
                      </p>
                      <p className="text-xs text-orange-700">
                        Approuvez ou rejetez les décisions du responsable service pour finaliser le processus
                      </p>
                    </div>
                  </div>
                </div>
              )}

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

              {/* Validation requests from Service Manager */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Validations du Responsable Service à approuver</span>
                    {submissions.length > 0 && (
                      <Badge className="bg-orange-500 text-white">{submissions.length} en attente</Badge>
                    )}
                  </CardTitle>
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
                            filteredSubmissions.map((sub) => {
                              const employee = sub.employee;
                              const nomComplet = employee?.prenom ? `${employee.prenom} ${employee.nom}` : employee?.nom || '-';
                              
                              // Type EVP - ne garder que ceux qui sont encore en attente (statut "Validé Service")
                              // Les types approuvés ou rejetés disparaissent du tableau de validation
                              const typeEVPItems = [];
                              const hasPrimePending = sub.isPrime && sub.prime && sub.prime.statut === 'Validé Service';
                              const hasCongePending = sub.isConge && sub.conge && sub.conge.statut === 'Validé Service';
                              
                              if (hasPrimePending) {
                                typeEVPItems.push('Prime');
                              }
                              if (hasCongePending) {
                                typeEVPItems.push('Congé');
                              }

                              // Montants et durées - n'afficher que pour les types encore en attente
                              const montantPrime = hasPrimePending && sub.prime?.montantCalcule 
                                ? (typeof sub.prime.montantCalcule === 'string' 
                                    ? parseFloat(sub.prime.montantCalcule) 
                                    : sub.prime.montantCalcule).toFixed(2)
                                : '-';
                              
                              const montantIndemnite = hasCongePending && sub.conge?.indemniteCalculee 
                                ? (typeof sub.conge.indemniteCalculee === 'string' 
                                    ? parseFloat(sub.conge.indemniteCalculee) 
                                    : sub.conge.indemniteCalculee).toFixed(2)
                                : '-';

                              const dureeConge = hasCongePending && sub.conge?.nombreJours ? `${sub.conge.nombreJours} jour(s)` : '-';

                              // Dates de soumission - n'afficher que pour les types encore en attente
                              const formatDate = (dateStr: string | undefined) => {
                                if (!dateStr) return null;
                                return new Date(dateStr).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                });
                              };
                              const datePrime = hasPrimePending ? formatDate(sub.prime?.submittedAt) : null;
                              const dateConge = hasCongePending ? formatDate(sub.conge?.submittedAt) : null;

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
                                      {/* Afficher les boutons uniquement pour les types encore en attente (statut "Validé Service") */}
                                      {typeEVPItems.map((type, idx) => {
                                        const isPrimeType = type === 'Prime';
                                        const isCongeType = type === 'Congé';
                                        
                                        // Obtenir le statut actuel (devrait toujours être "Validé Service" car on a filtré)
                                        const currentStatus = isPrimeType 
                                          ? (sub.prime?.statut || null)
                                          : (sub.conge?.statut || null);
                                        
                                        // Afficher les boutons uniquement si le statut est "Validé Service"
                                        if (currentStatus === 'Validé Service') {
                                          return (
                                            <div key={idx} className="flex gap-2">
                                              <Button
                                                size="sm"
                                                onClick={() => handleValidation(sub, 'approve', type as 'Prime' | 'Congé')}
                                                className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                                              >
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Approuver
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleValidation(sub, 'reject', type as 'Prime' | 'Congé')}
                                                className="border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs"
                                              >
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Rejeter
                                              </Button>
                                            </div>
                                          );
                                        }
                                        
                                        // Ne devrait jamais arriver ici car on a filtré typeEVPItems
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

              {/* Key stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-slate-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">En attente</p>
                      <p className="text-2xl text-slate-900">{totalPending}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Validés ce mois</p>
                      <p className="text-2xl text-emerald-600">{totalValidated}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Rejetés</p>
                      <p className="text-2xl text-red-600">{totalRejected}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Temps moyen</p>
                      <p className="text-2xl text-blue-600">{avgTime}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Table by service */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Indicateurs agrégés par service</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Service</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">En attente</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Validés</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Rejetés</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Temps moyen</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Taux validation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceData.map((service, idx) => {
                          const total = service.validated + service.rejected;
                          const rate = total > 0 ? Math.round((service.validated / total) * 100) : 0;
                          
                          return (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4">
                                <span className="text-sm text-slate-900">{service.service}</span>
                              </td>
                              <td className="py-3 px-4">
                                <Badge className="bg-orange-100 text-orange-700">
                                  {service.pending}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <Badge className="bg-emerald-100 text-emerald-700">
                                  {service.validated}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <Badge className="bg-red-100 text-red-700">
                                  {service.rejected}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-700">{service.avgTime}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-600"
                                      style={{ width: `${rate}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-slate-700">{rate}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : currentPage === 'historique' ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white rounded-2xl p-6">
                <h1 className="text-2xl mb-2">Historique des Validations</h1>
                <p className="opacity-90">
                  Historique complet des validations traitées par la division - {user.division}
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
                      <Select value={historyStatusFilter} onValueChange={(value: 'all' | 'approved' | 'rejected') => setHistoryStatusFilter(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="approved">Approuvé</SelectItem>
                          <SelectItem value="rejected">Rejeté</SelectItem>
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
                              
                              // Type EVP - ne garder que les types traités par la division (approuvés ou rejetés)
                              const typeEVPItems = [];
                              if (sub.isPrime && sub.prime) {
                                const primeStatus = sub.prime.statut;
                                const isPrimeProcessed = primeStatus === 'Validé Division' || 
                                                         primeStatus === 'Validé' || 
                                                         (primeStatus === 'Rejeté' && sub.valideService);
                                if (isPrimeProcessed) {
                                  typeEVPItems.push('Prime');
                                }
                              }
                              if (sub.isConge && sub.conge) {
                                const congeStatus = sub.conge.statut;
                                const isCongeProcessed = congeStatus === 'Validé Division' || 
                                                         congeStatus === 'Validé' || 
                                                         (congeStatus === 'Rejeté' && sub.valideService);
                                if (isCongeProcessed) {
                                  typeEVPItems.push('Congé');
                                }
                              }

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

                              // Dates de soumission
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
                                        
                                        // Obtenir le statut actuel
                                        const currentStatus = isPrimeType 
                                          ? (sub.prime?.statut || null)
                                          : (sub.conge?.statut || null);
                                        
                                        // Ne montrer que les statuts qui ont été traités par la division
                                        // (approuvés ou rejetés), pas ceux qui sont encore "Validé Service"
                                        const isProcessed = currentStatus === 'Validé Division' || 
                                                           currentStatus === 'Validé' || 
                                                           (currentStatus === 'Rejeté' && sub.valideService);
                                        
                                        if (!isProcessed) {
                                          return null;
                                        }
                                        
                                        // Si validé par la division, afficher "Approuvé"
                                        if (currentStatus === 'Validé Division' || currentStatus === 'Validé') {
                                          return (
                                            <div key={idx}>
                                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                                                Approuvé
                                              </Badge>
                                            </div>
                                          );
                                        }
                                        
                                        // Si rejeté par la division (après validation service), afficher "Rejeté" avec indication
                                        if (currentStatus === 'Rejeté' && sub.valideService) {
                                          return (
                                            <div key={idx}>
                                              <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                                                Rejeté
                                              </Badge>
                                              <span className="text-xs text-slate-500 block mt-1">
                                                (en attente)
                                              </span>
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
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl text-slate-900">Reporting Avancé - {user.division}</h1>
                <Button onClick={openBudgetDialog} className="bg-emerald-600 hover:bg-emerald-700">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Saisir le montant prévu
                </Button>
              </div>

              {/* Monthly Budget Table */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Gestion budgétaire mensuelle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Mois</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Montant Prévu (DH)</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Montant Réalisé (DH)</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Écart (Réalisé - Prévu)</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyBudgets.map((budget, idx) => {
                          const ecart = budget.montantPrevu 
                            ? budget.montantRealise - budget.montantPrevu 
                            : null;
                          const ecartPercent = budget.montantPrevu 
                            ? Math.round((ecart! / budget.montantPrevu) * 100) 
                            : null;
                          
                          return (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4">
                                <span className="text-sm text-slate-900">{budget.mois}</span>
                              </td>
                              <td className="py-3 px-4">
                                {budget.montantPrevu ? (
                                  <span className="text-sm text-slate-900">{budget.montantPrevu.toLocaleString()} DH</span>
                                ) : (
                                  <span className="text-sm text-slate-400 italic">Non défini</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-slate-900">{budget.montantRealise.toLocaleString()} DH</span>
                              </td>
                              <td className="py-3 px-4">
                                {ecart !== null ? (
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm ${
                                      ecart > 0 ? 'text-red-600' : ecart < 0 ? 'text-emerald-600' : 'text-slate-600'
                                    }`}>
                                      {ecart > 0 ? '+' : ''}{ecart.toLocaleString()} DH
                                    </span>
                                    <Badge className={
                                      ecart > 0 
                                        ? 'bg-red-100 text-red-700 border-red-200' 
                                        : ecart < 0 
                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }>
                                      {ecartPercent !== null && `${ecartPercent > 0 ? '+' : ''}${ecartPercent}%`}
                                    </Badge>
                                  </div>
                                ) : (
                                  <span className="text-sm text-slate-400 italic">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {getReportStatusBadge(budget.statut)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle>Évolution budgétaire</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="mois" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="prevu" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="Prévu (K DH)" 
                          dot={{ fill: '#3b82f6', r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="realise" 
                          stroke="#059669" 
                          strokeWidth={2}
                          name="Réalisé (K DH)" 
                          dot={{ fill: '#059669', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle>Validations par service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="service" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="validated" fill="#059669" name="Validés" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="rejected" fill="#ef4444" name="Rejetés" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle>Répartition par type d'EVP</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={typeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {typeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 to-white">
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-600 mb-2">Performance globale</p>
                    <p className="text-3xl text-emerald-700 mb-1">Excellent</p>
                    <p className="text-xs text-slate-600">Taux de validation: 95%</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-white">
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-600 mb-2">Délai moyen traitement</p>
                    <p className="text-3xl text-blue-700 mb-1">1.2 jours</p>
                    <p className="text-xs text-slate-600">-15% vs mois dernier</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-gradient-to-br from-orange-50 to-white">
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-600 mb-2">Services actifs</p>
                    <p className="text-3xl text-orange-700 mb-1">{serviceData.length}</p>
                    <p className="text-xs text-slate-600">Total: {totalPending + totalValidated + totalRejected} EVP</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Validation Dialog */}
      <Dialog open={validationDialog !== null} onOpenChange={() => {
        setValidationDialog(null);
        setSelectedSubmission(null);
        setComment('');
        setValidationType(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {validationDialog === 'approve' ? 'Approuver la validation' : 'Rejeter la validation'}
            </DialogTitle>
            <DialogDescription>
              {validationDialog === 'approve' 
                ? `Confirmez l'approbation de cette validation du responsable service${validationType ? ` (${validationType})` : ''}`
                : `Indiquez la raison du rejet de cette validation${validationType ? ` (${validationType})` : ''}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedSubmission && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-700">
                  <strong>Employé:</strong> {selectedSubmission.employee?.prenom ? `${selectedSubmission.employee.prenom} ${selectedSubmission.employee.nom}` : selectedSubmission.employee?.nom || '-'}
                </p>
                <p className="text-sm text-slate-700">
                  <strong>Matricule:</strong> {selectedSubmission.employee?.matricule || '-'}
                </p>
                {validationType && (
                  <p className="text-sm text-slate-700">
                    <strong>Type:</strong> {validationType}
                  </p>
                )}
              </div>
            )}
            {validationDialog === 'reject' && (
              <div>
                <label className="text-sm text-slate-700 mb-2 block">Commentaire de rejet *</label>
                <Textarea
                  placeholder="Ex: Montant non conforme aux règles de la division"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </div>
            )}
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
              onClick={confirmValidation}
              disabled={validationDialog === 'reject' && !comment.trim()}
              className={validationDialog === 'approve' 
                ? 'bg-emerald-600 hover:bg-emerald-700' 
                : 'bg-red-600 hover:bg-red-700'}
            >
              {validationDialog === 'approve' ? 'Approuver' : 'Rejeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Budget Dialog */}
      <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Saisir le montant prévu</DialogTitle>
            <DialogDescription>
              Définissez le budget prévu pour un mois spécifique
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-slate-700 mb-2 block">Mois</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un mois..." />
                </SelectTrigger>
                <SelectContent>
                  {monthlyBudgets.map((budget) => (
                    <SelectItem key={budget.mois} value={budget.mois}>
                      {budget.mois}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-slate-700 mb-2 block">Montant prévu (DH)</label>
              <Input
                type="number"
                placeholder="Ex: 150000"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
              />
            </div>

            {selectedMonth && budgetAmount && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-900">
                  <strong>Aperçu:</strong> Budget prévu pour {selectedMonth}: {parseFloat(budgetAmount).toLocaleString()} DH
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBudgetDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveBudget} className="bg-emerald-600 hover:bg-emerald-700">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
