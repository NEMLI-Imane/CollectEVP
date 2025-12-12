import { useState } from 'react';
import { User } from '../App';
import AppLayout from './AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Settings, Users, Shield, Database, CheckCircle2, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
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
  DialogTrigger,
} from './ui/dialog';

interface SettingsPageProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface SystemUser {
  id: number;
  name: string;
  email: string;
  role: string;
  division: string;
  status: 'active' | 'inactive';
}

export default function SettingsPage({ user, onNavigate, onLogout }: SettingsPageProps) {
  const [erpIntegration, setErpIntegration] = useState(true);
  const [autoValidation, setAutoValidation] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([
    { id: 1, name: 'Ahmed Bennani', email: 'gestionnaire@ocp.ma', role: 'Gestionnaire', division: 'Production', status: 'active' },
    { id: 2, name: 'Fatima Zahra Alami', email: 'responsable@ocp.ma', role: 'Responsable Service', division: 'Qualité', status: 'active' },
    { id: 3, name: 'Mohammed Tazi', email: 'rh@ocp.ma', role: 'RH', division: 'Ressources Humaines', status: 'active' },
    { id: 4, name: 'Hassan Mouhib', email: 'h.mouhib@ocp.ma', role: 'Gestionnaire', division: 'Logistique', status: 'active' },
    { id: 5, name: 'Nadia El Amrani', email: 'n.elamrani@ocp.ma', role: 'Responsable Division', division: 'Production', status: 'active' },
  ]);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Gestionnaire',
    division: 'Production',
  });

  const handleTestConnection = () => {
    setConnectionStatus('testing');
    setTimeout(() => {
      setConnectionStatus('success');
      toast.success('Connexion réussie !', {
        description: 'L\'intégration Oracle ERP fonctionne correctement',
      });
      setTimeout(() => setConnectionStatus('idle'), 3000);
    }, 2000);
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSystemUsers([
      ...systemUsers,
      {
        id: Date.now(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        division: newUser.division,
        status: 'active',
      },
    ]);

    setNewUser({
      name: '',
      email: '',
      role: 'Gestionnaire',
      division: 'Production',
    });
    setShowAddUserDialog(false);
    toast.success('Utilisateur ajouté avec succès');
  };

  const handleDeleteUser = (id: number) => {
    setSystemUsers(systemUsers.filter(u => u.id !== id));
    toast.success('Utilisateur supprimé');
  };

  const handleToggleUserStatus = (id: number) => {
    setSystemUsers(systemUsers.map(u => 
      u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' as const : 'active' as const } : u
    ));
    toast.success('Statut utilisateur mis à jour');
  };

  const rolePermissions = {
    'Gestionnaire': ['Saisir EVP', 'Consulter historique'],
    'Responsable Service': ['Valider EVP service', 'Rejeter EVP', 'Consulter reporting'],
    'Responsable Division': ['Valider EVP division', 'Rejeter EVP', 'Consulter reporting avancé'],
    'RH': ['Accès total', 'Export données', 'Gestion utilisateurs', 'Paramètres système'],
  };

  return (
    <AppLayout
      user={user}
      currentPage="settings"
      onNavigate={onNavigate}
      onLogout={onLogout}
      notifications={24}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl text-slate-900 mb-2">Paramètres & Administration</h1>
          <p className="text-slate-600">
            Configuration du système et gestion des utilisateurs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Integration settings */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  Intégration ERP Oracle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-900">Activer l'intégration Oracle ERP</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Synchronisation automatique des données EVP avec Oracle
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
                        <label className="text-sm text-slate-700 mb-2 block">URL du serveur</label>
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

            {/* General settings */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-600" />
                  Paramètres généraux
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-900">Validation automatique</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Auto-valider les EVP en dessous d'un certain seuil
                    </p>
                  </div>
                  <Switch
                    checked={autoValidation}
                    onCheckedChange={setAutoValidation}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-900">Notifications email</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Envoyer des emails pour les validations en attente
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-700">Seuil de validation automatique (DH)</label>
                  <Input
                    type="number"
                    placeholder="1000"
                    defaultValue="1000"
                    disabled={!autoValidation}
                  />
                  <p className="text-xs text-slate-500">
                    Les primes inférieures à ce montant seront validées automatiquement
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* User Management */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    Gestion des utilisateurs
                  </div>
                  <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter utilisateur
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
                        <DialogDescription>
                          Créez un compte utilisateur pour accéder au système CollectEVP
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-slate-700 mb-1 block">Nom complet</label>
                          <Input
                            placeholder="Nom de l'utilisateur"
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-slate-700 mb-1 block">Email</label>
                          <Input
                            type="email"
                            placeholder="email@ocp.ma"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-slate-700 mb-1 block">Rôle</label>
                          <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Gestionnaire">Gestionnaire</SelectItem>
                              <SelectItem value="Responsable Service">Responsable Service</SelectItem>
                              <SelectItem value="Responsable Division">Responsable Division</SelectItem>
                              <SelectItem value="RH">RH</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm text-slate-700 mb-1 block">Division</label>
                          <Select value={newUser.division} onValueChange={(value) => setNewUser({ ...newUser, division: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Production">Production</SelectItem>
                              <SelectItem value="Qualité">Qualité</SelectItem>
                              <SelectItem value="Logistique">Logistique</SelectItem>
                              <SelectItem value="Maintenance">Maintenance</SelectItem>
                              <SelectItem value="Ressources Humaines">Ressources Humaines</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                          Annuler
                        </Button>
                        <Button onClick={handleAddUser} className="bg-emerald-600 hover:bg-emerald-700">
                          Ajouter
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="text-left py-3 px-4 text-sm text-slate-600">Nom</th>
                        <th className="text-left py-3 px-4 text-sm text-slate-600">Email</th>
                        <th className="text-left py-3 px-4 text-sm text-slate-600">Rôle</th>
                        <th className="text-left py-3 px-4 text-sm text-slate-600">Division</th>
                        <th className="text-left py-3 px-4 text-sm text-slate-600">Statut</th>
                        <th className="text-left py-3 px-4 text-sm text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemUsers.map((usr) => (
                        <tr key={usr.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-sm text-slate-900">{usr.name}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{usr.email}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                              {usr.role}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-700">{usr.division}</td>
                          <td className="py-3 px-4">
                            <Badge
                              className={usr.status === 'active' 
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                              }
                            >
                              {usr.status === 'active' ? 'Actif' : 'Inactif'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleUserStatus(usr.id)}
                                className="h-8"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteUser(usr.id)}
                                className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Role permissions sidebar */}
          <div className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  Permissions par rôle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(rolePermissions).map(([role, permissions]) => (
                  <div key={role} className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-900 mb-2">{role}</p>
                    <ul className="space-y-1">
                      {permissions.map((permission, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>{permission}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 to-white">
              <CardContent className="p-6">
                <h3 className="text-sm text-slate-900 mb-2">Informations système</h3>
                <div className="space-y-2 text-xs text-slate-600">
                  <p><strong>Version:</strong> 2.1.0</p>
                  <p><strong>Dernière mise à jour:</strong> 10/10/2025</p>
                  <p><strong>Utilisateurs actifs:</strong> {systemUsers.filter(u => u.status === 'active').length}</p>
                  <p><strong>Base de données:</strong> PostgreSQL 15</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
