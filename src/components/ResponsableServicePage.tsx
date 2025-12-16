import { useState, useEffect } from 'react';
import { User } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { CheckSquare, CheckCircle2, XCircle, Filter, Search, LogOut, Bell, BarChart3, Menu, Calendar } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState<'validation' | 'reporting'>('validation');
  const [submissions, setSubmissions] = useState<EVPSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<EVPSubmission | null>(null);
  const [validationDialog, setValidationDialog] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [validationType, setValidationType] = useState<'Prime' | 'Congé' | null>(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les soumissions depuis l'API
  useEffect(() => {
    if (currentPage === 'validation') {
      loadSubmissions();
    }
  }, [currentPage]);

  const loadSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      console.log('📥 Chargement des soumissions EVP pour validation service...');
      const allSubmissions = await getEVPSubmissions();
      
      // Filtrer pour ne garder que les soumissions soumises (statut = "Soumis") et non encore validées par le service
      // Une soumission reste visible tant qu'au moins un type (Prime ou Congé) est encore "Soumis"
      const submittedSubmissions = allSubmissions.filter(sub => {
        const primeStatus = sub.prime?.statut;
        const congeStatus = sub.conge?.statut;
        
        // Vérifier si au moins un type est encore "Soumis" (en attente de validation)
        const hasPrimePending = sub.isPrime && sub.prime && primeStatus === 'Soumis';
        const hasCongePending = sub.isConge && sub.conge && congeStatus === 'Soumis';
        
        // Garder la soumission si au moins un type est encore "Soumis"
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
        niveau: 'service',
        commentaire: validationDialog === 'reject' ? comment : undefined,
        type: validationType || undefined
      });

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
      await loadSubmissions();
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
            onClick={() => setCurrentPage('reporting')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'reporting'
                ? 'bg-gradient-to-r from-emerald-700 to-emerald-800 text-white shadow-lg shadow-emerald-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="flex-1 text-left">Reporting</span>
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
              {currentPage === 'validation' ? 'Validation Service' : 'Reporting'}
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

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="validated">Validé</SelectItem>
                        <SelectItem value="rejected">Rejeté</SelectItem>
                      </SelectContent>
                    </Select>
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
                                      {/* Actions pour Prime - afficher seulement si statut est "Soumis" */}
                                      {sub.isPrime && sub.prime && sub.prime.statut === 'Soumis' && (
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
                                      {/* Actions pour Congé - afficher seulement si statut est "Soumis" */}
                                      {sub.isConge && sub.conge && sub.conge.statut === 'Soumis' && (
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
                                      {/* Si aucun type n'est en attente, afficher un message */}
                                      {(!sub.isPrime || !sub.prime || sub.prime.statut !== 'Soumis') && 
                                       (!sub.isConge || !sub.conge || sub.conge.statut !== 'Soumis') && (
                                        <span className="text-xs text-slate-400 italic">Tous validés</span>
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
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl text-slate-900">Reporting Historique - {user.division}</h1>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">3 derniers mois</SelectItem>
                      <SelectItem value="all">Tous les mois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  <strong>Info :</strong> Par défaut, les 3 derniers mois sont affichés. Utilisez le filtre ci-dessus pour consulter l'historique complet.
                </p>
              </div>

              {/* Monthly Reports Table */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Historique mensuel des EVP</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Mois</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Montant Total Payé (Primes)</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Nombre de Jours de Congés</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReports.map((report, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <span className="text-sm text-slate-900">{report.mois}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-slate-900">{report.montantTotal.toLocaleString()} DH</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-slate-900">{report.joursConges} jours</span>
                            </td>
                            <td className="py-3 px-4">
                              {getReportStatusBadge(report.statut)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle>Évolution mensuelle (3 derniers mois)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={recentMonthsData}>
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
                        <Bar dataKey="montant" fill="#059669" name="Montant (K DH)" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="conges" fill="#3b82f6" name="Jours congés" radius={[8, 8, 0, 0]} />
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

              {/* Trend Chart for all months */}
              {selectedMonth === 'all' && (
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle>Tendance sur 6 mois</CardTitle>
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
                          dataKey="montant" 
                          stroke="#059669" 
                          strokeWidth={3}
                          name="Montant (K DH)" 
                          dot={{ fill: '#059669', r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 to-white">
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-600 mb-2">Moyenne mensuelle (primes)</p>
                    <p className="text-3xl text-emerald-700 mb-1">
                      {Math.round(monthlyReports.reduce((sum, r) => sum + r.montantTotal, 0) / monthlyReports.length).toLocaleString()} DH
                    </p>
                    <p className="text-xs text-slate-600">Sur {monthlyReports.length} mois</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-white">
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-600 mb-2">Total congés (3 mois)</p>
                    <p className="text-3xl text-blue-700 mb-1">
                      {recentMonthsData.reduce((sum, r) => sum + r.conges, 0)} jours
                    </p>
                    <p className="text-xs text-slate-600">Octobre - Août 2025</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-gradient-to-br from-orange-50 to-white">
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-600 mb-2">Performance validation</p>
                    <p className="text-3xl text-orange-700 mb-1">Excellent</p>
                    <p className="text-xs text-slate-600">Taux de validation: 95%</p>
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
              onClick={confirmValidation}
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
