import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Columns3, FileText, LayoutDashboard, LogOut, Menu, TrendingUp, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import Button from './Button';
import useShortcuts from '../hooks/useShortcuts';
import RouteProgress from './RouteProgress';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/resumes', label: 'Resumes', icon: FileText },
  { to: '/applications', label: 'Applications', icon: Briefcase },
  { to: '/board', label: 'Board', icon: Columns3 },
  { to: '/insights', label: 'Insights', icon: TrendingUp },
];

const TITLES = {
  '/dashboard': 'Dashboard',
  '/resumes': 'Resumes',
  '/applications': 'Applications',
  '/applications/new': 'Analyse a job',
  '/board': 'Board',
  '/insights': 'Insights',
};

function SidebarContent({ pillId, onNavigate }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col p-5">
      <Link to="/dashboard" onClick={onNavigate}><Logo /></Link>

      <Link to="/applications/new" onClick={onNavigate} className="mt-7 block">
        <Button className="w-full"><Plus className="h-4 w-4" /> Analyse a job</Button>
      </Link>

      <nav className="mt-6 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId={pillId}
                    className="absolute inset-0 rounded-lg bg-brand-100 dark:bg-brand-400/15"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                <Icon className={`relative h-[18px] w-[18px] ${isActive ? 'text-brand-700 dark:text-brand-300' : ''}`} />
                <span className={`relative ${isActive ? 'text-brand-800 dark:text-brand-100' : ''}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-stone-200 pt-4 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white dark:bg-brand-400 dark:text-brand-950">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-stone-500 dark:text-stone-400">{user?.email}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" onClick={logout} className="flex-1 !py-2.5">
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

    useShortcuts();

  // A readable page title for the browser tab and screen readers
  useEffect(() => {
    const name = TITLES[pathname] || (pathname.startsWith('/applications/') ? 'Application' : 'Page not found');
    document.title = `${name} | ResumePilot`;
  }, [pathname]);

  // Close the mobile drawer whenever the page changes
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen lg:pl-64">
        <RouteProgress />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-stone-200 bg-white dark:border-white/10 dark:bg-panel lg:block">
        <SidebarContent pillId="nav-pill-desktop" />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-paper/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-night/90 lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 dark:border-white/10"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-stone-900/50 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-panel lg:hidden"
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent pillId="nav-pill-mobile" onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Page content. Keyed by path so every page fades in */}
            {/* Page content (PrivateRoutes handles the transitions) */}
        <main
        id="main"
        tabIndex={-1}
        className={`mx-auto px-5 py-8 outline-none sm:px-8 sm:py-10 ${pathname === '/board' ? 'max-w-7xl' : 'max-w-5xl'}`}
        >
        {children}
      </main>
    </div>
  );
}
