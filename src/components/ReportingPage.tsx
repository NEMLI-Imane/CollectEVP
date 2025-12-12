import { useState } from 'react';
import { User } from '../App';
import AppLayout from './AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Download, FileText, Search, Filter, TrendingUp, PieChart } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';

interface ReportingPageProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface HistoryRecord {
  id: number;
  date: string;
  time: string;
  user: string;
  action: string;
  employee: string;
  type: string;
  amount: string;
  status: 'validated' | 'rejected' | 'submitted';
}

export default function ReportingPage({ user, onNavigate, onLogout }: ReportingPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('month');

  const history: HistoryRecord[] = [
    { id: 1, date: '2025-10-12', time: '14:30', user: 'Fatima Alami', action: 'Validation', employee: 'Hassan Mouhib', type: 'Prime', amount: '3500 DH', status: 'validated' },
    { id: 2, date: '2025-10-12', time: '14:15', user: 'Ahmed Bennani', action: 'Soumission', employee: 'Nadia El Amrani', type: 'Heures sup.', amount: '12h', status: 'submitted' },
    { id: 3, date: '2025-10-12', time: '13:45', user: 'Mohammed Tazi', action: 'Validation', employee: 'Youssef Kadiri', type: 'Congé', amount: '3 jours', status: 'validated' },
    { id: 4, date: '2025-10-11', time: '16:20', user: 'Fatima Alami', action: 'Rejet', employee: 'Rachid Bousfiha', type: 'Absence', amount: '2 jours', status: 'rejected' },
    { id: 5, date: '2025-10-11', time: '15:10', user: 'Ahmed Bennani', action: 'Soumission', employee: 'Imane Semlali', type: 'Prime', amount: '2500 DH', status: 'submitted' },
    { id: 6, date: '2025-10-11', time: '14:30', user: 'Mohammed Tazi', action: 'Validation', employee: 'Salma Benjelloun', type: 'Heures sup.', amount: '20h', status: 'validated' },
    { id: 7, date: '2025-10-10', time: '11:45', user: 'Fatima Alami', action: 'Validation', employee: 'Khalid Mansouri', type: 'Prime', amount: '3000 DH', status: 'validated' },
    { id: 8, date: '2025-10-10', time: '10:20', user: 'Ahmed Bennani', action: 'Soumission', employee: 'Omar Tazi', type: 'Congé', amount: '5 jours', status: 'submitted' },
  ];

  const typeDistribution = [
    { name: 'Primes', value: 45, color: '#059669' },
    { name: 'Heures sup.', value: 30, color: '#3b82f6' },
    { name: 'Congés', value: 15, color: '#f97316' },
    { name: 'Absences', value: 10, color: '#ef4444' },
  ];

  const divisionData = [
    { division: 'Production', validated: 85, rejected: 8 },
    { division: 'Qualité', validated: 42, rejected: 3 },
    { division: 'Logistique', validated: 38, rejected: 2 },
    { division: 'Maintenance', validated: 56, rejected: 5 },
  ];

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

  const filteredHistory = history.filter(record => {
    const matchesSearch = 
      record.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || record.type.toLowerCase().includes(filterType.toLowerCase());
    
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Validé</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Rejeté</Badge>;
      case 'submitted':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Soumis</Badge>;
      default:
        return null;
    }
  };

  return (
    <AppLayout
      user={user}
      currentPage="reporting"
      onNavigate={onNavigate}
      onLogout={onLogout}
      notifications={24}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-slate-900 mb-2">Reporting & Historique</h1>
            <p className="text-slate-600">
              Analyse des EVP et traçabilité complète des opérations
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleExportCSV} variant="outline" className="border-slate-300">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleExportPDF} className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600">Total EVP traités</p>
              <p className="text-3xl text-slate-900 mt-1">256</p>
              <p className="text-xs text-emerald-600 mt-1">+12% ce mois</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600">Taux de validation</p>
              <p className="text-3xl text-emerald-600 mt-1">94%</p>
              <p className="text-xs text-slate-600 mt-1">241 validés / 256 total</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600">Montant total primes</p>
              <p className="text-3xl text-blue-600 mt-1">685K DH</p>
              <p className="text-xs text-slate-600 mt-1">Octobre 2025</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600">Temps moyen validation</p>
              <p className="text-3xl text-orange-600 mt-1">1.2j</p>
              <p className="text-xs text-emerald-600 mt-1">-15% vs mois dernier</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-600" />
                Répartition par type d'EVP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                EVP par division
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={divisionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="division" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="validated" fill="#059669" name="Validés" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="rejected" fill="#ef4444" name="Rejetés" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher dans l'historique..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Type d'élément" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="prime">Primes</SelectItem>
                  <SelectItem value="heures">Heures supplémentaires</SelectItem>
                  <SelectItem value="congé">Congés</SelectItem>
                  <SelectItem value="absence">Absences</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* History table */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Historique des opérations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Date & Heure</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Utilisateur</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Action</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Employé</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Type</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Montant/Durée</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((record) => (
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-slate-900">{record.date}</p>
                          <p className="text-xs text-slate-500">{record.time}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">{record.user}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="border-slate-300">
                          {record.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">{record.employee}</td>
                      <td className="py-3 px-4 text-sm text-slate-700">{record.type}</td>
                      <td className="py-3 px-4 text-sm text-slate-900">{record.amount}</td>
                      <td className="py-3 px-4">{getStatusBadge(record.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Affichage de {filteredHistory.length} résultat(s)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Précédent</Button>
                <Button variant="outline" size="sm">Suivant</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
