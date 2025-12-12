import { useState } from 'react';
import { User } from '../App';
import AppLayout from './AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { FileEdit, Upload, Send, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface SaisieEVPPageProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface EmployeeEVP {
  id: number;
  matricule: string;
  nom: string;
  primes: string;
  heuresSup: string;
  absences: string;
  conges: string;
  hasJustificatif: boolean;
}

export default function SaisieEVPPage({ user, onNavigate, onLogout }: SaisieEVPPageProps) {
  const [employees, setEmployees] = useState<EmployeeEVP[]>([
    { id: 1, matricule: 'OCP001', nom: 'Ahmed Bennani', primes: '2500', heuresSup: '10', absences: '0', conges: '0', hasJustificatif: false },
    { id: 2, matricule: 'OCP002', nom: 'Fatima Zahra Alami', primes: '3000', heuresSup: '15', absences: '1', conges: '0', hasJustificatif: true },
    { id: 3, matricule: 'OCP003', nom: 'Mohammed Tazi', primes: '2000', heuresSup: '8', absences: '0', conges: '2', hasJustificatif: false },
    { id: 4, matricule: 'OCP004', nom: 'Nadia El Amrani', primes: '2800', heuresSup: '12', absences: '0', conges: '0', hasJustificatif: true },
    { id: 5, matricule: 'OCP005', nom: 'Hassan Mouhib', primes: '3500', heuresSup: '20', absences: '0', conges: '0', hasJustificatif: false },
  ]);

  const [newEmployee, setNewEmployee] = useState<EmployeeEVP>({
    id: 0,
    matricule: '',
    nom: '',
    primes: '0',
    heuresSup: '0',
    absences: '0',
    conges: '0',
    hasJustificatif: false,
  });

  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleInputChange = (id: number, field: keyof EmployeeEVP, value: string) => {
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, [field]: value } : emp
    ));
  };

  const handleUploadJustificatif = (id: number) => {
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, hasJustificatif: true } : emp
    ));
    toast.success('Justificatif ajouté avec succès');
  };

  const handleSubmit = () => {
    const hasData = employees.some(emp => 
      parseInt(emp.primes) > 0 || 
      parseInt(emp.heuresSup) > 0 || 
      parseInt(emp.absences) > 0 || 
      parseInt(emp.conges) > 0
    );

    if (!hasData) {
      toast.error('Veuillez saisir au moins un élément variable');
      return;
    }

    toast.success('EVP soumis pour validation avec succès !', {
      description: 'Les éléments seront validés par le responsable',
    });
  };

  const handleAddEmployee = () => {
    if (!newEmployee.matricule || !newEmployee.nom) {
      toast.error('Veuillez remplir le matricule et le nom');
      return;
    }

    setEmployees([...employees, { ...newEmployee, id: Date.now() }]);
    setNewEmployee({
      id: 0,
      matricule: '',
      nom: '',
      primes: '0',
      heuresSup: '0',
      absences: '0',
      conges: '0',
      hasJustificatif: false,
    });
    setShowAddDialog(false);
    toast.success('Employé ajouté avec succès');
  };

  const handleDeleteEmployee = (id: number) => {
    setEmployees(employees.filter(emp => emp.id !== id));
    toast.success('Employé supprimé');
  };

  return (
    <AppLayout
      user={user}
      currentPage="saisie"
      onNavigate={onNavigate}
      onLogout={onLogout}
      notifications={24}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-slate-900 mb-2">Saisie des EVP</h1>
            <p className="text-slate-600">
              Enregistrement des éléments variables de paie - Période: Octobre 2025
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-slate-600 hover:bg-slate-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter employé
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un nouvel employé</DialogTitle>
                  <DialogDescription>
                    Saisissez les informations de l'employé
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm text-slate-700 mb-1 block">Matricule</label>
                    <Input
                      placeholder="OCP006"
                      value={newEmployee.matricule}
                      onChange={(e) => setNewEmployee({ ...newEmployee, matricule: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-700 mb-1 block">Nom complet</label>
                    <Input
                      placeholder="Nom de l'employé"
                      value={newEmployee.nom}
                      onChange={(e) => setNewEmployee({ ...newEmployee, nom: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddEmployee} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Ajouter
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
            >
              <Send className="w-4 h-4 mr-2" />
              Soumettre pour validation
            </Button>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600">Employés</p>
              <p className="text-2xl text-slate-900 mt-1">{employees.length}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600">Total primes</p>
              <p className="text-2xl text-emerald-600 mt-1">
                {employees.reduce((sum, emp) => sum + parseInt(emp.primes || '0'), 0)} DH
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600">Heures sup. totales</p>
              <p className="text-2xl text-blue-600 mt-1">
                {employees.reduce((sum, emp) => sum + parseInt(emp.heuresSup || '0'), 0)}h
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600">Avec justificatifs</p>
              <p className="text-2xl text-orange-600 mt-1">
                {employees.filter(emp => emp.hasJustificatif).length}/{employees.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main table */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileEdit className="w-5 h-5 text-emerald-600" />
              Tableau de saisie des EVP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Matricule</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Nom</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Primes (DH)</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Heures Sup.</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Absences (j)</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Congés (j)</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Justificatif</th>
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
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          value={employee.primes}
                          onChange={(e) => handleInputChange(employee.id, 'primes', e.target.value)}
                          className="w-24 h-9"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          value={employee.heuresSup}
                          onChange={(e) => handleInputChange(employee.id, 'heuresSup', e.target.value)}
                          className="w-20 h-9"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          value={employee.absences}
                          onChange={(e) => handleInputChange(employee.id, 'absences', e.target.value)}
                          className="w-20 h-9"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          value={employee.conges}
                          onChange={(e) => handleInputChange(employee.id, 'conges', e.target.value)}
                          className="w-20 h-9"
                        />
                      </td>
                      <td className="py-3 px-4">
                        {employee.hasJustificatif ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            Ajouté
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUploadJustificatif(employee.id)}
                            className="h-8"
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Ajouter
                          </Button>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-600">
                💡 <strong>Astuce:</strong> N'oubliez pas d'ajouter les justificatifs pour les absences et congés. 
                Les éléments sans justificatif peuvent être rejetés lors de la validation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
