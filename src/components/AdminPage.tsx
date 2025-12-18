import { useState, useEffect } from 'react';
import { User } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Switch } from './ui/switch';
import { Users, Database, Settings, LogOut, Plus, Trash2, Edit, CheckCircle2, Shield, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { getUsers, createUser, updateUser, deleteUser, SystemUser } from '../services/api';
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


export default function AdminPage({ user, onLogout }: AdminPageProps) {
  const [currentPage, setCurrentPage] = useState<'users' | 'settings'>('users');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Gestionnaire',
    division: 'Production',
    password: 'password123',
  });

  // Charger les utilisateurs depuis l'API
  useEffect(() => {
    if (currentPage === 'users') {
      loadUsers();
    }
  }, [currentPage]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const users = await getUsers();
      setSystemUsers(users);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast.error('Erreur lors du chargement des utilisateurs: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setLoadingUsers(false);
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

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await createUser({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        division: newUser.division,
        password: newUser.password,
      });

      setNewUser({
        name: '',
        email: '',
        role: 'Gestionnaire',
        division: 'Production',
        password: 'password123',
      });
      setShowAddUserDialog(false);
      toast.success('Utilisateur ajouté avec succès');
      await loadUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(`Erreur lors de l'ajout: ${errorMessage}`);
    }
  };

  const handleEditUser = (usr: SystemUser) => {
    setEditingUser(usr);
    setNewUser({
      name: usr.name,
      email: usr.email,
      role: usr.role,
      division: usr.division || 'Production',
      password: '',
    });
    setShowEditUserDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !newUser.name || !newUser.email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const updateData: any = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        division: newUser.division,
        status: editingUser.status,
      };
      
      if (newUser.password && newUser.password.trim() !== '') {
        updateData.password = newUser.password;
      }

      await updateUser(editingUser.id, updateData);
      
      setShowEditUserDialog(false);
      setEditingUser(null);
      setNewUser({
        name: '',
        email: '',
        role: 'Gestionnaire',
        division: 'Production',
        password: 'password123',
      });
      toast.success('Utilisateur modifié avec succès');
      await loadUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(`Erreur lors de la modification: ${errorMessage}`);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      await deleteUser(id);
      toast.success('Utilisateur supprimé');
      await loadUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(`Erreur lors de la suppression: ${errorMessage}`);
    }
  };

  const handleToggleUserStatus = async (id: number) => {
    const usr = systemUsers.find(u => u.id === id);
    if (!usr) return;

    try {
      await updateUser(id, {
        status: usr.status === 'active' ? 'inactive' : 'active',
      });
      toast.success('Statut utilisateur mis à jour');
      await loadUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(`Erreur lors de la mise à jour: ${errorMessage}`);
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

  const rolePermissions = {
    'Gestionnaire': [
      'Saisie EVP (Prime et Congé)',
      'Soumission',
      'Historique',
      'Demande ajout employés'
    ],
    'Responsable Service': [
      'Validation/rejet niveau service',
      'Historique',
      'Commentaires de rejet'
    ],
    'Responsable Division': [
      'Validation/rejet niveau division',
      'Historique'
    ],
    'RH': [
      'Reporting global',
      'Gestion employés',
      'Traitement demandes',
      'Historique consolidé'
    ],
    'Administrateur': [
      'Gestion utilisateurs',
      'Activation/désactivation',
      'Configuration système',
      'Gestion rôles'
    ],
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
                      <div>
                        <label className="text-sm text-slate-700 mb-1 block">Mot de passe</label>
                        <Input
                          type="password"
                          placeholder="password123 (par défaut)"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setShowAddUserDialog(false);
                        setNewUser({ name: '', email: '', role: 'Gestionnaire', division: 'Production', password: 'password123' });
                      }}>
                        Annuler
                      </Button>
                      <Button onClick={handleAddUser} className="bg-emerald-600 hover:bg-emerald-700">
                        Ajouter
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Edit User Dialog */}
                <Dialog open={showEditUserDialog} onOpenChange={(open) => {
                  setShowEditUserDialog(open);
                  if (!open) {
                    setEditingUser(null);
                    setNewUser({ name: '', email: '', role: 'Gestionnaire', division: 'Production', password: 'password123' });
                  }
                }}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Modifier un utilisateur</DialogTitle>
                      <DialogDescription>
                        Modifiez les informations de l'utilisateur
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
                      <div>
                        <label className="text-sm text-slate-700 mb-1 block">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                        <Input
                          type="password"
                          placeholder="Laisser vide pour ne pas changer"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setShowEditUserDialog(false);
                        setEditingUser(null);
                        setNewUser({ name: '', email: '', role: 'Gestionnaire', division: 'Production', password: 'password123' });
                      }}>
                        Annuler
                      </Button>
                      <Button onClick={handleUpdateUser} className="bg-emerald-600 hover:bg-emerald-700">
                        Modifier
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
                  {loadingUsers ? (
                    <div className="text-center py-8 text-slate-500">Chargement des utilisateurs...</div>
                  ) : (
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
                          {systemUsers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-slate-500">
                                Aucun utilisateur trouvé
                              </td>
                            </tr>
                          ) : (
                            systemUsers.map((usr) => (
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
                                  onClick={() => handleEditUser(usr)}
                                  className="h-8"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleToggleUserStatus(usr.id)}
                                  className="h-8"
                                  title={usr.status === 'active' ? 'Désactiver' : 'Activer'}
                                >
                                  <Shield className={`w-3 h-3 ${usr.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`} />
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
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
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
                      <p className="text-xl text-slate-900 mt-1">1.0.0</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-600">Utilisateurs actifs</p>
                      <p className="text-xl text-slate-900 mt-1">{systemUsers.filter(u => u.status === 'active').length}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-600">Base de données</p>
                      <p className="text-lg text-slate-900 mt-1">SQLite 3</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-600">Framework</p>
                      <p className="text-lg text-slate-900 mt-1">Symfony 6.4</p>
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
                      <span className="text-sm text-slate-700">API Backend</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                        <span className="text-sm text-emerald-700">Disponible</span>
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
