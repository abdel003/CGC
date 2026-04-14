import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  ClipboardCheck,
  Calculator,
  FileText,
  LayoutDashboard,
  Menu,
  X,
  ChevronRight,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  Building2,
  BriefcaseBusiness,
  LogOut,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/trabajadores', label: 'Trabajadores', icon: Users },
  { path: '/proyectos', label: 'Proyectos', icon: BriefcaseBusiness },
  { path: '/asistencia', label: 'Asistencia', icon: ClipboardCheck },
  { path: '/planilla', label: 'Planilla', icon: Calculator },
  { path: '/comprobantes', label: 'Comprobantes', icon: FileText },
];

const secondaryNav = [
  { path: '/configuracion', label: 'Configuración', icon: Settings },
];

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/trabajadores': 'Trabajadores',
  '/proyectos': 'Proyectos',
  '/asistencia': 'Asistencia',
  '/planilla': 'Planilla',
  '/comprobantes': 'Comprobantes',
  '/configuracion': 'Configuración',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const currentTitle = pageTitles[location.pathname] || 'CGC Enterprise';

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col gradient-sidebar shadow-sidebar transition-all duration-300 relative z-20 ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        {/* Logo */}
        <div className={`flex flex-col items-center justify-center border-b border-white/10 ${collapsed ? 'p-2' : 'p-6 pb-8'}`}>
          <div className={`${collapsed ? 'w-12 h-12' : 'w-40 h-28'} flex items-center justify-center overflow-hidden transition-all duration-500 mb-2`}>
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          </div>
          {!collapsed && (
            <div className="text-center">
              <h1 className="text-xl font-black text-white tracking-[0.2em] font-heading leading-none">CGC</h1>
              <p className="text-[9px] uppercase font-black text-blue-400 tracking-[0.4em] mt-2 opacity-80">SOFTWARE</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${collapsed ? 'p-2' : 'p-3'} space-y-1 mt-2`}>
          {!collapsed && (
            <p className="text-[10px] font-semibold text-blue-400/50 uppercase tracking-widest px-3 mb-2">
              Principal
            </p>
          )}
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
                  collapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'
                } ${
                  isActive
                    ? 'bg-blue-600/20 text-white shadow-[0_0_15px_rgba(37,99,235,0.15)] ring-1 ring-white/10'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
                {!collapsed && <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>}
                {!collapsed && isActive && (
                  <motion.div layoutId="sidebar-active" className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-auto" />
                )}
              </Link>
            );
          })}

          {/* Separator */}
          <div className={`border-t border-white/10 my-3 ${collapsed ? 'mx-1' : 'mx-2'}`} />

          {!collapsed && (
            <p className="text-[10px] font-semibold text-blue-400/50 uppercase tracking-widest px-3 mb-2">
              Sistema
            </p>
          )}
          {secondaryNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  collapsed ? 'px-3 py-2.5 justify-center' : 'px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-white/10 text-white nav-active'
                    : 'text-blue-200/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle + Footer */}
        <div className="border-t border-white/10 p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-blue-300/60 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-widest scale-90">Colapsar</span>
              </>
            )}
          </button>
          {!collapsed && (
            <p className="text-[10px] text-blue-400/40 text-center mt-2">
              v2.0 · CGC SOFTWARE
            </p>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] gradient-sidebar z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-5 flex items-center justify-between border-b border-white/10">
                <div className="flex flex-col items-center justify-center w-full gap-4">
                  <div className="w-32 h-32 flex items-center justify-center overflow-hidden">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-center">
                    <h1 className="text-2xl font-black text-white tracking-[0.2em]">CGC</h1>
                    <p className="text-[10px] text-blue-400 font-black tracking-[0.4em] uppercase mt-1">SOFTWARE</p>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="w-10 h-10 flex items-center justify-center text-blue-200/70 hover:text-white transition-colors cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1 mt-2">
                <p className="text-[10px] font-semibold text-blue-400/50 uppercase tracking-widest px-3 mb-2">
                  Principal
                </p>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-white/10 text-white nav-active'
                          : 'text-blue-200/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <div className="border-t border-white/10 my-3 mx-2" />

                <p className="text-[10px] font-semibold text-blue-400/50 uppercase tracking-widest px-3 mb-2">
                  Sistema
                </p>
                {secondaryNav.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-white/10 text-white nav-active'
                          : 'text-blue-200/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-white/10">
                <p className="text-[10px] text-blue-400/40 text-center">v2.0 · CGC SOFTWARE</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Desktop Top Header */}
        <header className="hidden lg:flex items-center justify-between px-6 py-3 bg-white border-b border-border/60 shadow-header sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest">
              <span className="text-muted-foreground/60">CGC Suite</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />
              <span className="text-foreground font-heading text-sm lowercase font-bold tracking-normal first-letter:uppercase">{currentTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => await supabase?.auth.signOut()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 font-medium transition-all cursor-pointer border border-red-100 shadow-sm"
              title="Cerrar Sesión"
            >
              <LogOut className="w-[18px] h-[18px]" />
              <span className="text-sm">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 h-16 border-b border-border/60 bg-white shadow-header sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-foreground tracking-widest leading-none">CGC</span>
                <span className="text-[8px] font-black text-brand-600 uppercase tracking-[0.2em] mt-0.5">SOFTWARE</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => await supabase?.auth.signOut()}
              className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-[22px] h-[22px]" />
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-6 max-w-[1400px] mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
