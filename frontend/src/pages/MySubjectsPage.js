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
      await teacherAPI.assignSubject(formData);
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
            <h1 className="text-2xl font-bold text-slate-800">Moje predmety</h1>
            <p className="text-slate-500">Predmety, ktoré učíte</p>
          </div>
          <Button 
            onClick={() => setAddDialog(true)}
            className="bg-pink-500 hover:bg-pink-600"
            data-testid="add-subject-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Pridať predmet
          </Button>
        </div>

        {/* Assignments Grid */}
        {assignments.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Nemáte priradené žiadne predmety</p>
                <p className="text-sm text-slate-400 mb-4">
                  Pridajte predmety, ktoré učíte
                </p>
                <Button 
                  onClick={() => setAddDialog(true)}
                  className="bg-pink-500 hover:bg-pink-600"
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
                className="card-hover animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`assignment-card-${assignment.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-pink-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {assignment.subject?.name}
                        </h3>
                        {assignment.grade && (
                          <Badge variant="outline" className="mt-1">
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
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {assignment.subject?.description && (
                    <p className="text-sm text-slate-500 mt-4">
                      {assignment.subject.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Dialog */}
        <Dialog open={addDialog} onOpenChange={setAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pridať predmet</DialogTitle>
              <DialogDescription>
                Vyberte predmet, ktorý učíte
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Predmet</label>
                <Select 
                  value={formData.subject_id} 
                  onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Vyberte predmet" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Ročník (voliteľné)</label>
                <Select 
                  value={formData.grade_id} 
                  onValueChange={(value) => setFormData({ ...formData, grade_id: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Všetky ročníky" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Všetky ročníky</SelectItem>
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
              <Button variant="outline" onClick={() => setAddDialog(false)}>
                Zrušiť
              </Button>
              <Button 
                onClick={handleAdd}
                disabled={adding}
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
