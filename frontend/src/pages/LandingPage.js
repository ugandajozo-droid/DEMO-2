import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { seedAPI } from '../services/api';
import { BookOpen, MessageCircle, Users, FileText, GraduationCap, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const response = await seedAPI.seed();
      toast.success('Demo dáta boli vytvorené');
      toast.info(`Admin: ${response.data.admin_email} / ${response.data.admin_password}`);
    } catch (error) {
      if (error.response?.data?.message === 'Dáta už existujú') {
        toast.info('Demo dáta už existujú');
      } else {
        toast.error('Chyba pri vytváraní demo dát');
      }
    } finally {
      setSeeding(false);
    }
  };

  const features = [
    {
      icon: MessageCircle,
      title: 'AI Chat asistent',
      description: 'Inteligentný pomocník, ktorý ti pomôže s úlohami a vysvetlí látku'
    },
    {
      icon: FileText,
      title: 'Učebné materiály',
      description: 'Učitelia nahrávajú zdroje, z ktorých AI čerpá informácie'
    },
    {
      icon: Users,
      title: 'Roly a prístupy',
      description: 'Študenti, učitelia a admini majú vlastné rozhranie'
    },
    {
      icon: GraduationCap,
      title: 'Ročníky a triedy',
      description: 'Organizácia podľa ročníkov s priradenými materiálmi'
    }
  ];

  return (
    <div className="min-h-screen gradient-soft">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">PocketBuddy</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-pink-600" data-testid="login-nav-btn">
                Prihlásenie
              </Button>
            </Link>
            <Link to="/register">
              <Button className="btn-primary" data-testid="register-nav-btn">
                Registrácia
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 text-pink-700 text-sm font-medium mb-6 animate-fadeIn">
              <Sparkles className="w-4 h-4" />
              AI asistent pre slovenské stredné školy
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-slate-800 tracking-tight leading-tight mb-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              Tvoj osobný pomocník<br />
              <span className="text-gradient">pre štúdium</span>
            </h1>
            
            <p className="text-lg text-slate-600 mb-8 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              PocketBuddy ti pomôže pochopiť látku, vysvetlí ťažké úlohy 
              a pripraví ťa na skúšky. Všetko v slovenčine!
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
              <Link to="/register">
                <Button className="btn-primary text-lg px-8 py-6" data-testid="hero-register-btn">
                  Začať používať
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={handleSeed}
                disabled={seeding}
                className="text-lg px-8 py-6"
                data-testid="seed-btn"
              >
                {seeding ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : null}
                Vytvoriť demo dáta
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mt-16 max-w-5xl mx-auto animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/50">
              <img 
                src="https://images.unsplash.com/photo-1767102060241-130cb9260718?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMHN0dWR5aW5nJTIwbGFwdG9wJTIwbGlicmFyeXxlbnwwfHx8fDE3Njc0NDI3NjF8MA&ixlib=rb-4.1.0&q=85"
                alt="Študenti používajúci PocketBuddy"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Všetko čo potrebuješ
            </h2>
            <p className="text-lg text-slate-600">
              Komplexný nástroj pre moderné vzdelávanie
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="dashboard-card card-hover p-6 animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="gradient-brand rounded-3xl p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pripravený začať?
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Zaregistruj sa a objav silu AI asistenta pre štúdium
            </p>
            <Link to="/register">
              <Button className="bg-white text-pink-600 hover:bg-white/90 text-lg px-8 py-6 font-semibold">
                Vytvoriť účet zadarmo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-800">PocketBuddy</span>
          </div>
          <p className="text-sm text-slate-500">
            © 2024 PocketBuddy. AI asistent pre slovenské stredné školy.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
