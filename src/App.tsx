import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import GestionnaireHomePage from './components/GestionnaireHomePage';
import ResponsableServicePage from './components/ResponsableServicePage';
import ResponsableDivisionPage from './components/ResponsableDivisionPage';
import RHPage from './components/RHPage';
import AdminPage from './components/AdminPage';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { login, logout as apiLogout, getCurrentUser, getToken } from './services/api';
import { toast } from 'sonner@2.0.3';

export type UserRole = 'Gestionnaire' | 'Responsable Service' | 'Responsable Division' | 'RH' | 'Administrateur';

export interface User {
  name: string;
  email: string;
  role: UserRole;
  division?: string;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const user = await getCurrentUser();
          setCurrentUser({
            name: user.name,
            email: user.email,
            role: user.role as UserRole,
            division: user.division,
          });
          setIsAuthenticated(true);
        } catch (error) {
          // Token invalide ou expiré, déconnexion
          console.error('Erreur de vérification de session:', error);
          apiLogout();
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log('🚀 Début de la connexion...');
      const response = await login(email, password);
      console.log('✅ Réponse login complète:', response);
      console.log('👤 Rôle reçu:', response.user.role);
      
      if (!response.user) {
        console.error('❌ Pas de données utilisateur dans la réponse');
        throw new Error('Réponse invalide: données utilisateur manquantes');
      }
      
      // Normaliser le rôle pour correspondre aux types attendus
      let normalizedRole = response.user.role;
      if (typeof normalizedRole === 'string') {
        // S'assurer que le rôle correspond exactement aux valeurs attendues
        const roleMap: Record<string, UserRole> = {
          'Gestionnaire': 'Gestionnaire',
          'Responsable Service': 'Responsable Service',
          'Responsable Division': 'Responsable Division',
          'RH': 'RH',
          'Administrateur': 'Administrateur',
        };
        normalizedRole = roleMap[normalizedRole] || normalizedRole as UserRole;
      }
      
      const userData: User = {
        name: response.user.name || 'Utilisateur',
        email: response.user.email,
        role: normalizedRole as UserRole,
        division: response.user.division,
      };
      
      console.log('📝 Données utilisateur normalisées:', userData);
      console.log('📝 Type de rôle:', typeof userData.role, userData.role);
      
      // Mettre à jour l'état de manière synchrone
      setCurrentUser(userData);
      setIsAuthenticated(true);
      
      console.log('✅ Authentification définie');
      console.log('✅ isAuthenticated:', true);
      console.log('✅ currentUser:', userData);
      
      toast.success('Connexion réussie !');
      
    } catch (error) {
      console.error('❌ Erreur dans handleLogin:', error);
      const errorMessage = error instanceof Error ? error.message : 'Email ou mot de passe incorrect';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleLogout = () => {
    apiLogout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    toast.success('Déconnexion réussie');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Render appropriate dashboard based on user role
  const renderRoleBasedView = () => {
    console.log('🎨 Rendu basé sur le rôle');
    console.log('📊 isAuthenticated:', isAuthenticated);
    console.log('👤 currentUser:', currentUser);
    console.log('🔑 Rôle actuel:', currentUser?.role);
    console.log('🔑 Type du rôle:', typeof currentUser?.role);
    
    if (!currentUser) {
      console.error('❌ Aucun utilisateur défini');
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600">Erreur: Aucun utilisateur défini</p>
            <Button onClick={handleLogout} className="mt-4">Se déconnecter</Button>
          </div>
        </div>
      );
    }
    
    const roleString = String(currentUser.role);
    console.log('🔍 Rôle en string:', roleString);
    
    switch (roleString) {
      case 'Gestionnaire':
        console.log('Affichage de la page Gestionnaire');
        return <GestionnaireHomePage user={currentUser} onLogout={handleLogout} />;
      case 'Responsable Service':
        console.log('Affichage de la page Responsable Service');
        return <ResponsableServicePage user={currentUser} onLogout={handleLogout} />;
      case 'Responsable Division':
        console.log('Affichage de la page Responsable Division');
        return <ResponsableDivisionPage user={currentUser} onLogout={handleLogout} />;
      case 'RH':
        console.log('Affichage de la page RH');
        return <RHPage user={currentUser} onLogout={handleLogout} />;
      case 'Administrateur':
        console.log('Affichage de la page Administrateur');
        return <AdminPage user={currentUser} onLogout={handleLogout} />;
      default:
        console.error('❌ Rôle non reconnu:', currentUser.role);
        console.error('❌ Type:', typeof currentUser.role);
        console.error('❌ Valeur brute:', JSON.stringify(currentUser.role));
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 mb-2">Rôle non reconnu: {String(currentUser.role)}</p>
              <p className="text-sm text-gray-600 mb-4">Rôles attendus: Gestionnaire, Responsable Service, Responsable Division, RH, Administrateur</p>
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Données utilisateur complètes:</p>
                <pre className="text-xs bg-gray-100 p-2 rounded text-left max-w-md overflow-auto">
                  {JSON.stringify(currentUser, null, 2)}
                </pre>
              </div>
              <Button onClick={handleLogout} className="mt-4">Se déconnecter</Button>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        {renderRoleBasedView()}
      </div>
      <Toaster />
    </>
  );
}
