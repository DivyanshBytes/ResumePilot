import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuroraBackground from '../components/AuroraBackground';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import Button from '../components/Button';
import ScoreRing from '../components/ScoreRing';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="relative min-h-screen">
      <AuroraBackground />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="outline" onClick={logout} className="!py-2.5">
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-8 rounded-3xl border border-slate-200/70 bg-white/60 p-10 text-center shadow-xl shadow-indigo-500/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:flex-row sm:text-left"
        >
          <ScoreRing value={100} size={140} showLabel={false} />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Hi {user?.name?.split(' ')[0]}, you are in.
            </h1>
            <p className="mt-2 max-w-xl text-slate-500 dark:text-slate-400">
              Your account is verified and your session is secure. Resume upload, job analysis and the application board arrive in the next parts.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}