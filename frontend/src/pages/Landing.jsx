import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, Gauge, ListChecks, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuroraBackground from '../components/AuroraBackground';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import Button from '../components/Button';
import ScoreRing from '../components/ScoreRing';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } } };

const features = [
  { icon: Gauge, title: 'ATS match score', text: 'See how well your resume fits a job, with the matched and missing keywords spelled out.' },
  { icon: Sparkles, title: 'Truthful AI tailoring', text: 'Rewrites your bullets for the role and rejects anything not backed by your real experience.' },
  { icon: FileText, title: 'Cover letters', text: 'A personalised letter built only from your actual achievements.' },
  { icon: ListChecks, title: 'Application tracker', text: 'A drag-and-drop board that keeps every application and its status in one place.' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuroraBackground />

      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link to="/dashboard"><Button className="!py-2.5">Dashboard</Button></Link>
          ) : (
            <>
              <Link to="/login" className="hidden text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white sm:block">Log in</Link>
              <Link to="/register"><Button className="!py-2.5">Get started</Button></Link>
            </>
          )}
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-10 lg:grid-cols-2 lg:pt-20">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.span variants={item} className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" /> AI job application copilot
          </motion.span>
          <motion.h1 variants={item} className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Tailor your resume. <span className="text-gradient">Beat the ATS.</span> Track every application.
          </motion.h1>
          <motion.p variants={item} className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-400">
            Upload your resume once. Paste any job. Get an honest match score, a tailored resume and a cover letter, all built from your real experience.
          </motion.p>
          <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
            <Link to={user ? '/dashboard' : '/register'}>
              <Button>{user ? 'Open dashboard' : 'Start for free'} <ArrowRight className="h-4 w-4" /></Button>
            </Link>
            {!user && <Link to="/login"><Button variant="outline">I have an account</Button></Link>}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-8 text-center shadow-2xl shadow-indigo-500/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <ScoreRing value={82} size={180} delay={0.8} />
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['React', 'Node.js', 'MongoDB', 'REST APIs'].map((k) => (
                <span key={k} className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{k}</span>
              ))}
              {['Docker', 'AWS'].map((k) => (
                <span key={k} className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400">{k}</span>
              ))}
            </div>
            <p className="mt-4 text-[11px] uppercase tracking-wider text-slate-400">Sample preview</p>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map(({ icon: Icon, title, text }) => (
            <motion.div
              key={title}
              variants={item}
              whileHover={{ y: -6 }}
              className="rounded-2xl border border-slate-200/70 bg-white/60 p-6 backdrop-blur-xl transition-shadow hover:shadow-xl hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-white/5"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{text}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}