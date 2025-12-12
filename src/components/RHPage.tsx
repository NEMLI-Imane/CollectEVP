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
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, Employee } from '../services/api';
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


interface ManagerRequest {
  id: number;
  matricule: string;
  nomPrenom: string;
  raison: string;
  requestedBy: string;
  requestDate: string;
  status: 'pending' | 'processed' | 'rejected';
}

export default function RHPage({ user, onLogout }: RHPageProps) {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'reporting' | 'export' | 'settings' | 'employees' | 'requests'>('dashboard');
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
  }, [currentPage]);

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
  
  // Manager requests
  const [managerRequests, setManagerRequests] = useState<ManagerRequest[]>([
    { id: 1, matricule: '45890', nomPrenom: 'Hassan Benjelloun', raison: 'Nouvel employé', requestedBy: 'Ahmed Bennani', requestDate: '2025-10-20', status: 'pending' },
    { id: 2, matricule: '45891', nomPrenom: 'Samira El Fassi', raison: 'Employé non déclaré', requestedBy: 'Fatima Alami', requestDate: '2025-10-18', status: 'pending' },
  ]);

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

  const handleExportCSV = () => {
    toast.success('Export CSV lancé', {
      description: 'Le fichier sera téléchargé dans quelques instants',
    });
  };

  const handleExportPDF = () => {
    toast.success('Export PDF lancé', {
      description: 'Le rapport sera téléchargé dans quelques instants',
    });
  };

  const handleExportOracle = () => {
    toast.success('Export vers Oracle ERP lancé', {
      description: 'Les données sont en cours de synchronisation',
    });
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

  const handleProcessRequest = (id: number, action: 'process' | 'reject') => {
    setManagerRequests(managerRequests.map(req => 
      req.id === id ? { ...req, status: action === 'process' ? 'processed' : 'rejected' as const } : req
    ));
    toast.success(action === 'process' ? 'Demande traitée' : 'Demande rejetée');
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
            <span className="flex-1 text-left">Export Oracle</span>
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
              {currentPage === 'export' && 'Export Oracle ERP'}
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
              <div className="flex items-center justify-between">
                <h1 className="text-2xl text-slate-900">Reporting Global</h1>
                <div className="flex gap-3">
                  <Button onClick={handleExportCSV} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button onClick={handleExportPDF} className="bg-emerald-600 hover:bg-emerald-700">
                    <FileText className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>

              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-64">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Rechercher..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <Select value={filterDivision} onValueChange={setFilterDivision}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Division" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les divisions</SelectItem>
                        <SelectItem value="Production">Production</SelectItem>
                        <SelectItem value="Qualité">Qualité</SelectItem>
                        <SelectItem value="Logistique">Logistique</SelectItem>
                      </SelectContent>
                    </Select>

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

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Tableau complet de suivi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Matricule</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Employé</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Division</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Type</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Montant</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Date soumission</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Validé par</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.map((record) => (
                          <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                                {record.matricule}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-900">{record.employee}</td>
                            <td className="py-3 px-4 text-sm text-slate-700">{record.division}</td>
                            <td className="py-3 px-4 text-sm text-slate-700">{record.type}</td>
                            <td className="py-3 px-4 text-sm text-slate-900">{record.amount}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{record.submittedDate}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{record.validatedBy || '-'}</td>
                            <td className="py-3 px-4">{getStatusBadge(record.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentPage === 'export' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  <strong>Export Oracle ERP:</strong> Synchronisez les données validées vers le système de paie Oracle
                </p>
              </div>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Export vers Oracle ERP</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-xl text-center">
                      <p className="text-sm text-emerald-700">EVP prêts à exporter</p>
                      <p className="text-3xl text-emerald-700 mt-2">{validatedCount}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl text-center">
                      <p className="text-sm text-blue-700">Dernière synchro</p>
                      <p className="text-xl text-blue-700 mt-2">2025-10-12</p>
                      <p className="text-xs text-blue-600 mt-1">14:30</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl text-center">
                      <p className="text-sm text-slate-700">Statut connexion</p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
                        <p className="text-lg text-slate-900">Connecté</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Button
                      onClick={handleExportOracle}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Envoyer vers Oracle
                    </Button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-600">
                      💡 <strong>Note:</strong> L'export Oracle transfère uniquement les EVP avec statut "Validé". 
                      Les données sont automatiquement archivées après export.
                    </p>
                  </div>
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
                  <CardTitle>Liste des demandes en attente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Matricule</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Nom et Prénom</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Raison</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Demandé par</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Date</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Statut</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {managerRequests.map((request) => (
                          <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="border-blue-200 text-blue-700">
                                {request.matricule}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-900">{request.nomPrenom}</td>
                            <td className="py-3 px-4 text-sm text-slate-700">{request.raison}</td>
                            <td className="py-3 px-4 text-sm text-slate-700">{request.requestedBy}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{request.requestDate}</td>
                            <td className="py-3 px-4">
                              {request.status === 'pending' && (
                                <Badge className="bg-orange-100 text-orange-700 border-orange-200">En attente</Badge>
                              )}
                              {request.status === 'processed' && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Traité</Badge>
                              )}
                              {request.status === 'rejected' && (
                                <Badge className="bg-red-100 text-red-700 border-red-200">Rejeté</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {request.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleProcessRequest(request.id, 'process')}
                                    className="bg-emerald-600 hover:bg-emerald-700 h-8"
                                  >
                                    Traiter
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
                        ))}
                      </tbody>
                    </table>
                  </div>
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
    </div>
  );
}
