import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ChevronDown, FileText, RefreshCw, Search, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import { formatDate } from '../lib/format';
import useFakeProgress from '../hooks/useFakeProgress';
import ProgressSteps from './ProgressSteps';
import KeywordChips from './KeywordChips';
import DiffText from './DiffText';
import DownloadButtons from './DownloadButtons';
import CountUp from './CountUp';
import Skeleton from './Skeleton';
import Button from './Button';

const STEPS = [
  'Finding evidence in your resume',
  'Rewriting bullets with AI',
  'Verifying every edit',
  'Building your preview',
];

const HOW = [
  { icon: Search, title: 'Finds your evidence', text: 'Matches each job keyword to the parts of your resume that genuinely support it.' },
  { icon: FileText, title: 'Rewrites the wording', text: 'Rephrases and emphasises your real work. No new employers, tools or numbers.' },
  { icon: ShieldCheck, title: 'Verifies every edit', text: 'Code rejects any rewrite that adds a skill or number your resume never had.' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

const titleOf = {
  exp: (e) => [e.role, e.company].filter(Boolean).join(' at ') || 'Experience',
  proj: (p) => p.name || 'Project',
};

// Pairs each tailored bullet with the original at the same position
const buildDiff = (originalList = [], tailoredList = [], getTitle) =>
  (tailoredList || []).map((item, i) => {
    const before = originalList[i]?.bullets || [];
    return {
      title: getTitle(item),
      rows: (item.bullets || []).map((after, j) => ({
        before: before[j] ?? '',
        after,
        changed: before[j] !== undefined && before[j].trim() !== after.trim(),
      })),
    };
  });

const Card = ({ title, children }) => (
  <motion.div variants={fadeUp} className="surface p-6">
    {title && <h3 className="mb-4 font-display text-lg font-semibold">{title}</h3>}
    {children}
  </motion.div>
);

function Compare({ before, after }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Before</p>
        <p className="text-sm text-stone-500 dark:text-stone-400">{before || 'Nothing here in your original resume'}</p>
      </div>
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">After</p>
        <p className="text-sm"><DiffText before={before} after={after} /></p>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = '' }) {
  return (
    <motion.div variants={fadeUp} className="surface p-5">
      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{label}</p>
      <p className={`mt-2 font-display text-4xl font-semibold tabular-nums ${tone}`}><CountUp value={value} /></p>
    </motion.div>
  );
}

function CleanPreview({ tailored, name }) {
  const dates = (e) => [e.startDate, e.endDate].filter(Boolean).join(' - ');
  const Section = ({ children, label }) => (
    <section className="mt-6">
      <h4 className="border-b border-stone-300 pb-1 text-xs font-bold uppercase tracking-widest">{label}</h4>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
  const Bullets = ({ items = [] }) => (
    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed">{items.map((b, i) => <li key={i}>{b}</li>)}</ul>
  );

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-stone-200 bg-white p-8 text-stone-900 shadow-lg shadow-stone-900/5 sm:p-10">
      {name && <h3 className="text-center font-display text-2xl font-semibold">{name}</h3>}
      {tailored.summary && <Section label="Summary"><p className="text-sm leading-relaxed">{tailored.summary}</p></Section>}
      {tailored.skills?.length > 0 && <Section label="Skills"><p className="text-sm leading-relaxed">{tailored.skills.join(', ')}</p></Section>}
      {tailored.experience?.length > 0 && (
        <Section label="Experience">
          {tailored.experience.map((e, i) => (
            <div key={i}>
              <div className="flex flex-wrap justify-between gap-2 text-sm font-bold">
                <span>{[e.role, e.company].filter(Boolean).join(', ')}</span>
                <span className="font-normal text-stone-500">{dates(e)}</span>
              </div>
              <Bullets items={e.bullets} />
            </div>
          ))}
        </Section>
      )}
      {tailored.projects?.length > 0 && (
        <Section label="Projects">
          {tailored.projects.map((p, i) => (
            <div key={i}>
              <p className="text-sm font-bold">
                {p.name}{p.techStack?.length ? <span className="font-normal text-stone-500"> | {p.techStack.join(', ')}</span> : null}
              </p>
              <Bullets items={p.bullets} />
            </div>
          ))}
        </Section>
      )}
      <p className="mt-8 text-center text-xs text-stone-400">
        Education and certifications are never rewritten. They are added from your original resume when you download.
      </p>
    </div>
  );
}

export default function TailorPanel({ app, onUpdated }) {
  const resumeId = app.resume?._id;
  const tailored = app.tailoredResume;
  const hasTailored = Boolean(tailored?.generatedAt);

  const [original, setOriginal] = useState(undefined); // undefined = loading, null = unavailable
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null); // only exists right after a fresh run
  const [view, setView] = useState('changes');
  const [showRejected, setShowRejected] = useState(false);
  const step = useFakeProgress(running, STEPS.length, 4000);

  // We need the original resume to show "before"
  useEffect(() => {
    if (!resumeId) { setOriginal(null); return undefined; }
    let active = true;
    api.get(`/resumes/${resumeId}`)
      .then(({ data }) => active && setOriginal(data.resume.parsed || {}))
      .catch(() => active && setOriginal(null));
    return () => { active = false; };
  }, [resumeId]);

  const diff = useMemo(() => {
    if (!hasTailored || !original) return null;
    const exp = buildDiff(original.experience, tailored.experience, titleOf.exp);
    const proj = buildDiff(original.projects, tailored.projects, titleOf.proj);
    const rows = [...exp, ...proj].flatMap((g) => g.rows);
    const before = (original.summary || '').trim();
    const after = (tailored.summary || '').trim();
    return {
      groups: [...exp, ...proj].filter((g) => g.rows.some((r) => r.changed)),
      changed: rows.filter((r) => r.changed).length,
      unchanged: rows.filter((r) => !r.changed).length,
      summary: { before, after, changed: Boolean(after) && after !== before },
      reordered: (original.skills || []).join('|') !== (tailored.skills || []).join('|'),
    };
  }, [hasTailored, original, tailored]);

  const tailor = async () => {
    setRunning(true);
    try {
      const { data } = await api.post(`/applications/${app._id}/tailor`);
      setReport(data.report);
      onUpdated({ tailoredResume: data.tailoredResume });
      setView('changes');
      toast.success('Resume tailored');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRunning(false);
    }
  };

  if (running) {
    return (
      <div className="surface p-8">
        <h2 className="font-display text-xl font-semibold">Tailoring your resume</h2>
        <p className="mb-6 mt-1 text-sm text-stone-500 dark:text-stone-400">This usually takes 15 to 30 seconds.</p>
        <ProgressSteps steps={STEPS} active={step} />
      </div>
    );
  }

  if (!hasTailored) {
    return (
      <div className="surface p-6 sm:p-8">
        <h2 className="font-display text-2xl font-semibold">Tailor your resume to this job</h2>
        <p className="mt-2 max-w-2xl text-stone-600 dark:text-stone-400">
          We reword your existing bullet points to speak to what {app.company} is asking for. Nothing is invented.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {HOW.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-xl border border-stone-200 p-4 dark:border-white/10">
              <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <p className="mt-3 font-semibold">{title}</p>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 rounded-lg bg-stone-100 p-4 text-sm text-stone-600 dark:bg-white/5 dark:text-stone-300">
          Tailoring improves wording and emphasis. It never adds skills you do not have, so your score may not change much. Missing keywords stay missing until you genuinely add them.
        </p>
        <Button onClick={tailor} className="mt-6"><Sparkles className="h-4 w-4" /> Tailor my resume</Button>
      </div>
    );
  }

  const mode = diff ? view : 'clean'; // without the original we can only show the clean version
  const missing = app.atsScore?.missingKeywords || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold">Your tailored resume</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">Generated {formatDate(tailored.generatedAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DownloadButtons appId={app._id} kind="resume" />
          <Button variant="ghost" onClick={tailor} className="!px-3 !py-2.5" title="Generate a fresh version">
            <RefreshCw className="h-4 w-4" /> Tailor again
          </Button>
        </div>
      </div>

      {original === undefined && <Skeleton className="h-40" />}

      {original === null && (
        <p className="rounded-lg bg-amber-100 p-4 text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
          The original resume for this application is no longer available, so we cannot show a comparison. The clean preview below is still your tailored version.
        </p>
      )}

      {diff && (
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-3">
          <Stat label="Bullets rewritten" value={diff.changed} tone="text-brand-700 dark:text-brand-300" />
          <Stat label="Kept as written" value={diff.unchanged} />
          <Stat label="Gaps never faked" value={missing.length} tone={missing.length ? 'text-rose-600 dark:text-rose-400' : ''} />
        </motion.div>
      )}

      {diff && (
        <div className="inline-flex rounded-xl border border-stone-200 bg-white p-1 dark:border-white/10 dark:bg-panel">
          {[['changes', 'Changes'], ['clean', 'Clean preview']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                mode === id ? 'bg-brand-700 text-white dark:bg-brand-400 dark:text-brand-950' : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {mode === 'changes' && diff ? (
          <motion.div key="changes" variants={container} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-4">
            {diff.summary.changed && (
              <Card title="Summary"><Compare before={diff.summary.before} after={diff.summary.after} /></Card>
            )}

            {diff.reordered && (
              <Card title="Skills reordered">
                <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
                  Nothing was added or removed. Skills this job asks for now come first.
                </p>
                <KeywordChips items={tailored.skills.slice(0, 12)} tone="good" />
              </Card>
            )}

            {diff.groups.map((group) => (
              <Card key={group.title} title={group.title}>
                <div className="space-y-4">
                  {group.rows.filter((r) => r.changed).map((row, i) => (
                    <div key={i} className="rounded-xl border border-stone-200 p-4 dark:border-white/10">
                      <Compare before={row.before} after={row.after} />
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {!diff.summary.changed && !diff.reordered && diff.groups.length === 0 && (
              <Card>
                <p className="text-sm text-stone-600 dark:text-stone-300">
                  No bullets needed changes for this job. Either your wording already fits, or the checks rejected the AI's edits to protect the truth. Your original text was kept.
                </p>
              </Card>
            )}

            <p className="text-xs text-stone-400">Highlighted words are new in the rewrite.</p>
          </motion.div>
        ) : (
          <motion.div key="clean" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CleanPreview tailored={tailored} name={original?.fullName} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safety check */}
      {report ? (
        report.rejected?.length ? (
          <div className="surface p-6">
            <button onClick={() => setShowRejected((s) => !s)} className="flex w-full items-center justify-between text-left">
              <span className="flex items-center gap-2 font-display text-lg font-semibold">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                Safety check blocked {report.rejected.length} {report.rejected.length === 1 ? 'edit' : 'edits'}
              </span>
              <ChevronDown className={`h-5 w-5 transition-transform ${showRejected ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {showRejected && (
                <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden pt-4 text-sm text-stone-600 dark:text-stone-300">
                  {report.rejected.map((r, i) => (
                    <li key={i}><span className="font-semibold">{r.where}:</span> {r.reason}</li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
            <p className="mt-3 text-xs text-stone-400">Those bullets kept your original wording.</p>
          </div>
        ) : (
          <p className="flex items-center gap-2 rounded-lg bg-brand-100 p-4 text-sm font-medium text-brand-900 dark:bg-brand-400/10 dark:text-brand-200">
            <ShieldCheck className="h-5 w-5 shrink-0" /> Safety check passed. Every rewrite stayed within your real experience.
          </p>
        )
      ) : (
        <p className="flex items-center gap-2 text-xs text-stone-400">
          <ShieldCheck className="h-4 w-4" /> Every rewrite is checked against your resume before it is saved.
        </p>
      )}

      {missing.length > 0 && (
        <div className="surface p-6">
          <h3 className="font-display text-lg font-semibold">Still missing from your resume</h3>
          <p className="mb-4 mt-1 text-sm text-stone-500 dark:text-stone-400">
            We never add these for you. If you genuinely have a skill, add it to your resume yourself and re-score.
          </p>
          <KeywordChips items={missing} tone="bad" />
        </div>
      )}
    </div>
  );
}