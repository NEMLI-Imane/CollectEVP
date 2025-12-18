import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import ocpLogo from 'figma:asset/15e05f8825e5122b1dc358c8f317ca5fb83eb02f.png';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📝 Soumission du formulaire de connexion');
      await onLogin(email, password);
      console.log('✅ Connexion réussie, redirection en cours...');
      // Le composant App.tsx devrait maintenant afficher le dashboard
      // isLoading sera géré par le re-render de App.tsx
    } catch (error) {
      // L'erreur est déjà gérée dans App.tsx avec toast
      console.error('❌ Erreur de connexion:', error);
      // Afficher un message d'erreur local si App.tsx ne le fait pas
      if (error instanceof Error) {
        toast.error(error.message || 'Erreur de connexion');
      }
    } finally {
      // Toujours réinitialiser isLoading, même en cas d'erreur
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900">
      {/* Left side - Decorative avec grand logo OCP */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 relative overflow-hidden">
        {/* Grand logo OCP en arrière-plan */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <img 
            src={ocpLogo} 
            alt="OCP Logo" 
            className="w-[800px] h-auto object-contain"
          />
        </div>
        
        {/* Effets de lumière */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400 rounded-full blur-3xl"></div>
        </div>

        {/* Motifs géométriques */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-64 h-64 border-4 border-white rounded-3xl rotate-12"></div>
          <div className="absolute bottom-10 left-10 w-48 h-48 border-4 border-white rounded-full"></div>
          <div className="absolute top-1/3 right-1/4 w-32 h-32 border-4 border-orange-400 rounded-2xl -rotate-12"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center py-16 px-16 text-white h-full">
          <div>
            <div className="mb-8">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 inline-block border border-white/30 shadow-2xl">
                <img 
                  src={ocpLogo} 
                  alt="OCP Logo" 
                  className="h-20 w-auto object-contain"
                />
              </div>
            </div>
            <h1 className="text-6xl mb-4 tracking-tight">CollectEVP</h1>
            <p className="text-2xl opacity-90 leading-relaxed">
              Système Digital de Gestion<br />des Éléments Variables de la Paie
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white lg:bg-transparent relative">
        {/* Mobile background avec logo */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 opacity-5">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <img 
              src={ocpLogo} 
              alt="OCP Logo" 
              className="w-[500px] h-auto object-contain"
            />
          </div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-slate-200 backdrop-blur-sm">
            <div className="text-center mb-8">
              <h2 className="text-3xl text-slate-900 mb-3">Bienvenue</h2>
              <p className="text-slate-600 text-lg">
                Plateforme de gestion des éléments variables de la paie
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre.email@ocp.ma"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 rounded-xl border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-4 pr-12 h-14 rounded-xl border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  className="text-emerald-600 hover:text-emerald-700 transition-colors text-sm"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Connexion en cours...' : 'Se connecter'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-slate-500">
                © 2025 OCP Safi - Tous droits réservés
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
