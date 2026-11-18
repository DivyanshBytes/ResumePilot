import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, Gauge, ListChecks, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuroraBackground from '../components/AuroraBackground';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import Button from '../components/Button';
import ScoreRing from '../components/ScoreRing';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } } };
const reveal = { initial: 'hidden', whileInView: 'show', viewport: { once: true, margin: '-80px' } };

const steps = [
  { n: '01', title: 'Upload your resume once', text: 'We read it and organise it into skills, experience and projects.' },
  { n: '02', title: 'Paste any job posting', text: 'We pull out what the employer requires and score your match honestly.' },
  { n: '03', title: 'Tailor, export, track', text: 'Get a verified rewrite and a cover letter, then follow the application on your board.' },
];

const features = [
  { icon: Gauge, title: 'An honest ATS score', text: 'See how well your resume fits a job, with the matched and missing keywords spelled out.' },
  { icon: ShieldCheck, title: 'Verified AI edits', text: 'Every rewritten line is checked by code. Anything that adds a skill or number you never had is rejected.' },
  { icon: FileText, title: 'Cover letters that stay true', text: 'Letters are built only from your real achievements and the job posting.' },
  { icon: ListChecks, title: 'One board for every application', text: 'Drag applications from wishlist to offer and see which resumes get responses.' },
];

const Chip = ({ children, good }) => (
  <span
    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
      good
        ? 'bg-brand-100 text-brand-800 dark:bg-brand-400/15 dark:text-brand-200'
        : 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300'
    }`}
  >
    {children}
  </span>
);

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
              <Link to="/login" className="hidden text-sm font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white sm:block">Log in</Link>
              <Link to="/register"><Button className="!py-2.5">Get started</Button></Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-12 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.p variants={item} className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
            AI job application copilot
          </motion.p>
          <motion.h1 variants={item} className="mt-4 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Tailor every application.{' '}
            <span className="text-brand-600 dark:text-brand-400">Invent nothing.</span>
          </motion.h1>
          <motion.p variants={item} className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600 dark:text-stone-400">
            Upload your resume once. Paste any job. Get an honest match score, a tailored resume and a cover letter, built only from your real experience.
          </motion.p>
          <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
            <Link to={user ? '/dashboard' : '/register'}>
              <Button>{user ? 'Open dashboard' : 'Start for free'} <ArrowRight className="h-4 w-4" /></Button>
            </Link>
            {!user && <Link to="/login"><Button variant="outline">I have an account</Button></Link>}
          </motion.div>
        </motion.div>

        {/* Product preview */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="surface mx-auto w-full max-w-md p-7 shadow-xl shadow-stone-900/5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-lg font-semibold leading-tight">Frontend Developer</p>
              <p className="text-sm text-stone-500 dark:text-stone-400">Acme Labs</p>
            </div>
            <ScoreRing value={82} size={96} stroke={9} delay={0.8} showLabel={false} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {['React', 'Node.js', 'MongoDB', 'REST APIs'].map((k) => <Chip key={k} good>{k}</Chip>)}
            {['Docker', 'AWS'].map((k) => <Chip key={k}>{k}</Chip>)}
          </div>

          <div className="mt-6 space-y-3 border-t border-stone-200 pt-5 dark:border-white/10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Before</p>
              <p className="mt-1 text-sm text-stone-500 line-through decoration-stone-300 dark:text-stone-400 dark:decoration-stone-600">
                Worked on the website and fixed bugs.
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">After</p>
              <p className="mt-1 text-sm">Built React components and fixed bugs across the customer-facing website.</p>
            </div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-brand-700 dark:text-brand-300">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified: no new skills or numbers added
            </p>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <motion.div variants={container} {...reveal} className="grid gap-10 border-t border-stone-200 pt-14 dark:border-white/10 md:grid-cols-3">
          {steps.map((s) => (
            <motion.div key={s.n} variants={item}>
              <p className="font-display text-4xl font-semibold text-brand-600 dark:text-brand-400">{s.n}</p>
              <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-stone-600 dark:text-stone-400">{s.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <motion.div variants={container} {...reveal} className="grid gap-5 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, text }) => (
            <motion.div key={title} variants={item} whileHover={{ y: -3 }} className="surface flex gap-4 p-6">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-400/15 dark:text-brand-300">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{text}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Closing call to action */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-brand-900 px-8 py-14 text-center text-white dark:bg-brand-950 dark:ring-1 dark:ring-white/10"
        >
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Stop rewriting the same resume.</h2>
          <p className="mx-auto mt-3 max-w-lg text-brand-100">Create a free account and score your first job in about a minute.</p>
          <Link to={user ? '/dashboard' : '/register'} className="mt-7 inline-block">
            <Button variant="light">{user ? 'Open dashboard' : 'Get started'} <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500 dark:border-white/10 dark:text-stone-400">
        ResumePilot. Built with the MERN stack.
      </footer>
    </div>
  );
}