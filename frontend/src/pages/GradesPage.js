import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { gradesAPI, classesAPI } from '../services/api';
import { 
  GraduationCap, 
  Plus, 
  Trash2, 
  Loader2,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

const GradesPage = () => {
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradeDialog, setGradeDialog] = useState(false);
  const [classDialog, setClassDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  const [gradeForm, setGradeForm] = useState({ name: '', order: 1 });
  const [classForm, setClassForm] = useState({ name: '', grade_id: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gradesRes, classesRes] = await Promise.all([
        gradesAPI.getAll(),
        classesAPI.getAll()
      ]);
      setGrades(gradesRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      console.error('Chyba pri načítaní dát:', error);
      toast.error('Nepodarilo sa načítať dáta');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGrade = async () => {
    if (!gradeForm.name.trim()) {
      toast.error('Zadajte názov ročníka');
      return;
    }

    setCreating(true);
    try {
      const response = await gradesAPI.create(gradeForm);
      setGrades([...grades, response.data].sort((a, b) => a.order - b.order));
      setGradeDialog(false);
      setGradeForm({ name: '', order: grades.length + 1 });
      toast.success('Ročník bol vytvorený');
    } catch (error) {
      toast.error('Nepodarilo sa vytvoriť ročník');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateClass = async () => {
    if (!classForm.name.trim() || !classForm.grade_id) {
      toast.error('Vyplňte všetky polia');
      return;
    }

    setCreating(true);
    try {
      const response = await classesAPI.create(classForm);
      setClasses([...classes, response.data]);
      setClassDialog(false);
      setClassForm({ name: '', grade_id: '' });
      toast.success('Trieda bola vytvorená');
    } catch (error) {
      toast.error('Nepodarilo sa vytvoriť triedu');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm('Naozaj chcete zmazať tento ročník?')) return;
    
    try {
      await gradesAPI.delete(gradeId);
      setGrades(grades.filter(g => g.id !== gradeId));
      toast.success('Ročník bol zmazaný');
    } catch (error) {
      toast.error('Nepodarilo sa zmazať ročník');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Naozaj chcete zmazať túto triedu?')) return;
    
    try {
      await classesAPI.delete(classId);
      setClasses(classes.filter(c => c.id !== classId));
      toast.success('Trieda bola zmazaná');
    } catch (error) {
      toast.error('Nepodarilo sa zmazať triedu');
    }
  };

  const getGradeName = (gradeId) => {
    const grade = grades.find(g => g.id === gradeId);
    return grade?.name || '-';
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
      <div className="space-y-6" data-testid="grades-page">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ročníky a triedy</h1>
          <p className="text-slate-500">Správa ročníkov a tried školy</p>
        </div>

        <Tabs defaultValue="grades" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="grades" data-testid="grades-tab">Ročníky</TabsTrigger>
            <TabsTrigger value="classes" data-testid="classes-tab">Triedy</TabsTrigger>
          </TabsList>

          {/* Grades Tab */}
          <TabsContent value="grades" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Ročníky ({grades.length})</CardTitle>
                <Button 
                  onClick={() => {
                    setGradeForm({ name: '', order: grades.length + 1 });
                    setGradeDialog(true);
                  }}
                  className="bg-pink-500 hover:bg-pink-600"
                  data-testid="add-grade-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Pridať ročník
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {grades.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">Žiadne ročníky</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Poradie</TableHead>
                        <TableHead>Názov</TableHead>
                        <TableHead>Počet tried</TableHead>
                        <TableHead className="text-right">Akcie</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.map((grade) => (
                        <TableRow key={grade.id} data-testid={`grade-row-${grade.id}`}>
                          <TableCell>{grade.order}.</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                                <GraduationCap className="w-4 h-4 text-sky-600" />
                              </div>
                              {grade.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {classes.filter(c => c.grade_id === grade.id).length} tried
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGrade(grade.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Triedy ({classes.length})</CardTitle>
                <Button 
                  onClick={() => setClassDialog(true)}
                  className="bg-pink-500 hover:bg-pink-600"
                  disabled={grades.length === 0}
                  data-testid="add-class-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Pridať triedu
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {classes.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">Žiadne triedy</p>
                    <p className="text-sm text-slate-400">
                      {grades.length === 0 ? 'Najprv vytvorte ročník' : 'Vytvorte prvú triedu'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Názov</TableHead>
                        <TableHead>Ročník</TableHead>
                        <TableHead className="text-right">Akcie</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classes.map((cls) => (
                        <TableRow key={cls.id} data-testid={`class-row-${cls.id}`}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                <Users className="w-4 h-4 text-green-600" />
                              </div>
                              {cls.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getGradeName(cls.grade_id)}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClass(cls.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
          </TabsContent>
        </Tabs>

        {/* Grade Dialog */}
        <Dialog open={gradeDialog} onOpenChange={setGradeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nový ročník</DialogTitle>
              <DialogDescription>Vytvorte nový školský ročník</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Názov ročníka</label>
                <Input
                  value={gradeForm.name}
                  onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })}
                  placeholder="napr. 1. ročník"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Poradie</label>
                <Input
                  type="number"
                  value={gradeForm.order}
                  onChange={(e) => setGradeForm({ ...gradeForm, order: parseInt(e.target.value) || 1 })}
                  min="1"
                  className="rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGradeDialog(false)}>Zrušiť</Button>
              <Button onClick={handleCreateGrade} disabled={creating} className="bg-pink-500 hover:bg-pink-600">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vytvoriť'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Class Dialog */}
        <Dialog open={classDialog} onOpenChange={setClassDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nová trieda</DialogTitle>
              <DialogDescription>Vytvorte novú školskú triedu</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Názov triedy</label>
                <Input
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="napr. 1.A"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Ročník</label>
                <Select 
                  value={classForm.grade_id} 
                  onValueChange={(value) => setClassForm({ ...classForm, grade_id: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Vyberte ročník" />
                  </SelectTrigger>
                  <SelectContent>
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
              <Button variant="outline" onClick={() => setClassDialog(false)}>Zrušiť</Button>
              <Button onClick={handleCreateClass} disabled={creating} className="bg-pink-500 hover:bg-pink-600">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vytvoriť'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default GradesPage;
