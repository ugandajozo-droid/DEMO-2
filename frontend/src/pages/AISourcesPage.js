import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { aiSourcesAPI, subjectsAPI, gradesAPI } from '../services/api';
import { 
  FolderOpen, 
  Upload, 
  Trash2, 
  Edit,
  Loader2,
  FileText,
  File,
  Image,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';

const AISourcesPage = () => {
  const { user } = useAuth();
  const [sources, setSources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [uploadForm, setUploadForm] = useState({
    file: null,
    description: '',
    subject_id: '',
    grade_id: ''
  });

  const [editForm, setEditForm] = useState({
    description: '',
    subject_id: '',
    grade_id: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sourcesRes, subjectsRes, gradesRes] = await Promise.all([
        aiSourcesAPI.getAll(),
        subjectsAPI.getAll(),
        gradesAPI.getAll()
      ]);
      setSources(sourcesRes.data);
      setSubjects(subjectsRes.data);
      setGrades(gradesRes.data);
    } catch (error) {
      console.error('Chyba pri načítaní dát:', error);
      toast.error('Nepodarilo sa načítať dáta');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file) {
      toast.error('Vyberte súbor na nahratie');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      if (uploadForm.description) formData.append('description', uploadForm.description);
      if (uploadForm.subject_id && uploadForm.subject_id !== 'none') formData.append('subject_id', uploadForm.subject_id);
      if (uploadForm.grade_id && uploadForm.grade_id !== 'none') formData.append('grade_id', uploadForm.grade_id);

      await aiSourcesAPI.upload(formData);
      toast.success('Súbor bol nahraný');
      setUploadDialog(false);
      setUploadForm({ file: null, description: '', subject_id: '', grade_id: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchData();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Nepodarilo sa nahrať súbor');
    } finally {
      setUploading(false);
    }
  };

  const openEditDialog = (source) => {
    setSelectedSource(source);
    setEditForm({
      description: source.description || '',
      subject_id: source.subject_id || 'none',
      grade_id: source.grade_id || 'none',
      is_active: source.is_active
    });
    setEditDialog(true);
  };

  const handleUpdate = async () => {
    try {
      const updateData = {
        description: editForm.description || null,
        subject_id: editForm.subject_id === 'none' ? null : editForm.subject_id,
        grade_id: editForm.grade_id === 'none' ? null : editForm.grade_id,
        is_active: editForm.is_active
      };
      await aiSourcesAPI.update(selectedSource.id, updateData);
      toast.success('Zdroj bol aktualizovaný');
      setEditDialog(false);
      fetchData();
    } catch (error) {
      toast.error('Nepodarilo sa aktualizovať zdroj');
    }
  };

  const handleDelete = async (sourceId) => {
    if (!window.confirm('Naozaj chcete zmazať tento zdroj?')) return;
    
    try {
      await aiSourcesAPI.delete(sourceId);
      setSources(sources.filter(s => s.id !== sourceId));
      toast.success('Zdroj bol zmazaný');
    } catch (error) {
      toast.error('Nepodarilo sa zmazať zdroj');
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-400" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="w-5 h-5 text-green-400" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return <Image className="w-5 h-5 text-purple-400" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
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
      <div className="space-y-6" data-testid="ai-sources-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Zdroje AI</h1>
            <p className="text-slate-400">
              {user?.role === 'admin' 
                ? 'Správa všetkých zdrojov pre PocketBuddy AI'
                : 'Nahrajte študijné materiály pre PocketBuddy AI'}
            </p>
          </div>
          <Button 
            onClick={() => setUploadDialog(true)}
            className="bg-pink-500 hover:bg-pink-600"
            data-testid="upload-source-btn"
          >
            <Upload className="w-4 h-4 mr-2" />
            Nahrať zdroj
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-sky-900/30 border-sky-700">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sky-300 mb-1">Ako fungujú zdroje AI?</h3>
                <p className="text-sm text-sky-400">
                  PocketBuddy využíva nahrané súbory ako kontext pre odpovedanie na otázky študentov.
                  Môžete nahrávať akékoľvek súbory - PDF, Word, Excel, obrázky a ďalšie.
                  Zdroje môžete priradiť ku konkrétnym predmetom a ročníkom.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sources Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-slate-100">Nahrané zdroje ({sources.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sources.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">Žiadne zdroje</p>
                <p className="text-sm text-slate-500">Nahrajte prvý súbor pre PocketBuddy</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/50">
                    <TableHead className="text-slate-300">Súbor</TableHead>
                    <TableHead className="text-slate-300">Popis</TableHead>
                    <TableHead className="text-slate-300">Predmet</TableHead>
                    <TableHead className="text-slate-300">Ročník</TableHead>
                    <TableHead className="text-slate-300">Stav</TableHead>
                    {user?.role === 'admin' && <TableHead className="text-slate-300">Nahral</TableHead>}
                    <TableHead className="text-right text-slate-300">Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((source) => (
                    <TableRow key={source.id} className="border-slate-700 hover:bg-slate-700/50" data-testid={`source-row-${source.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(source.file_name)}
                          <span className="font-medium text-slate-200">{source.file_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400 max-w-xs truncate">
                        {source.description || '-'}
                      </TableCell>
                      <TableCell>
                        {source.subject_name ? (
                          <Badge variant="outline" className="border-slate-600 text-slate-300">{source.subject_name}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {source.grade_name ? (
                          <Badge variant="outline" className="border-slate-600 text-slate-300">{source.grade_name}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {source.is_active ? (
                          <Badge className="bg-green-900/50 text-green-300">Aktívny</Badge>
                        ) : (
                          <Badge className="bg-slate-700 text-slate-400">Neaktívny</Badge>
                        )}
                      </TableCell>
                      {user?.role === 'admin' && (
                        <TableCell className="text-slate-400">
                          {source.uploaded_by_name || '-'}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(source)}
                            className="text-slate-400 hover:text-slate-200"
                            data-testid={`edit-source-${source.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(source.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            data-testid={`delete-source-${source.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Nahrať nový zdroj</DialogTitle>
              <DialogDescription className="text-slate-400">
                Nahrajte súbor, ktorý bude PocketBuddy používať ako zdroj informácií
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div 
                className="file-upload-area"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {uploadForm.file ? (
                  <div className="flex items-center justify-center gap-2 text-slate-200">
                    {getFileIcon(uploadForm.file.name)}
                    <span className="font-medium">{uploadForm.file.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                    <p className="text-slate-300 font-medium">Kliknite pre výber súboru</p>
                    <p className="text-sm text-slate-500">Všetky typy súborov</p>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Popis</label>
                <Textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Stručný popis obsahu súboru..."
                  className="rounded-xl bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Predmet</label>
                  <Select 
                    value={uploadForm.subject_id} 
                    onValueChange={(value) => setUploadForm({ ...uploadForm, subject_id: value })}
                  >
                    <SelectTrigger className="rounded-xl bg-slate-700 border-slate-600 text-slate-100">
                      <SelectValue placeholder="Vyberte predmet" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="none">Žiadny</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Ročník</label>
                  <Select 
                    value={uploadForm.grade_id} 
                    onValueChange={(value) => setUploadForm({ ...uploadForm, grade_id: value })}
                  >
                    <SelectTrigger className="rounded-xl bg-slate-700 border-slate-600 text-slate-100">
                      <SelectValue placeholder="Vyberte ročník" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="none">Žiadny</SelectItem>
                      {grades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialog(false)} className="border-slate-600 text-slate-300">
                Zrušiť
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={uploading || !uploadForm.file}
                className="bg-pink-500 hover:bg-pink-600"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Nahrávam...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Nahrať
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Upraviť zdroj</DialogTitle>
              <DialogDescription className="text-slate-400">
                Upravte informácie o zdroji {selectedSource?.file_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Popis</label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Stručný popis obsahu súboru..."
                  className="rounded-xl bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Predmet</label>
                  <Select 
                    value={editForm.subject_id} 
                    onValueChange={(value) => setEditForm({ ...editForm, subject_id: value })}
                  >
                    <SelectTrigger className="rounded-xl bg-slate-700 border-slate-600 text-slate-100">
                      <SelectValue placeholder="Vyberte predmet" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="none">Žiadny</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Ročník</label>
                  <Select 
                    value={editForm.grade_id} 
                    onValueChange={(value) => setEditForm({ ...editForm, grade_id: value })}
                  >
                    <SelectTrigger className="rounded-xl bg-slate-700 border-slate-600 text-slate-100">
                      <SelectValue placeholder="Vyberte ročník" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="none">Žiadny</SelectItem>
                      {grades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="rounded bg-slate-700 border-slate-600"
                />
                <label htmlFor="is_active" className="text-sm text-slate-300">
                  Aktívny zdroj (používaný AI)
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)} className="border-slate-600 text-slate-300">
                Zrušiť
              </Button>
              <Button onClick={handleUpdate} className="bg-pink-500 hover:bg-pink-600">
                Uložiť
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AISourcesPage;
