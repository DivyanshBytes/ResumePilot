import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { TrendingUp } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import { STATUS } from '../lib/status';
import CountUp from '../components/CountUp';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';

const STAGE_BAR = {
  wishlist: 'bg-stone-400',
  applied: 'bg-brand-500',
  interview: 'bg-amber-500',
  offer: 'bg-emerald-500',
  rejected: 'bg-rose-500',
};

const Card = ({ title, subtitle, children, className = '' }) => (
  <div className={`surface p-6 ${className}`}>
    <h2 className="font-display text-xl font-semibold">{title}</h2>
    {subtitle && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{subtitle}</p>}
    <div className="mt-5">{children}</div>
  </div>
);

function BarRow({ label, value, max, delay = 0, color = 'bg-brand-600 dark:bg-brand-400', suffix = '' }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums text-stone-500 dark:text-stone-400">{value}{suffix}</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-stone-200 dark:bg-white/10">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${max ? (value / max) * 100 : 0}%` }}
          transition={{ duration: 0.9, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function BigStat({ label, value, suffix = '', note }) {
  return (
    <div className="surface p-5">
      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{label}</p>
      <p className="mt-2 font-display text-5xl font-semibold tabular-nums"><CountUp value={value} suffix={suffix} /></p>
      {note && <p className="mt-1 text-xs text-stone-400">{note}</p>}
    </div>
  );
}

const weekLabel = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export default function Insights() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/applications/stats')
      .then(({ data }) => setStats(data.stats))
      .catch((err) => { toast.error(getErrorMessage(err)); setStats(false); });
  }, []);

  if (stats === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Insights</h1>
        <div className="mt-8">
          <EmptyState
            icon={TrendingUp}
            title="Nothing to analyse yet"
            text="Once you have a few applications, this page shows what is working in your job search."
            action={<Link to="/applications/new"><Button>Analyse a job</Button></Link>}
          />
        </div>
      </div>
    );
  }

  const weeklyMax = Math.max(1, ...stats.weekly.map((w) => w.count));
  const statusTotal = Object.values(stats.byStatus).reduce((a, b) => a + b, 0) || 1;
  const funnelMax = stats.total;
  const thin = stats.applied < 5;

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold tracking-tight">Insights</h1>
      <p className="mt-2 text-stone-500 dark:text-stone-400">What your applications say about your search so far.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <BigStat label="Interview rate" value={stats.interviewRate} suffix="%" note={`${stats.interviewed} of ${stats.applied} applied`} />
        <BigStat label="Offer rate" value={stats.offerRate} suffix="%" note={`${stats.offers} of ${stats.applied} applied`} />
        <BigStat label="Average ATS score" value={stats.avgScore} suffix="/100" note={`across ${stats.total} jobs`} />
      </div>

      {thin && (
        <p className="mt-4 rounded-lg bg-amber-100 p-4 text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
          You have applied to {stats.applied} {stats.applied === 1 ? 'job' : 'jobs'} so far. Rates from so few applications are rough, so treat them as a starting point.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Your funnel" subtitle="How far your applications get.">
          <div className="space-y-4">
            <BarRow label="Analysed" value={stats.total} max={funnelMax} delay={0.1} color="bg-stone-400" />
            <BarRow label="Applied" value={stats.applied} max={funnelMax} delay={0.2} />
            <BarRow label="Reached interview" value={stats.interviewed} max={funnelMax} delay={0.3} color="bg-amber-500" />
            <BarRow label="Offers" value={stats.offers} max={funnelMax} delay={0.4} color="bg-emerald-500" />
          </div>
        </Card>

        <Card title="Where everything is now" subtitle="Current stage of every application.">
          <div className="flex h-4 overflow-hidden rounded-full bg-stone-200 dark:bg-white/10">
            {Object.entries(stats.byStatus).filter(([, n]) => n > 0).map(([s, n], i) => (
              <motion.div
                key={s}
                className={STAGE_BAR[s]}
                initial={{ width: 0 }}
                animate={{ width: `${(n / statusTotal) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease: 'easeOut' }}
                title={`${STATUS[s].label}: ${n}`}
              />
            ))}
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {Object.entries(stats.byStatus).map(([s, n]) => (
              <li key={s} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${STAGE_BAR[s]}`} />
                  {STATUS[s].label}
                </span>
                <span className="font-semibold tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Do higher scores get interviews?" subtitle="Average ATS score of the jobs you applied to, compared with those that reached an interview.">
          {stats.interviewed === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              No interviews recorded yet. Move an application to Interview on the board and this comparison appears.
            </p>
          ) : (
            <div className="space-y-4">
              <BarRow label="All applications you sent" value={stats.avgScoreApplied} max={100} suffix="/100" />
              <BarRow label="Those that reached an interview" value={stats.avgScoreInterviewed} max={100} suffix="/100" delay={0.15} color="bg-amber-500" />
              <p className="text-xs text-stone-400">
                A hint, not proof. Many things decide interviews besides the score, especially with a small number of applications.
              </p>
            </div>
          )}
        </Card>

        <Card title="Skills to learn next" subtitle="Keywords most often missing across your jobs.">
          {stats.topGaps.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">No gaps found. Nice.</p>
          ) : (
            <div className="space-y-4">
              {stats.topGaps.slice(0, 6).map((g, i) => (
                <BarRow
                  key={g.keyword}
                  label={g.keyword}
                  value={g.count}
                  max={stats.topGaps[0].count}
                  delay={0.1 + i * 0.07}
                  color="bg-rose-500/80"
                  suffix={g.count === 1 ? ' job' : ' jobs'}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Applications added per week" subtitle="The last 8 weeks." className="mt-6">
        <div className="flex h-44 items-end gap-2 sm:gap-3">
          {stats.weekly.map((w, i) => (
            <div key={w.weekStart} className="flex h-full flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-xs font-semibold tabular-nums text-stone-500 dark:text-stone-400">{w.count || ''}</span>
              <motion.div
                className={`w-full rounded-t-md ${w.count ? 'bg-brand-600 dark:bg-brand-400' : 'bg-stone-200 dark:bg-white/10'}`}
                initial={{ height: 0 }}
                animate={{ height: w.count ? `${(w.count / weeklyMax) * 100}%` : '4px' }}
                transition={{ duration: 0.7, delay: 0.1 + i * 0.05, ease: 'easeOut' }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2 sm:gap-3">
          {stats.weekly.map((w) => (
            <span key={w.weekStart} className="flex-1 text-center text-[10px] text-stone-400 sm:text-xs">{weekLabel(w.weekStart)}</span>
          ))}
        </div>
      </Card>
    </div>
  );
}