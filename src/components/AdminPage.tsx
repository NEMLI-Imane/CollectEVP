import { useState } from 'react';
import { User } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Switch } from './ui/switch';
import { Users, Database, Settings, LogOut, Plus, Trash2, Edit, CheckCircle2, Shield, Menu } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface AdminPageProps {
  user: User;
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

export default function AdminPage({ user, onLogout }: AdminPageProps) {
  const [currentPage, setCurrentPage] = useState<'users' | 'integration' | 'settings'>('users');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [erpIntegration, setErpIntegration] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success'>('idle');

  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([
    { id: 1, name: 'Ahmed Bennani', email: 'gestionnaire@ocp.ma', role: 'Gestionnaire', division: 'Production', status: 'active' },
    { id: 2, name: 'Fatima Zahra Alami', email: 'responsable.service@ocp.ma', role: 'Responsable Service', division: 'Service Maintenance', status: 'active' },
    { id: 3, name: 'Hassan Mouhib', email: 'responsable.division@ocp.ma', role: 'Responsable Division', division: 'Division Production', status: 'active' },
    { id: 4, name: 'Mohammed Tazi', email: 'rh@ocp.ma', role: 'RH', division: 'Ressources Humaines', status: 'active' },
    { id: 5, name: 'Salma Benjelloun', email: 's.benjelloun@ocp.ma', role: 'Gestionnaire', division: 'Qualité', status: 'active' },
  ]);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Gestionnaire',
    division: 'Production',
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  const handleTestConnection = () => {
    setConnectionStatus('testing');
    setTimeout(() => {
      setConnectionStatus('success');
      toast.success('Connexion Oracle ERP réussie !');
      setTimeout(() => setConnectionStatus('idle'), 3000);
    }, 2000);
  };

  const rolePermissions = {
    'Gestionnaire': ['Saisir EVP', 'Consulter historique'],
    'Responsable Service': ['Valider EVP service', 'Rejeter EVP', 'Consulter reporting'],
    'Responsable Division': ['Valider EVP division', 'Rejeter EVP', 'Reporting avancé'],
    'RH': ['Vue globale', 'Export Oracle', 'Reporting complet'],
    'Administrateur': ['Accès total', 'Gestion utilisateurs', 'Configuration système'],
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center">
              <span className="text-white">OCP</span>
            </div>
            <div>
              <h1 className="text-slate-900">CollectEVP</h1>
              <p className="text-xs text-slate-500">Administration</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setCurrentPage('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'users'
                ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="flex-1 text-left">Gestion utilisateurs</span>
          </button>

          <button
            onClick={() => setCurrentPage('integration')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'integration'
                ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Database className="w-5 h-5" />
            <span className="flex-1 text-left">Intégration Oracle</span>
          </button>

          <button
            onClick={() => setCurrentPage('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'settings'
                ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="flex-1 text-left">Paramètres système</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Avatar>
              <AvatarFallback className="bg-slate-700 text-white">
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
              {currentPage === 'users' && 'Gestion des utilisateurs'}
              {currentPage === 'integration' && 'Intégration Oracle'}
              {currentPage === 'settings' && 'Paramètres système'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">Administrateur</p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-slate-700 text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {currentPage === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl text-slate-900 mb-2">Gestion des utilisateurs</h1>
                  <p className="text-slate-600">
                    Gérez les comptes et permissions d'accès au système CollectEVP
                  </p>
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
                            <SelectItem value="Administrateur">Administrateur</SelectItem>
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
              </div>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Liste des utilisateurs ({systemUsers.length})</CardTitle>
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

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    Permissions par rôle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(rolePermissions).map(([role, permissions]) => (
                      <div key={role} className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-900 mb-3">{role}</p>
                        <ul className="space-y-2">
                          {permissions.map((permission, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <span>{permission}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentPage === 'integration' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl text-slate-900 mb-2">Intégration Oracle ERP</h1>
                <p className="text-slate-600">
                  Configuration de la connexion au système de paie Oracle
                </p>
              </div>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Configuration Oracle</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-900">Activer l'intégration Oracle ERP</p>
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
                            defaultValue="https://erp.ocp.ma/api/v1/payroll"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-slate-700 mb-2 block">Clé API</label>
                          <Input
                            type="password"
                            placeholder="••••••••••••••••"
                            defaultValue="sk_live_ocp_xxxxxxxxxxxxx"
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
                              <SelectItem value="daily">Quotidienne (recommandé)</SelectItem>
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

          {currentPage === 'settings' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl text-slate-900 mb-2">Paramètres système</h1>
                <p className="text-slate-600">
                  Configuration générale de l'application CollectEVP
                </p>
              </div>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Informations système</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-600">Version</p>
                      <p className="text-xl text-slate-900 mt-1">2.1.0</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-600">Utilisateurs</p>
                      <p className="text-xl text-slate-900 mt-1">{systemUsers.filter(u => u.status === 'active').length}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-600">Base de données</p>
                      <p className="text-lg text-slate-900 mt-1">PostgreSQL 15</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-600">Dernière MAJ</p>
                      <p className="text-lg text-slate-900 mt-1">10/10/2025</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 to-white">
                <CardContent className="p-6">
                  <h3 className="text-sm text-slate-900 mb-4">Statut du système</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                      <span className="text-sm text-slate-700">Application</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                        <span className="text-sm text-emerald-700">Opérationnel</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                      <span className="text-sm text-slate-700">Base de données</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                        <span className="text-sm text-emerald-700">Connectée</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                      <span className="text-sm text-slate-700">Oracle ERP</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                        <span className="text-sm text-emerald-700">Synchronisé</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
