import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowRight, Briefcase, Check, FileText, MessageSquare, Plus, Target, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../lib/api';
import { greeting } from '../lib/format';
import ApplicationCard from '../components/ApplicationCard';
import CountUp from '../components/CountUp';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

function StatCard({ icon: Icon, label, value, suffix }) {
  return (
    <motion.div variants={item} className="surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{label}</p>
        <Icon className="h-[18px] w-[18px] text-brand-600 dark:text-brand-400" />
      </div>
      <p className="mt-3 font-display text-4xl font-semibold tabular-nums">
        <CountUp value={value} suffix={suffix} />
      </p>
    </motion.div>
  );
}

function Onboarding({ hasResume }) {
  const steps = [
    { done: hasResume, title: 'Upload your resume', text: 'We read it and organise it for you.', to: '/resumes', cta: 'Upload resume' },
    { done: false, title: 'Analyse your first job', text: 'Paste a posting to see your match score.', to: '/applications/new', cta: 'Analyse a job' },
  ];
  return (
    <motion.div variants={item} className="surface p-6 sm:p-8">
      <h2 className="font-display text-2xl font-semibold">Get started in two steps</h2>
      <ol className="mt-5 space-y-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex items-center gap-4">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
              s.done ? 'bg-brand-700 text-white dark:bg-brand-400 dark:text-brand-950' : 'border border-stone-300 dark:border-white/20'
            }`}>
              {s.done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <div className="flex-1">
              <p className="font-semibold">{s.title}</p>
              <p className="text-sm text-stone-500 dark:text-stone-400">{s.text}</p>
            </div>
            {!s.done && (i === 0 || hasResume) && (
              <Link to={s.to}><Button variant="outline" className="!py-2">{s.cta}</Button></Link>
            )}
          </li>
        ))}
      </ol>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/applications/stats'), api.get('/applications'), api.get('/resumes')])
      .then(([s, a, r]) =>
        setData({
          stats: s.data.stats,
          recent: [...a.data.applications].sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt)).slice(0, 4),
          resumeCount: r.data.resumes.length,
        })
      )
      .catch((err) => toast.error(getErrorMessage(err)));
  }, []);

  const firstName = user?.name?.split(' ')[0];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">{greeting()}, {firstName}</h1>
          <p className="mt-2 text-stone-500 dark:text-stone-400">Here is where your job search stands.</p>
        </div>
        <Link to="/applications/new"><Button><Plus className="h-4 w-4" /> Analyse a job</Button></Link>
      </div>

      {!data ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="mt-8 space-y-6">
          {data.stats.total === 0 && <Onboarding hasResume={data.resumeCount > 0} />}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Briefcase} label="Applications" value={data.stats.total} />
            <StatCard icon={Target} label="Applied" value={data.stats.applied} />
            <StatCard icon={MessageSquare} label="Interviews" value={data.stats.interviewed} />
            <StatCard icon={Trophy} label="Average ATS score" value={data.stats.avgScore} suffix="/100" />
          </div>

          {data.stats.total > 0 && (
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <motion.div variants={item}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold">Recent applications</h2>
                  <Link to="/applications" className="flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {data.recent.map((a) => <ApplicationCard key={a._id} application={a} />)}
                </div>
              </motion.div>

              <motion.div variants={item} className="surface h-fit p-6">
                <h2 className="font-display text-xl font-semibold">Skills to learn next</h2>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">The keywords most often missing across your jobs.</p>
                {data.stats.topGaps.length === 0 ? (
                  <p className="mt-4 text-sm text-stone-500">No gaps yet. Nice.</p>
                ) : (
                  <ul className="mt-5 space-y-4">
                    {data.stats.topGaps.slice(0, 6).map((g, i) => (
                      <li key={g.keyword}>
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold">{g.keyword}</span>
                          <span className="text-stone-500 dark:text-stone-400">{g.count} {g.count === 1 ? 'job' : 'jobs'}</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-white/10">
                          <motion.div
                            className="h-full rounded-full bg-rose-500/80"
                            initial={{ width: 0 }}
                            animate={{ width: `${(g.count / data.stats.topGaps[0].count) * 100}%` }}
                            transition={{ duration: 0.9, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}