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
      <header className="border-b border-stone-200/80 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" onClick={logout} className="!py-2.5">
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface flex flex-col items-center gap-8 p-10 text-center sm:flex-row sm:text-left"
        >
          <ScoreRing value={100} size={130} showLabel={false} />
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Hi {user?.name?.split(' ')[0]}, you are in.
            </h1>
            <p className="mt-2 max-w-xl text-stone-600 dark:text-stone-400">
              Your account is verified and your session is secure. Resume upload, job analysis and the application board arrive in the next parts.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}