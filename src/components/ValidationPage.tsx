import { useState } from 'react';
import { User } from '../App';
import AppLayout from './AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { CheckCircle2, XCircle, Filter, Search, FileText, Clock } from 'lucide-react';
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

interface ValidationPageProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface EVPSubmission {
  id: number;
  employee: string;
  matricule: string;
  type: string;
  amount: string;
  submittedBy: string;
  submittedDate: string;
  division: string;
  service: string;
  status: 'pending' | 'validated' | 'rejected';
  hasJustificatif: boolean;
}

export default function ValidationPage({ user, onNavigate, onLogout }: ValidationPageProps) {
  const [submissions, setSubmissions] = useState<EVPSubmission[]>([
    { id: 1, employee: 'Khalid Mansouri', matricule: 'OCP012', type: 'Heures supplémentaires', amount: '15h', submittedBy: 'Ahmed Bennani', submittedDate: '2025-10-12', division: 'Production', service: 'Maintenance', status: 'pending', hasJustificatif: true },
    { id: 2, employee: 'Nadia El Amrani', matricule: 'OCP034', type: 'Prime de rendement', amount: '2500 DH', submittedBy: 'Fatima Alami', submittedDate: '2025-10-12', division: 'Qualité', service: 'Contrôle', status: 'pending', hasJustificatif: true },
    { id: 3, employee: 'Rachid Bousfiha', matricule: 'OCP045', type: 'Absence', amount: '2 jours', submittedBy: 'Ahmed Bennani', submittedDate: '2025-10-11', division: 'Production', service: 'Fabrication', status: 'pending', hasJustificatif: false },
    { id: 4, employee: 'Imane Semlali', matricule: 'OCP067', type: 'Congé payé', amount: '5 jours', submittedBy: 'Mohammed Tazi', submittedDate: '2025-10-11', division: 'Logistique', service: 'Expédition', status: 'pending', hasJustificatif: true },
    { id: 5, employee: 'Youssef Kadiri', matricule: 'OCP089', type: 'Prime exceptionnelle', amount: '3000 DH', submittedBy: 'Fatima Alami', submittedDate: '2025-10-10', division: 'Production', service: 'Maintenance', status: 'pending', hasJustificatif: true },
    { id: 6, employee: 'Salma Benjelloun', matricule: 'OCP091', type: 'Heures supplémentaires', amount: '20h', submittedBy: 'Ahmed Bennani', submittedDate: '2025-10-10', division: 'Production', service: 'Fabrication', status: 'pending', hasJustificatif: true },
  ]);

  const [selectedSubmission, setSelectedSubmission] = useState<EVPSubmission | null>(null);
  const [validationDialog, setValidationDialog] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const handleValidation = (submission: EVPSubmission, action: 'approve' | 'reject') => {
    setSelectedSubmission(submission);
    setValidationDialog(action);
    setComment('');
  };

  const confirmValidation = () => {
    if (!selectedSubmission) return;

    const action = validationDialog === 'approve' ? 'validé' : 'rejeté';
    
    setSubmissions(submissions.map(sub => 
      sub.id === selectedSubmission.id 
        ? { ...sub, status: validationDialog === 'approve' ? 'validated' : 'rejected' as const }
        : sub
    ));

    toast.success(`EVP ${action} avec succès`, {
      description: `${selectedSubmission.employee} - ${selectedSubmission.type}`,
    });

    setValidationDialog(null);
    setSelectedSubmission(null);
    setComment('');
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesDivision = filterDivision === 'all' || sub.division === filterDivision;
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    const matchesSearch = sub.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.matricule.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDivision && matchesStatus && matchesSearch;
  });

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const validatedCount = submissions.filter(s => s.status === 'validated').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">En attente</Badge>;
      case 'validated':
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
      currentPage="validation"
      onNavigate={onNavigate}
      onLogout={onLogout}
      notifications={pendingCount}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl text-slate-900 mb-2">Validation des EVP</h1>
          <p className="text-slate-600">
            Approuvez ou rejetez les éléments variables de paie soumis
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">En attente</p>
                <p className="text-2xl text-slate-900">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Validés</p>
                <p className="text-2xl text-emerald-600">{validatedCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Rejetés</p>
                <p className="text-2xl text-red-600">{rejectedCount}</p>
              </div>
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
                    placeholder="Rechercher par nom ou matricule..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterDivision} onValueChange={setFilterDivision}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les divisions</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Qualité">Qualité</SelectItem>
                  <SelectItem value="Logistique">Logistique</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="validated">Validé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submissions table */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Demandes de validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Matricule</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Employé</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Type d'élément</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Montant/Durée</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Division</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Statut</th>
                    <th className="text-left py-3 px-4 text-sm text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                          {submission.matricule}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-slate-900">{submission.employee}</p>
                          {submission.hasJustificatif && (
                            <p className="text-xs text-emerald-600">📎 Justificatif fourni</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">{submission.type}</td>
                      <td className="py-3 px-4 text-sm text-slate-900">{submission.amount}</td>
                      <td className="py-3 px-4 text-sm text-slate-700">{submission.division}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{submission.submittedDate}</td>
                      <td className="py-3 px-4">{getStatusBadge(submission.status)}</td>
                      <td className="py-3 px-4">
                        {submission.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleValidation(submission, 'approve')}
                              className="bg-emerald-600 hover:bg-emerald-700 h-8"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Valider
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleValidation(submission, 'reject')}
                              className="border-red-200 text-red-600 hover:bg-red-50 h-8"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Rejeter
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredSubmissions.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-500">Aucune demande trouvée</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Dialog */}
      <Dialog open={validationDialog !== null} onOpenChange={() => setValidationDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {validationDialog === 'approve' ? 'Valider l\'EVP' : 'Rejeter l\'EVP'}
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission && (
                <>
                  {selectedSubmission.employee} - {selectedSubmission.type} ({selectedSubmission.amount})
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-700 mb-2 block">
                Commentaire {validationDialog === 'reject' ? '(obligatoire)' : '(optionnel)'}
              </label>
              <Textarea
                placeholder="Ajoutez un commentaire..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setValidationDialog(null)}>
              Annuler
            </Button>
            <Button
              onClick={confirmValidation}
              disabled={validationDialog === 'reject' && !comment.trim()}
              className={
                validationDialog === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {validationDialog === 'approve' ? 'Valider' : 'Rejeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
