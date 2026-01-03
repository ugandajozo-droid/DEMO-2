import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Vitajte späť!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Prihlásenie zlyhalo';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gradient">PocketBuddy</span>
          </Link>
          <p className="text-slate-400">Tvoj osobný AI asistent pre štúdium</p>
        </div>

        <Card className="border-slate-700 bg-slate-800 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-slate-100">Prihlásenie</CardTitle>
            <CardDescription className="text-slate-400">
              Zadajte svoje prihlasovacie údaje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vas@email.sk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-pink-500 focus:ring-pink-500/20"
                  data-testid="login-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Heslo</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-xl border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-pink-500 focus:ring-pink-500/20"
                  data-testid="login-password-input"
                />
              </div>
              <Button
                type="submit"
                className="w-full btn-primary"
                disabled={loading}
                data-testid="login-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Prihlasujem...
                  </>
                ) : (
                  'Prihlásiť sa'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400">
              Nemáte účet?{' '}
              <Link to="/register" className="text-pink-400 hover:text-pink-300 font-semibold" data-testid="register-link">
                Zaregistrujte sa
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo credentials hint */}
        <div className="mt-6 p-4 bg-slate-800/80 rounded-xl border border-slate-700 text-center text-sm text-slate-400">
          <p className="font-medium mb-1 text-slate-300">Demo prístup:</p>
          <p>Email: <code className="text-pink-400">admin@pocketbuddy.sk</code></p>
          <p>Heslo: <code className="text-pink-400">admin123</code></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
