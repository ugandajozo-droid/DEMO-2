import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { adminAPI, chatAPI } from '../services/api';
import { Users, BookOpen, MessageCircle, FileText, UserCheck, GraduationCap, Loader2, Layers, HelpCircle, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      if (user?.role === 'admin') {
        const response = await adminAPI.getStatistics();
        setStats(response.data);
      }
      
      const chatsResponse = await chatAPI.getChats();
      setChats(chatsResponse.data.slice(0, 5));
    } catch (error) {
      console.error('Chyba pri načítaní dát:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Dobré ráno';
    if (hour < 18) return 'Dobrý deň';
    return 'Dobrý večer';
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'admin': return 'Administrátor';
      case 'teacher': return 'Učiteľ';
      default: return 'Študent';
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
      <div className="space-y-8 page-transition" data-testid="dashboard-page">
        {/* Header */}
        <div className="animate-fadeIn">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight">
            {getGreeting()}, {user?.first_name}!
          </h1>
          <p className="text-slate-400 mt-2">{getRoleLabel()} • PocketBuddy</p>
        </div>

        {/* Admin Stats */}
        {user?.role === 'admin' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="stats-card pink stagger-item hover-glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Celkom používateľov</p>
                  <p className="text-3xl font-bold mt-1">{stats.total_users}</p>
                </div>
                <Users className="w-10 h-10 text-white/30 animate-float" />
              </div>
            </div>

            <div className="stats-card blue stagger-item hover-glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Čakajúce žiadosti</p>
                  <p className="text-3xl font-bold mt-1">{stats.pending_requests}</p>
                </div>
                <UserCheck className="w-10 h-10 text-white/30 animate-float" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>

            <div className="stats-card green stagger-item hover-glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">AI Zdroje</p>
                  <p className="text-3xl font-bold mt-1">{stats.total_sources}</p>
                </div>
                <FileText className="w-10 h-10 text-white/30 animate-float" style={{ animationDelay: '1s' }} />
              </div>
            </div>

            <div className="stats-card purple stagger-item hover-glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Konverzácie</p>
                  <p className="text-3xl font-bold mt-1">{stats.total_chats}</p>
                </div>
                <MessageCircle className="w-10 h-10 text-white/30 animate-float" style={{ animationDelay: '1.5s' }} />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="dashboard-card card-hover stagger-item hover-glow">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-3">
                <MessageCircle className="w-6 h-6 text-pink-400" />
              </div>
              <CardTitle className="text-lg text-slate-100">Chat s PocketBuddy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">
                Opýtaj sa čokoľvek - pomôžem ti s úlohami, vysvetlím látku alebo ti poradím so štúdiom.
              </p>
              <Link 
                to="/chat" 
                className="text-pink-400 font-medium text-sm hover:text-pink-300 transition-colors"
                data-testid="chat-link"
              >
                Začať konverzáciu →
              </Link>
            </CardContent>
          </Card>

          {/* Flashcards Card */}
          <Card className="dashboard-card card-hover animate-fadeIn" style={{ animationDelay: '0.25s' }}>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
                <Layers className="w-6 h-6 text-purple-400" />
              </div>
              <CardTitle className="text-lg text-slate-100">Učebné kartičky</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">
                Vytvor si kartičky na učenie z ľubovoľnej témy a efektívne sa priprav na skúšky.
              </p>
              <Link 
                to="/flashcards" 
                className="text-purple-400 font-medium text-sm hover:text-purple-300 transition-colors"
                data-testid="flashcards-link"
              >
                Vytvoriť kartičky →
              </Link>
            </CardContent>
          </Card>

          {/* Quiz Card */}
          <Card className="dashboard-card card-hover animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-3">
                <HelpCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <CardTitle className="text-lg text-slate-100">Kvíz</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">
                Otestuj svoje vedomosti pomocou AI generovaného kvízu na akúkoľvek tému.
              </p>
              <Link 
                to="/quiz" 
                className="text-yellow-400 font-medium text-sm hover:text-yellow-300 transition-colors"
                data-testid="quiz-link"
              >
                Spustiť kvíz →
              </Link>
            </CardContent>
          </Card>

          {user?.role === 'admin' && (
            <Card className="dashboard-card card-hover animate-fadeIn" style={{ animationDelay: '0.35s' }}>
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center mb-3">
                  <UserCheck className="w-6 h-6 text-sky-400" />
                </div>
                <CardTitle className="text-lg text-slate-100">Schvaľovanie registrácií</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm mb-4">
                  {stats?.pending_requests > 0 
                    ? `Máte ${stats.pending_requests} čakajúcich žiadostí na schválenie.`
                    : 'Žiadne čakajúce žiadosti.'}
                </p>
                <Link 
                  to="/approvals" 
                  className="text-sky-400 font-medium text-sm hover:text-sky-300 transition-colors"
                  data-testid="approvals-link"
                >
                  Zobraziť žiadosti →
                </Link>
              </CardContent>
            </Card>
          )}

          {user?.role === 'teacher' && (
            <Card className="dashboard-card card-hover animate-fadeIn" style={{ animationDelay: '0.4s' }}>
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center mb-3">
                  <FolderOpen className="w-6 h-6 text-sky-400" />
                </div>
                <CardTitle className="text-lg text-slate-100">Zdroje AI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm mb-4">
                  Nahrajte študijné materiály, z ktorých bude PocketBuddy čerpať informácie.
                </p>
                <Link 
                  to="/ai-sources" 
                  className="text-sky-400 font-medium text-sm hover:text-sky-300 transition-colors"
                  data-testid="ai-sources-link"
                >
                  Spravovať zdroje →
                </Link>
              </CardContent>
            </Card>
          )}

          <Card className="dashboard-card card-hover animate-fadeIn" style={{ animationDelay: '0.45s' }}>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-green-400" />
              </div>
              <CardTitle className="text-lg text-slate-100">
                {user?.role === 'student' ? 'Moje triedy' : user?.role === 'teacher' ? 'Moje predmety' : 'Predmety'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">
                {user?.role === 'student' 
                  ? 'Pozrite si svoje predmety a triedy.' 
                  : 'Spravujte predmety a priraďte si ich.'}
              </p>
              <Link 
                to={user?.role === 'student' ? '/my-classes' : user?.role === 'teacher' ? '/my-subjects' : '/subjects'} 
                className="text-green-400 font-medium text-sm hover:text-green-300 transition-colors"
              >
                Zobraziť →
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Chats */}
        {chats.length > 0 && (
          <Card className="dashboard-card animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            <CardHeader>
              <CardTitle className="text-lg text-slate-100">Posledné konverzácie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chats.map((chat) => (
                  <a 
                    key={chat.id}
                    href={`/chat?id=${chat.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-pink-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{chat.title}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(chat.updated_at).toLocaleDateString('sk-SK', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
