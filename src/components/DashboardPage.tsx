import { User } from '../App';
import AppLayout from './AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DashboardPageProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function DashboardPage({ user, onNavigate, onLogout }: DashboardPageProps) {
  const stats = [
    {
      title: 'En attente de validation',
      value: '24',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: '+12%',
    },
    {
      title: 'EVP validés ce mois',
      value: '156',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: '+8%',
    },
    {
      title: 'EVP rejetés',
      value: '8',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: '-3%',
    },
    {
      title: 'Employés actifs',
      value: '342',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+2%',
    },
  ];

  const monthlyData = [
    { month: 'Jan', submitted: 120, validated: 110, rejected: 10 },
    { month: 'Fév', submitted: 145, validated: 135, rejected: 10 },
    { month: 'Mar', submitted: 135, validated: 125, rejected: 10 },
    { month: 'Avr', submitted: 165, validated: 152, rejected: 13 },
    { month: 'Mai', submitted: 158, validated: 145, rejected: 13 },
    { month: 'Juin', submitted: 172, validated: 164, rejected: 8 },
  ];

  const recentActivities = [
    {
      id: 1,
      user: 'Hassan Mouhib',
      action: 'a soumis une demande de prime',
      time: 'Il y a 5 minutes',
      status: 'pending',
    },
    {
      id: 2,
      user: 'Amina Radi',
      action: 'a validé 12 heures supplémentaires',
      time: 'Il y a 15 minutes',
      status: 'approved',
    },
    {
      id: 3,
      user: 'Youssef Kadiri',
      action: 'a rejeté une demande de congé',
      time: 'Il y a 1 heure',
      status: 'rejected',
    },
    {
      id: 4,
      user: 'Salma Benjelloun',
      action: 'a soumis des heures supplémentaires',
      time: 'Il y a 2 heures',
      status: 'pending',
    },
    {
      id: 5,
      user: 'Omar Tazi',
      action: 'a validé une prime exceptionnelle',
      time: 'Il y a 3 heures',
      status: 'approved',
    },
  ];

  const pendingValidations = [
    { id: 1, employee: 'Khalid Mansouri', type: 'Heures supplémentaires', amount: '15h', date: '2025-10-12' },
    { id: 2, employee: 'Nadia El Amrani', type: 'Prime de rendement', amount: '2500 DH', date: '2025-10-12' },
    { id: 3, employee: 'Rachid Bousfiha', type: 'Absence', amount: '2 jours', date: '2025-10-11' },
    { id: 4, employee: 'Imane Semlali', type: 'Congé payé', amount: '5 jours', date: '2025-10-11' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">En attente</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Validé</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Rejeté</Badge>;
      default:
        return null;
    }
  };

  return (
    <AppLayout
      user={user}
      currentPage="dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      notifications={24}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl text-slate-900 mb-2">Tableau de bord</h1>
          <p className="text-slate-600">
            Vue d'ensemble des éléments variables de la paie - OCP Safi
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 mb-1">{stat.title}</p>
                      <h3 className="text-3xl text-slate-900 mb-2">{stat.value}</h3>
                      <p className="text-xs text-emerald-600">{stat.trend} vs mois dernier</p>
                    </div>
                    <div className={`${stat.bgColor} ${stat.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <Card className="lg:col-span-2 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Activité EVP mensuelle</span>
                <Badge variant="outline" className="border-slate-300">
                  Derniers 6 mois
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="validated" fill="#059669" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="rejected" fill="#dc2626" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Activités récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500">{activity.time}</p>
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending validations */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                Validations en attente
              </span>
              <Badge className="bg-orange-500 text-white">24 en attente</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Employé</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Type d'élément</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Montant/Durée</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Date de soumission</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingValidations.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-900">{item.employee}</td>
                      <td className="py-3 px-4 text-sm text-slate-700">{item.type}</td>
                      <td className="py-3 px-4 text-sm text-slate-900">{item.amount}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{item.date}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onNavigate('validation')}
                          className="text-sm text-emerald-600 hover:text-emerald-700"
                        >
                          Voir détails →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
