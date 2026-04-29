import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  FileText, 
  Settings, 
  Search, 
  Plus, 
  LogOut,
  ChevronRight,
  Bell
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { storage } from '../lib/storage';
import { motion, AnimatePresence } from 'motion/react';
import { CommandPalette } from './CommandPalette';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    storage.getSettings().then(setSettings);
  }, []);

  const handleOpenCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Até logo!');
      navigate('/login');
    } catch (error) {
      toast.error('Erro ao sair');
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Clientes', icon: Users, path: '/clientes' },
    { label: 'Relatórios', icon: FileText, path: '/relatorios' },
    { label: 'Configurações', icon: Settings, path: '/configuracoes' },
  ];

  return (
    <div className="flex min-h-screen bg-bg-base text-text-primary overflow-x-hidden">
      <CommandPalette />
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border-subtle bg-bg-elevated/50 backdrop-blur-xl sticky top-0 h-screen">
        <div className="p-8">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-accent-mint flex items-center justify-center text-bg-base font-bold shadow-[0_0_20px_-5px_#00D9A3]">Ω</div>
            <span className="text-xl font-medium tracking-tighter">Ômega</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/clientes' && location.pathname.startsWith('/clientes'));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden",
                  isActive 
                    ? "bg-white/[0.08] text-white" 
                    : "text-text-secondary hover:bg-white/[0.04] hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-accent-mint rounded-r-full"
                  />
                )}
                <item.icon size={18} className={cn(isActive ? "text-accent-mint" : "text-text-muted group-hover:text-text-secondary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:bg-white/5 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white overflow-hidden">
              {user?.photoURL ? <img src={user.photoURL} alt="User" /> : user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left">
              <p className="text-white truncate text-xs">{user?.displayName || settings?.managerName || 'Gestor'}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Gestor Pro</p>
            </div>
            <LogOut size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border-subtle bg-bg-base/80 backdrop-blur-md sticky top-0 z-30 flex items-center px-4 md:px-8 gap-4">
          <div className="flex lg:hidden">
             <Link to="/dashboard" className="text-2xl font-bold mr-4">Ω</Link>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-widest">
            <span>Home</span>
            <ChevronRight size={12} />
            <span className="text-text-secondary">{location.pathname.split('/')[1]?.replace('-', ' ') || 'Dashboard'}</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <button 
              onClick={handleOpenCommandPalette}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-text-secondary hover:text-white transition-all text-sm group"
            >
              <Search size={16} />
              <span className="text-xs opacity-50 font-mono">⌘K</span>
            </button>
            <Link 
              to="/clientes/novo"
              className="px-4 py-2 bg-accent-mint text-black font-semibold rounded-lg text-sm flex items-center gap-2 hover:bg-accent-mint/90 transition-all shadow-lg shadow-accent-mint/10"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Novo Lançamento</span>
            </Link>
            <div className="w-px h-8 bg-border-subtle mx-2" />
            <button className="p-2 text-text-secondary hover:text-white relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent-coral rounded-full ring-2 ring-bg-base" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-8 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
