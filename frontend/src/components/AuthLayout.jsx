import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuroraBackground from './AuroraBackground';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import ScoreRing from './ScoreRing';

const float = (delay) => ({
  animate: { y: [0, -8, 0] },
  transition: { repeat: Infinity, duration: 5, ease: 'easeInOut', delay },
});

function Showcase() {
  return (
    <div className="hidden items-center justify-center p-10 lg:flex">
      <div className="relative w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-3xl border border-slate-200/70 bg-white/60 p-8 text-center shadow-2xl shadow-indigo-500/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
        >
          <ScoreRing value={82} size={170} />
          <h2 className="mt-5 text-xl font-extrabold tracking-tight">Know your match before you apply</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Score your resume against any job, then tailor it using only your real experience.
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-wider text-slate-400">Sample preview</p>
        </motion.div>

        <motion.div {...float(0)} className="absolute -left-8 top-10 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 backdrop-blur dark:text-emerald-400">
          React matched
        </motion.div>
        <motion.div {...float(1.2)} className="absolute -right-6 top-1/3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 backdrop-blur dark:text-rose-400">
          Docker missing
        </motion.div>
        <motion.div {...float(2.2)} className="absolute -bottom-4 left-12 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-600 backdrop-blur dark:text-indigo-300">
          Cover letter ready
        </motion.div>
      </div>
    </div>
  );
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuroraBackground />
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <div className="flex flex-col px-6 py-6 sm:px-10">
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
              <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
              <p className="mt-2 text-slate-500 dark:text-slate-400">{subtitle}</p>
              <div className="mt-8">{children}</div>
              {footer && <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</p>}
            </motion.div>
          </div>
        </div>
        <Showcase />
      </div>
    </div>
  );
}