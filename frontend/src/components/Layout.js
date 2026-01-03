import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Users, 
  MessageCircle, 
  Settings, 
  LogOut, 
  LayoutDashboard,
  FileText,
  GraduationCap,
  UserCheck,
  Menu,
  X,
  FolderOpen,
  Layers,
  HelpCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const baseItems = [
      { path: '/dashboard', label: 'Prehľad', icon: LayoutDashboard },
      { path: '/chat', label: 'Chat s PocketBuddy', icon: MessageCircle },
      { path: '/flashcards', label: 'Učebné kartičky', icon: Layers },
      { path: '/quiz', label: 'Kvíz', icon: HelpCircle },
    ];

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        { path: '/users', label: 'Používatelia', icon: Users },
        { path: '/approvals', label: 'Schvaľovanie', icon: UserCheck },
        { path: '/ai-sources', label: 'Zdroje AI', icon: FolderOpen },
        { path: '/subjects', label: 'Predmety', icon: BookOpen },
        { path: '/grades', label: 'Ročníky a triedy', icon: GraduationCap },
      ];
    }

    if (user?.role === 'teacher') {
      return [
        ...baseItems,
        { path: '/my-subjects', label: 'Moje predmety', icon: BookOpen },
        { path: '/ai-sources', label: 'Zdroje AI', icon: FolderOpen },
      ];
    }

    // Student
    return [
      ...baseItems,
      { path: '/my-classes', label: 'Moje triedy', icon: GraduationCap },
    ];
  };

  const navItems = getNavItems();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen gradient-soft">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-700 z-40 flex items-center justify-between px-4">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-slate-800 rounded-lg"
          data-testid="mobile-menu-btn"
        >
          <Menu className="w-6 h-6 text-slate-300" />
        </button>
        <span className="text-xl font-bold text-gradient">PocketBuddy</span>
        <div className="w-10" />
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-slate-700 z-50
        transform transition-transform duration-300 ease-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-700">
            <Link to="/dashboard" className="flex items-center gap-3" data-testid="logo-link">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">PocketBuddy</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-sky-400 flex items-center justify-center text-white font-semibold">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-slate-100">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-slate-400 capitalize">
                  {user?.role === 'admin' ? 'Administrátor' : 
                   user?.role === 'teacher' ? 'Učiteľ' : 'Študent'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item, index) => (
                <li key={item.path} className="stagger-item" style={{ animationDelay: `${index * 0.05}s` }}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      nav-item-animated flex items-center gap-3 px-4 py-3 rounded-xl
                      ${isActive(item.path) 
                        ? 'active bg-pink-500/20 text-pink-400 font-semibold' 
                        : 'text-slate-400 hover:text-pink-400'}
                    `}
                    data-testid={`nav-${item.path.replace('/', '')}`}
                  >
                    <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive(item.path) ? 'scale-110' : ''}`} />
                    <span className="transition-all duration-300">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-700">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/20"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5" />
              Odhlásiť sa
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-72 min-h-screen pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
