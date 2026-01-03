import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { subjectsAPI } from '../services/api';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await subjectsAPI.getAll();
      setSubjects(response.data);
    } catch (error) {
      console.error('Chyba pri načítaní predmetov:', error);
      toast.error('Nepodarilo sa načítať predmety');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Zadajte názov predmetu');
      return;
    }

    setCreating(true);
    try {
      const response = await subjectsAPI.create(formData);
      setSubjects([...subjects, response.data]);
      setCreateDialog(false);
      setFormData({ name: '', description: '' });
      toast.success('Predmet bol vytvorený');
    } catch (error) {
      toast.error('Nepodarilo sa vytvoriť predmet');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (subjectId) => {
    if (!window.confirm('Naozaj chcete zmazať tento predmet?')) return;
    
    try {
      await subjectsAPI.delete(subjectId);
      setSubjects(subjects.filter(s => s.id !== subjectId));
      toast.success('Predmet bol zmazaný');
    } catch (error) {
      toast.error('Nepodarilo sa zmazať predmet');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="subjects-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Predmety</h1>
            <p className="text-slate-500">Správa vyučovacích predmetov</p>
          </div>
          <Button 
            onClick={() => setCreateDialog(true)}
            className="bg-pink-500 hover:bg-pink-600"
            data-testid="add-subject-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Pridať predmet
          </Button>
        </div>

        {/* Subjects Table */}
        <Card>
          <CardContent className="p-0">
            {subjects.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Žiadne predmety</p>
                <p className="text-sm text-slate-400">Vytvorte prvý predmet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Názov</TableHead>
                    <TableHead>Popis</TableHead>
                    <TableHead>Vytvorené</TableHead>
                    <TableHead className="text-right">Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow key={subject.id} data-testid={`subject-row-${subject.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-pink-600" />
                          </div>
                          {subject.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 max-w-md">
                        {subject.description || '-'}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {new Date(subject.created_at).toLocaleDateString('sk-SK')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(subject.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          data-testid={`delete-subject-${subject.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nový predmet</DialogTitle>
              <DialogDescription>
                Vytvorte nový vyučovací predmet
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Názov predmetu</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="napr. Matematika"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Popis</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Stručný popis predmetu..."
                  className="rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialog(false)}>
                Zrušiť
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={creating}
                className="bg-pink-500 hover:bg-pink-600"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Vytvoriť'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default SubjectsPage;
