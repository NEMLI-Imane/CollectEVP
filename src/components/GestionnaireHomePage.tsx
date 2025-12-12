import { useState, useEffect } from 'react';
import { User } from '../App';
import { getEmployees, Employee } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Calendar } from './ui/calendar';
import { Switch } from './ui/switch';
import { FileEdit, LogOut, Clock, CheckCircle2, Menu, Plus, CalendarDays, Send, Award, MessageSquare, RefreshCw } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  const [submittedCount, setSubmittedCount] = useState(0);
  const [employees, setEmployees] = useState<EmployeeEVP[]>([
    { id: 1, matricule: '45872', nom: 'Ahmed Bennani', poste: 'technicien', primeData: null, congeData: null, isSubmitted: false },
    { id: 2, matricule: '45873', nom: 'Fatima Zahra Alami', poste: 'cadre administratif', primeData: null, congeData: null, isSubmitted: false },
    { id: 3, matricule: '45874', nom: 'Mohammed Tazi', poste: 'agent de maîtrise', primeData: null, congeData: null, isSubmitted: false },
    { id: 4, matricule: '45875', nom: 'Salma Benjelloun', poste: 'technicien', primeData: null, congeData: null, isSubmitted: false },
  ]);

  // Dialog states
  const [primeDialogOpen, setPrimeDialogOpen] = useState(false);
  const [congeDialogOpen, setCongeDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeEVP | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

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

  // Charger les employés depuis l'API au chargement
  useEffect(() => {
    loadMasterEmployees();
  }, []);

  // Recharger les employés quand on accède à la page de saisie
  useEffect(() => {
    if (currentPage === 'saisie') {
      loadMasterEmployees();
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
        nom: `${emp.prenom} ${emp.nom}`,
        poste: emp.poste,
      }));
      setMasterEmployees(masterEmps);
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
      toast.error('Erreur lors du chargement des employés');
    } finally {
      setLoadingEmployees(false);
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const pendingCount = employees.filter(e => e.primeData || e.congeData).length;

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

  const savePrimeData = () => {
    if (!selectedEmployee) return;

    if (!primeForm.tauxMonetaire || !primeForm.nombrePostes) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setEmployees(employees.map(emp =>
      emp.id === selectedEmployee.id
        ? { ...emp, primeData: { ...primeForm } }
        : emp
    ));

    setPrimeDialogOpen(false);
    toast.success('Prime enregistrée avec succès');
  };

  // Congé Dialog Handlers
  const openCongeDialog = (employee: EmployeeEVP) => {
    setSelectedEmployee(employee);
    if (employee.congeData) {
      setCongeForm(employee.congeData);
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
    }
    setCongeDialogOpen(true);
  };

  const calculateCongeJours = (debut: Date | undefined, fin: Date | undefined) => {
    if (!debut || !fin) return 0;
    const diff = fin.getTime() - debut.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24)) + 1;
  };

  const calculateConge = () => {
    const jours = congeForm.nombreJours;
    const indemniteForfaitaire = parseFloat(congeForm.indemniteForfaitaire) || 0;
    const tranche = parseInt(congeForm.tranche) || 1;

    // Formule simplifiée
    const indemnite = (jours * indemniteForfaitaire * tranche) / 10;

    setCongeForm({ ...congeForm, indemniteCalculee: Math.round(indemnite) });
    toast.success('Indemnité calculée avec succès');
  };

  const saveCongeData = () => {
    if (!selectedEmployee) return;

    if (!congeForm.dateDebut || !congeForm.dateFin || !congeForm.indemniteForfaitaire) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setEmployees(employees.map(emp =>
      emp.id === selectedEmployee.id
        ? { ...emp, congeData: { ...congeForm } }
        : emp
    ));

    setCongeDialogOpen(false);
    toast.success('Congé enregistré avec succès');
  };

  // Submit handlers
  const submitEmployee = (id: number) => {
    const employee = employees.find(e => e.id === id);
    if (!employee) return;

    if (!employee.primeData && !employee.congeData) {
      toast.error('Veuillez saisir au moins une prime ou un congé');
      return;
    }

    // Remove the employee from the list after submission
    setEmployees(employees.filter(emp => emp.id !== id));
    setSubmittedCount(submittedCount + 1);

    toast.success(`EVP de ${employee.nom} soumis pour validation`);
  };

  const submitAll = () => {
    const employeesWithData = employees.filter(e => e.primeData || e.congeData);

    if (employeesWithData.length === 0) {
      toast.error('Aucune donnée à soumettre');
      return;
    }

    // Remove all employees with data from the list after submission
    setEmployees(employees.filter(emp => !emp.primeData && !emp.congeData));
    setSubmittedCount(submittedCount + employeesWithData.length);

    toast.success('Toutes les données ont été transmises pour validation hiérarchique', {
      description: `${employeesWithData.length} employé(s) soumis`,
    });
  };

  // Note: Les employés sont maintenant gérés par le RH, donc on ne permet plus l'ajout/modification/suppression ici
  // Les gestionnaires peuvent seulement sélectionner des employés existants

  // Add employee to EVP saisie from dropdown
  const handleAddEmployee = async () => {
    if (!selectedEmployeeId) {
      toast.error('Veuillez sélectionner un employé');
      return;
    }

    // Recharger les employés depuis la BDD pour avoir les dernières données
    await loadMasterEmployees();
    
    const masterEmployee = masterEmployees.find(emp => emp.id.toString() === selectedEmployeeId);
    if (!masterEmployee) {
      toast.error('Employé non trouvé');
      return;
    }

    if (employees.some(emp => emp.matricule === masterEmployee.matricule)) {
      toast.error('Cet employé est déjà dans la liste de saisie EVP');
      return;
    }

    setEmployees([
      ...employees,
      {
        id: Date.now(),
        matricule: masterEmployee.matricule,
        nom: masterEmployee.nom,
        poste: masterEmployee.poste,
        primeData: null,
        congeData: null,
        isSubmitted: false,
      },
    ]);

    setSelectedEmployeeId('');
    setShowAddDialog(false);
    toast.success('Employé ajouté avec succès');
  };

  // Request missing employee to RH
  const handleRequestEmployee = () => {
    toast.success('Demande envoyée au service RH', {
      description: 'Le service RH traitera votre demande dans les plus brefs délais',
    });
    setShowRequestDialog(false);
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
                      Tableau de saisie {saisieTab === 'prime' ? 'Primes' : 'Congés'} - Période: Octobre 2025
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
                        <Button
                          onClick={() => setShowAddDialog(true)}
                          variant="outline"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter employé
                        </Button>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Ajouter un employé à la saisie EVP</DialogTitle>
                            <DialogDescription>
                              Sélectionnez un employé de votre équipe dans la liste déroulante
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <label className="text-sm text-slate-700 mb-2 block">Sélectionner un employé</label>
                              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choisir un employé..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {loadingEmployees ? (
                                    <SelectItem value="" disabled>Chargement...</SelectItem>
                                  ) : masterEmployees.length === 0 ? (
                                    <SelectItem value="" disabled>Aucun employé disponible</SelectItem>
                                  ) : (
                                    masterEmployees.map((emp) => (
                                      <SelectItem key={emp.id} value={emp.id.toString()}>
                                        {emp.matricule} - {emp.nom} ({emp.poste})
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            {selectedEmployeeId && masterEmployees.find(emp => emp.id.toString() === selectedEmployeeId) && (
                              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                                <p className="text-sm text-emerald-900">
                                  <strong>Matricule:</strong> {masterEmployees.find(emp => emp.id.toString() === selectedEmployeeId)?.matricule}
                                </p>
                                <p className="text-sm text-emerald-900">
                                  <strong>Nom:</strong> {masterEmployees.find(emp => emp.id.toString() === selectedEmployeeId)?.nom}
                                </p>
                                <p className="text-sm text-emerald-900">
                                  <strong>Poste:</strong> {masterEmployees.find(emp => emp.id.toString() === selectedEmployeeId)?.poste}
                                </p>
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => { setShowAddDialog(false); setSelectedEmployeeId(''); }}>
                              Annuler
                            </Button>
                            <Button onClick={handleAddEmployee} className="bg-emerald-600 hover:bg-emerald-700">
                              Ajouter
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
                        {employees.map((employee) => (
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
                              <Button
                                size="sm"
                                onClick={() => submitEmployee(employee.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 h-8"
                                disabled={!employee.primeData && !employee.congeData}
                              >
                                Soumettre
                              </Button>
                            </td>
                          </tr>
                        ))}
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
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Matricule</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Nom</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Poste</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Type EVP</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Montant (DH)</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Date soumission</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Statut</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-600">Commentaire</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700">45872</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-900">Ahmed Bennani</td>
                          <td className="py-3 px-4 text-sm text-slate-600">TAMCA</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Prime de performance</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-900">2,850 DH</td>
                          <td className="py-3 px-4 text-sm text-slate-700">2025-10-10</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Validé</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600 italic">Excellent travail</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700">45873</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-900">Fatima Zahra Alami</td>
                          <td className="py-3 px-4 text-sm text-slate-600">OE</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-blue-50 text-blue-700 border border-blue-200">Congé</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-900">1,200 DH</td>
                          <td className="py-3 px-4 text-sm text-slate-700">2025-10-10</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Validé</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600 italic">Approuvé</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700">45874</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-900">Mohammed Tazi</td>
                          <td className="py-3 px-4 text-sm text-slate-600">TAMCA</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Prime de performance</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-900">3,100 DH</td>
                          <td className="py-3 px-4 text-sm text-slate-700">2025-10-08</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200">En attente</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-400 italic">-</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700">45875</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-900">Salma Benjelloun</td>
                          <td className="py-3 px-4 text-sm text-slate-600">OE</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-blue-50 text-blue-700 border border-blue-200">Congé</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-900">950 DH</td>
                          <td className="py-3 px-4 text-sm text-slate-700">2025-10-08</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-red-100 text-red-700 border-red-200">Rejeté</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-red-600 italic">Dates incorrectes</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700">45872</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-900">Ahmed Bennani</td>
                          <td className="py-3 px-4 text-sm text-slate-600">TAMCA</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-blue-50 text-blue-700 border border-blue-200">Congé</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-900">1,450 DH</td>
                          <td className="py-3 px-4 text-sm text-slate-700">2025-10-05</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Validé</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600 italic">Conforme</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700">45876</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-900">Karim Idrissi</td>
                          <td className="py-3 px-4 text-sm text-slate-600">TAMCA</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Prime de performance</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-900">2,600 DH</td>
                          <td className="py-3 px-4 text-sm text-slate-700">2025-10-03</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Validé</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600 italic">RAS</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
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
              <label className="text-sm text-slate-700">Date début</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {congeForm.dateDebut ? format(congeForm.dateDebut, 'dd/MM/yyyy', { locale: fr }) : 'Sélectionner'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={congeForm.dateDebut}
                    onSelect={(date) => {
                      const jours = calculateCongeJours(date, congeForm.dateFin);
                      setCongeForm({ ...congeForm, dateDebut: date, nombreJours: jours });
                    }}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700">Date fin</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {congeForm.dateFin ? format(congeForm.dateFin, 'dd/MM/yyyy', { locale: fr }) : 'Sélectionner'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={congeForm.dateFin}
                    onSelect={(date) => {
                      const jours = calculateCongeJours(congeForm.dateDebut, date);
                      setCongeForm({ ...congeForm, dateFin: date, nombreJours: jours });
                    }}
                    locale={fr}
                    disabled={(date) => congeForm.dateDebut ? date < congeForm.dateDebut : false}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700">Nombre de jours</label>
              <Input
                type="number"
                value={congeForm.nombreJours}
                disabled
                className="bg-slate-50"
              />
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

            {congeForm.avanceSurConge && (
              <div className="space-y-2">
                <label className="text-sm text-slate-700">Montant avance (DH)</label>
                <Input
                  type="number"
                  placeholder="Ex: 1000"
                  value={congeForm.montantAvance}
                  onChange={(e) => setCongeForm({ ...congeForm, montantAvance: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-slate-700">Indemnité forfaitaire de congé</label>
              <Input
                type="number"
                placeholder="Ex: 500"
                value={congeForm.indemniteForfaitaire}
                onChange={(e) => setCongeForm({ ...congeForm, indemniteForfaitaire: e.target.value })}
              />
            </div>
          </div>

          {congeForm.indemniteCalculee > 0 && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="space-y-2">
                <p className="text-sm text-blue-900 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  <strong>
                    Congé du {congeForm.dateDebut && format(congeForm.dateDebut, 'dd/MM', { locale: fr })} au{' '}
                    {congeForm.dateFin && format(congeForm.dateFin, 'dd/MM', { locale: fr })} — {congeForm.nombreJours} jours
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
              <label className="text-sm text-slate-700 mb-2 block">Matricule de l'employé</label>
              <Input placeholder="Ex: 45890" />
            </div>
            <div>
              <label className="text-sm text-slate-700 mb-2 block">Nom et prénom</label>
              <Input placeholder="Ex: Hassan Benjelloun" />
            </div>
            <div>
              <label className="text-sm text-slate-700 mb-2 block">Raison de la demande</label>
              <Input placeholder="Ex: Nouvel employé non enregistré" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
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
