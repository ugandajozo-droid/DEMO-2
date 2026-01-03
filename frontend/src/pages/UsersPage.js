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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { adminAPI, gradesAPI, classesAPI } from '../services/api';
import { 
  Users, 
  MoreVertical, 
  Search, 
  Loader2,
  UserCheck,
  UserX,
  Trash2,
  ArrowUpCircle,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editDialog, setEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    grade_id: '',
    class_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, gradesRes, classesRes] = await Promise.all([
        adminAPI.getUsers(),
        gradesAPI.getAll(),
        classesAPI.getAll()
      ]);
      setUsers(usersRes.data);
      setGrades(gradesRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      console.error('Chyba pri načítaní dát:', error);
      toast.error('Nepodarilo sa načítať dáta');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (userId) => {
    try {
      await adminAPI.activateUser(userId);
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: true } : u));
      toast.success('Účet bol aktivovaný');
    } catch (error) {
      toast.error('Nepodarilo sa aktivovať účet');
    }
  };

  const handleDeactivate = async (userId) => {
    try {
      await adminAPI.deactivateUser(userId);
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: false } : u));
      toast.success('Účet bol deaktivovaný');
    } catch (error) {
      toast.error('Nepodarilo sa deaktivovať účet');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Naozaj chcete zmazať tohto používateľa?')) return;
    
    try {
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      toast.success('Používateľ bol zmazaný');
    } catch (error) {
      toast.error('Nepodarilo sa zmazať používateľa');
    }
  };

  const handlePromoteGrade = async (userId) => {
    try {
      const response = await adminAPI.promoteStudentGrade(userId);
      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Nepodarilo sa preradiť študenta');
    }
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name,
      grade_id: user.grade_id || '',
      class_id: user.class_id || ''
    });
    setEditDialog(true);
  };

  const handleUpdateUser = async () => {
    try {
      await adminAPI.updateUser(selectedUser.id, editForm);
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...editForm } : u));
      setEditDialog(false);
      toast.success('Používateľ bol aktualizovaný');
    } catch (error) {
      toast.error('Nepodarilo sa aktualizovať používateľa');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge className="badge-admin">Administrátor</Badge>;
      case 'teacher':
        return <Badge className="badge-teacher">Učiteľ</Badge>;
      default:
        return <Badge className="badge-student">Študent</Badge>;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getGradeName = (gradeId) => {
    const grade = grades.find(g => g.id === gradeId);
    return grade?.name || '-';
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || '-';
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
      <div className="space-y-6" data-testid="users-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Používatelia</h1>
            <p className="text-slate-500">Správa všetkých používateľov systému</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Hľadať používateľa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl"
                  data-testid="search-users-input"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48 rounded-xl" data-testid="role-filter-select">
                  <SelectValue placeholder="Filtrovať podľa roly" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všetky roly</SelectItem>
                  <SelectItem value="admin">Administrátori</SelectItem>
                  <SelectItem value="teacher">Učitelia</SelectItem>
                  <SelectItem value="student">Študenti</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meno</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rola</TableHead>
                  <TableHead>Ročník</TableHead>
                  <TableHead>Trieda</TableHead>
                  <TableHead>Stav</TableHead>
                  <TableHead className="text-right">Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getGradeName(user.grade_id)}</TableCell>
                    <TableCell>{getClassName(user.class_id)}</TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Aktívny</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-800">Neaktívny</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`user-actions-${user.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Upraviť
                          </DropdownMenuItem>
                          {user.is_active ? (
                            <DropdownMenuItem onClick={() => handleDeactivate(user.id)}>
                              <UserX className="w-4 h-4 mr-2" />
                              Deaktivovať
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleActivate(user.id)}>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Aktivovať
                            </DropdownMenuItem>
                          )}
                          {user.role === 'student' && (
                            <DropdownMenuItem onClick={() => handlePromoteGrade(user.id)}>
                              <ArrowUpCircle className="w-4 h-4 mr-2" />
                              Preradiť do vyššieho ročníka
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Zmazať
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Žiadni používatelia</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upraviť používateľa</DialogTitle>
              <DialogDescription>
                Upravte údaje používateľa {selectedUser?.first_name} {selectedUser?.last_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Meno</label>
                  <Input
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Priezvisko</label>
                  <Input
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>
              
              {selectedUser?.role === 'student' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Ročník</label>
                    <Select 
                      value={editForm.grade_id} 
                      onValueChange={(value) => setEditForm({ ...editForm, grade_id: value })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Vyberte ročník" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Žiadny</SelectItem>
                        {grades.map((grade) => (
                          <SelectItem key={grade.id} value={grade.id}>
                            {grade.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Trieda</label>
                    <Select 
                      value={editForm.class_id} 
                      onValueChange={(value) => setEditForm({ ...editForm, class_id: value })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Vyberte triedu" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Žiadna</SelectItem>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)}>
                Zrušiť
              </Button>
              <Button onClick={handleUpdateUser} className="bg-pink-500 hover:bg-pink-600">
                Uložiť
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default UsersPage;
