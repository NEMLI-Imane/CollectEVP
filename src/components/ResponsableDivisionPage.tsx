import { useState } from 'react';
import { User } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { CheckSquare, BarChart3, LogOut, TrendingUp, Clock, CheckCircle2, Menu, XCircle, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { toast } from 'sonner@2.0.3';
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
  const [currentPage, setCurrentPage] = useState<'validation' | 'reporting'>('validation');
  const [validationRequests, setValidationRequests] = useState<ValidationRequest[]>([
    { id: 1, employee: 'Khalid Mansouri', matricule: 'OCP012', type: 'Heures supplémentaires', amount: '15h', service: 'Maintenance', validatedBy: 'F. Alami', validatedDate: '2025-10-12', status: 'pending', hasJustificatif: true },
    { id: 2, employee: 'Nadia El Amrani', matricule: 'OCP034', type: 'Prime de rendement', amount: '2500 DH', service: 'Maintenance', validatedBy: 'F. Alami', validatedDate: '2025-10-12', status: 'pending', hasJustificatif: true },
    { id: 3, employee: 'Salma Benjelloun', matricule: 'OCP045', type: 'Prime exceptionnelle', amount: '3000 DH', service: 'Fabrication', validatedBy: 'F. Alami', validatedDate: '2025-10-11', status: 'pending', hasJustificatif: true },
    { id: 4, employee: 'Youssef Kadiri', matricule: 'OCP067', type: 'Congé payé', amount: '5 jours', service: 'Qualité', validatedBy: 'H. Mouhib', validatedDate: '2025-10-11', status: 'approved', hasJustificatif: true },
  ]);

  const [selectedRequest, setSelectedRequest] = useState<ValidationRequest | null>(null);
  const [validationDialog, setValidationDialog] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');

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

  const handleValidation = (request: ValidationRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setValidationDialog(action);
    setComment('');
  };

  const confirmValidation = () => {
    if (!selectedRequest) return;

    const action = validationDialog === 'approve' ? 'approuvé' : 'rejeté';
    
    setValidationRequests(validationRequests.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, status: validationDialog === 'approve' ? 'approved' : 'rejected' as const }
        : req
    ));

    toast.success(`EVP ${action} avec succès`, {
      description: `${selectedRequest.employee} - ${selectedRequest.type}`,
    });

    setValidationDialog(null);
    setSelectedRequest(null);
    setComment('');
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

  const pendingValidationCount = validationRequests.filter(r => r.status === 'pending').length;
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
            {pendingValidationCount > 0 && currentPage !== 'validation' && (
              <Badge className="bg-orange-500 text-white">{pendingValidationCount}</Badge>
            )}
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
              {currentPage === 'validation' ? 'Validation Division' : 'Reporting Avancé'}
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
              {pendingValidationCount > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-900">
                        <strong>{pendingValidationCount} validation(s) du Responsable Service en attente</strong>
                      </p>
                      <p className="text-xs text-orange-700">
                        Approuvez ou rejetez les décisions du responsable service pour finaliser le processus
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation requests from Service Manager */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Validations du Responsable Service à approuver</span>
                    {pendingValidationCount > 0 && (
                      <Badge className="bg-orange-500 text-white">{pendingValidationCount} en attente</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Matricule</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Employé</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Type</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Montant</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Service</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Validé par</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Statut</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationRequests.map((request) => (
                          <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                                {request.matricule}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="text-sm text-slate-900">{request.employee}</p>
                                {request.hasJustificatif && (
                                  <p className="text-xs text-emerald-600">📎 Justificatif</p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-700">{request.type}</td>
                            <td className="py-3 px-4 text-sm text-slate-900">{request.amount}</td>
                            <td className="py-3 px-4 text-sm text-slate-700">{request.service}</td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="text-sm text-slate-900">{request.validatedBy}</p>
                                <p className="text-xs text-slate-500">{request.validatedDate}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">{getRequestStatusBadge(request.status)}</td>
                            <td className="py-3 px-4">
                              {request.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleValidation(request, 'approve')}
                                    className="bg-emerald-600 hover:bg-emerald-700 h-8"
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Approuver
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleValidation(request, 'reject')}
                                    className="border-red-200 text-red-600 hover:bg-red-50 h-8"
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Rejeter
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {validationRequests.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-slate-500">Aucune validation en attente</p>
                      </div>
                    )}
                  </div>
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
      <Dialog open={validationDialog !== null} onOpenChange={() => setValidationDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {validationDialog === 'approve' ? 'Approuver la validation' : 'Rejeter la validation'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  {selectedRequest.employee} - {selectedRequest.type} ({selectedRequest.amount})
                  <br />
                  <span className="text-xs">Validé par: {selectedRequest.validatedBy} le {selectedRequest.validatedDate}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-700 mb-2 block">
                Commentaire de la division {validationDialog === 'reject' ? '(obligatoire)' : '(optionnel)'}
              </label>
              <Textarea
                placeholder="Ajoutez un commentaire sur cette décision..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setValidationDialog(null)}>
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
