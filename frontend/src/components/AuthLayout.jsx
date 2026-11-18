import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import AuroraBackground from './AuroraBackground';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import ScoreRing from './ScoreRing';

const promises = [
  'Rewrites use only facts from your own resume',
  'Every AI edit is checked by code before you see it',
  'Your files stay private to your account',
];

function Panel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-900 p-12 text-white dark:bg-brand-950 lg:flex">
      <Logo tone="light" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mx-auto w-full max-w-sm rounded-2xl bg-white p-7 text-center text-stone-900 shadow-2xl shadow-black/30 dark:bg-panel dark:text-stone-100"
      >
        <ScoreRing value={82} size={150} />
        <p className="mt-4 font-display text-lg font-semibold">Strong match</p>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">12 of 15 job keywords found in your resume</p>
        <p className="mt-3 text-[11px] uppercase tracking-wider text-stone-400">Sample preview</p>
      </motion.div>

      <div>
        <h2 className="font-display text-3xl font-semibold leading-tight">Apply with proof, not guesses.</h2>
        <ul className="mt-5 space-y-3 text-sm text-brand-100">
          {promises.map((p) => (
            <li key={p} className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <div className="relative flex min-h-screen flex-col px-6 py-6 sm:px-10">
        <AuroraBackground />
        <header className="flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <ThemeToggle />
        </header>
        <div className="flex flex-1 items-center justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-stone-500 dark:text-stone-400">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">{footer}</p>}
          </motion.div>
        </div>
      </div>
      <Panel />
    </div>
  );
}