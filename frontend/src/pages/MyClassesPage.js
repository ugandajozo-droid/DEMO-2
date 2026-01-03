import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { gradesAPI, classesAPI } from '../services/api';
import { 
  GraduationCap, 
  Users, 
  Loader2,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

const MyClassesPage = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getUserGrade = () => {
    if (!user?.grade_id) return null;
    return grades.find(g => g.id === user.grade_id);
  };

  const getUserClass = () => {
    if (!user?.class_id) return null;
    return classes.find(c => c.id === user.class_id);
  };

  const userGrade = getUserGrade();
  const userClass = getUserClass();

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
      <div className="space-y-6" data-testid="my-classes-page">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Moje triedy</h1>
          <p className="text-slate-500">Informácie o vašom zaradení</p>
        </div>

        {/* Current Assignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="dashboard-card">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center mb-3">
                <GraduationCap className="w-6 h-6 text-sky-600" />
              </div>
              <CardTitle className="text-lg text-slate-800">Môj ročník</CardTitle>
            </CardHeader>
            <CardContent>
              {userGrade ? (
                <div>
                  <p className="text-2xl font-bold text-sky-600">{userGrade.name}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {userGrade.order}. rok štúdia
                  </p>
                </div>
              ) : (
                <div className="text-slate-500">
                  <p>Nemáte priradený ročník</p>
                  <p className="text-sm text-slate-400">
                    Kontaktujte administrátora pre priradenie
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg text-slate-800">Moja trieda</CardTitle>
            </CardHeader>
            <CardContent>
              {userClass ? (
                <div>
                  <p className="text-2xl font-bold text-green-600">{userClass.name}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {userGrade?.name || 'Neznámy ročník'}
                  </p>
                </div>
              ) : (
                <div className="text-slate-500">
                  <p>Nemáte priradenú triedu</p>
                  <p className="text-sm text-slate-400">
                    Kontaktujte administrátora pre priradenie
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="bg-pink-50 border-pink-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-pink-800 mb-1">Tip pre štúdium</h3>
                <p className="text-sm text-pink-700">
                  Použite chat s PocketBuddy na pomoc s úlohami a vysvetlenie látky.
                  AI asistent má prístup k materiálom, ktoré nahrali vaši učitelia
                  pre váš ročník a predmety.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Grades Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prehľad ročníkov</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {grades.map((grade) => (
                <div 
                  key={grade.id}
                  className={`
                    p-4 rounded-xl border-2 transition-all
                    ${userGrade?.id === grade.id 
                      ? 'border-pink-500 bg-pink-50' 
                      : 'border-slate-200 bg-white'}
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className={`w-5 h-5 ${userGrade?.id === grade.id ? 'text-pink-600' : 'text-slate-400'}`} />
                    <span className={`font-semibold ${userGrade?.id === grade.id ? 'text-pink-700' : 'text-slate-700'}`}>
                      {grade.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {classes.filter(c => c.grade_id === grade.id).length} tried
                  </p>
                  {userGrade?.id === grade.id && (
                    <Badge className="mt-2 bg-pink-500 text-white">Váš ročník</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MyClassesPage;
