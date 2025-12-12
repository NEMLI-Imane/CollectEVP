import { ReactNode } from 'react';
import { User } from '../App';
import {
  LayoutDashboard,
  FileEdit,
  CheckSquare,
  History,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';

interface AppLayoutProps {
  user: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  children: ReactNode;
  notifications?: number;
}

export default function AppLayout({
  user,
  currentPage,
  onNavigate,
  onLogout,
  children,
  notifications = 0,
}: AppLayoutProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'saisie', label: 'Saisie EVP', icon: FileEdit },
    { id: 'validation', label: 'Validation', icon: CheckSquare, badge: notifications },
    { id: 'historique', label: 'Historique', icon: History },
    { id: 'reporting', label: 'Reporting', icon: BarChart3 },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center">
              <span className="text-white">OCP</span>
            </div>
            <div>
              <h1 className="text-slate-900">CollectEVP</h1>
              <p className="text-xs text-slate-500">Digital Payroll System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <Badge
                    className={`${
                      isActive ? 'bg-white text-emerald-700' : 'bg-orange-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
                {isActive && <ChevronRight className="w-4 h-4" />}
              </button>
            );
          })}
        </nav>

        {/* User section */}
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
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
              )}
            </Button>
            <div className="text-right">
              <p className="text-sm text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-emerald-600 text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
