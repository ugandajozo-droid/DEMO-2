import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { teacherAPI, subjectsAPI, gradesAPI } from '../services/api';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Loader2,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';

const MySubjectsPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [adding, setAdding] = useState(false);

  const [formData, setFormData] = useState({
    subject_id: '',
    grade_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, subjectsRes, gradesRes] = await Promise.all([
        teacherAPI.getMySubjects(),
        subjectsAPI.getAll(),
        gradesAPI.getAll()
      ]);
      setAssignments(assignmentsRes.data);
      setSubjects(subjectsRes.data);
      setGrades(gradesRes.data);
    } catch (error) {
      console.error('Chyba pri načítaní dát:', error);
      toast.error('Nepodarilo sa načítať dáta');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.subject_id) {
      toast.error('Vyberte predmet');
      return;
    }

    setAdding(true);
    try {
      await teacherAPI.assignSubject({
        subject_id: formData.subject_id,
        grade_id: formData.grade_id === 'all' ? null : formData.grade_id
      });
      toast.success('Predmet bol priradený');
      setAddDialog(false);
      setFormData({ subject_id: '', grade_id: '' });
      fetchData();
    } catch (error) {
      toast.error('Nepodarilo sa priradiť predmet');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (assignmentId) => {
    if (!window.confirm('Naozaj chcete odstrániť toto priradenie?')) return;
    
    try {
      await teacherAPI.removeSubject(assignmentId);
      setAssignments(assignments.filter(a => a.id !== assignmentId));
      toast.success('Priradenie bolo odstránené');
    } catch (error) {
      toast.error('Nepodarilo sa odstrániť priradenie');
    }
  };

  // Get subjects that are not yet assigned
  const availableSubjects = subjects.filter(subject => 
    !assignments.some(a => a.subject?.id === subject.id)
  );

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
      <div className="space-y-6" data-testid="my-subjects-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Moje predmety</h1>
            <p className="text-slate-400">Predmety, ktoré učíte</p>
          </div>
          <Button 
            onClick={() => setAddDialog(true)}
            className="bg-pink-500 hover:bg-pink-600"
            data-testid="add-subject-btn"
            disabled={availableSubjects.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Pridať predmet
          </Button>
        </div>

        {/* Info about available subjects */}
        {subjects.length > 0 && (
          <Card className="bg-pink-900/30 border-pink-700">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-pink-300 mb-1">Dostupné predmety: {subjects.length}</h3>
                  <p className="text-sm text-pink-400">
                    Môžete si vybrať z {availableSubjects.length} nepriradených predmetov.
                    Po pridaní predmetu môžete nahrávať študijné materiály v sekcii "Zdroje AI".
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assignments Grid */}
        {assignments.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-12">
              <div className="text-center">
                <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">Nemáte priradené žiadne predmety</p>
                <p className="text-sm text-slate-500 mb-4">
                  Pridajte predmety, ktoré učíte
                </p>
                <Button 
                  onClick={() => setAddDialog(true)}
                  className="bg-pink-500 hover:bg-pink-600"
                  disabled={availableSubjects.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Pridať predmet
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment, index) => (
              <Card 
                key={assignment.id}
                className="bg-slate-800 border-slate-700 card-hover animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`assignment-card-${assignment.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-pink-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-100">
                          {assignment.subject?.name}
                        </h3>
                        {assignment.grade && (
                          <Badge variant="outline" className="mt-1 border-slate-600 text-slate-300">
                            <GraduationCap className="w-3 h-3 mr-1" />
                            {assignment.grade.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(assignment.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {assignment.subject?.description && (
                    <p className="text-sm text-slate-400 mt-4">
                      {assignment.subject.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* All Available Subjects Preview */}
        {availableSubjects.length > 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-slate-100">Dostupné predmety na pridanie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {availableSubjects.map((subject) => (
                  <Badge 
                    key={subject.id} 
                    variant="outline" 
                    className="border-slate-600 text-slate-300 cursor-pointer hover:bg-pink-500/20 hover:border-pink-500 transition-colors"
                    onClick={() => {
                      setFormData({ subject_id: subject.id, grade_id: '' });
                      setAddDialog(true);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {subject.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Dialog */}
        <Dialog open={addDialog} onOpenChange={setAddDialog}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Pridať predmet</DialogTitle>
              <DialogDescription className="text-slate-400">
                Vyberte predmet, ktorý učíte
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Predmet</label>
                <Select 
                  value={formData.subject_id} 
                  onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                >
                  <SelectTrigger className="rounded-xl bg-slate-700 border-slate-600 text-slate-100">
                    <SelectValue placeholder="Vyberte predmet" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-[300px]">
                    {availableSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Ročník (voliteľné)</label>
                <Select 
                  value={formData.grade_id} 
                  onValueChange={(value) => setFormData({ ...formData, grade_id: value })}
                >
                  <SelectTrigger className="rounded-xl bg-slate-700 border-slate-600 text-slate-100">
                    <SelectValue placeholder="Všetky ročníky" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">Všetky ročníky</SelectItem>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialog(false)} className="border-slate-600 text-slate-300">
                Zrušiť
              </Button>
              <Button 
                onClick={handleAdd}
                disabled={adding || !formData.subject_id}
                className="bg-pink-500 hover:bg-pink-600"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pridať'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default MySubjectsPage;
