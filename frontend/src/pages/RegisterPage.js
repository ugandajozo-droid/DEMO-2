import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BookOpen, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { gradesAPI } from '../services/api';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: 'student',
    grade_id: ''
  });
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    fetchGrades();
  }, [user, navigate]);

  const fetchGrades = async () => {
    try {
      const response = await gradesAPI.getAll();
      setGrades(response.data);
    } catch (error) {
      console.error('Chyba pri načítaní ročníkov:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Heslá sa nezhodujú');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Heslo musí mať aspoň 6 znakov');
      return;
    }

    if (formData.role === 'student' && !formData.grade_id) {
      toast.error('Vyberte prosím ročník');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        grade_id: formData.role === 'student' ? formData.grade_id : null
      });
      setSuccess(true);
      toast.success('Registrácia bola odoslaná');
    } catch (error) {
      const message = error.response?.data?.detail || 'Registrácia zlyhala';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen gradient-soft flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800 shadow-xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Registrácia odoslaná</h2>
            <p className="text-slate-400 mb-6">
              Vaša žiadosť o registráciu bola odoslaná. Počkajte prosím na schválenie administrátorom.
            </p>
            <Link to="/login">
              <Button className="btn-primary" data-testid="back-to-login-btn">
                Späť na prihlásenie
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <p className="text-slate-400">Vytvor si účet a začni sa učiť</p>
        </div>

        <Card className="border-slate-700 bg-slate-800 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-slate-100">Registrácia</CardTitle>
            <CardDescription className="text-slate-400">
              Vyplňte údaje pre vytvorenie účtu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-slate-300">Meno</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    placeholder="Ján"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="rounded-xl border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-500"
                    data-testid="register-firstname-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-slate-300">Priezvisko</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    placeholder="Novák"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="rounded-xl border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-500"
                    data-testid="register-lastname-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="vas@email.sk"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="rounded-xl border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-500"
                  data-testid="register-email-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-300">Typ účtu</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value, grade_id: '' })}
                >
                  <SelectTrigger className="rounded-xl border-slate-600 bg-slate-700 text-slate-100" data-testid="register-role-select">
                    <SelectValue placeholder="Vyberte typ účtu" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="student">Študent</SelectItem>
                    <SelectItem value="teacher">Učiteľ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Grade selection for students */}
              {formData.role === 'student' && (
                <div className="space-y-2">
                  <Label htmlFor="grade" className="text-slate-300">Ročník *</Label>
                  <Select 
                    value={formData.grade_id} 
                    onValueChange={(value) => setFormData({ ...formData, grade_id: value })}
                  >
                    <SelectTrigger className="rounded-xl border-slate-600 bg-slate-700 text-slate-100" data-testid="register-grade-select">
                      <SelectValue placeholder="Vyberte váš ročník" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {grades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Heslo</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="rounded-xl border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-500"
                  data-testid="register-password-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">Potvrdiť heslo</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="rounded-xl border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-500"
                  data-testid="register-confirm-password-input"
                />
              </div>

              <Button
                type="submit"
                className="w-full btn-primary"
                disabled={loading}
                data-testid="register-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrujem...
                  </>
                ) : (
                  'Zaregistrovať sa'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400">
              Už máte účet?{' '}
              <Link to="/login" className="text-pink-400 hover:text-pink-300 font-semibold" data-testid="login-link">
                Prihláste sa
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
