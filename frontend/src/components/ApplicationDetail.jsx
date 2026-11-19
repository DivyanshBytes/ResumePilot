import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, ChevronDown, ExternalLink, Gauge, Lightbulb, Mail, MapPin, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import { formatDate } from '../lib/format';
import { verdict } from '../lib/status';
import ScoreRing from '../components/ScoreRing';
import KeywordChips from '../components/KeywordChips';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';
import Tabs from '../components/Tabs';
import TailorPanel from '../components/TailorPanel';
import CoverLetterPanel from '../components/CoverLetterPanel';

const TAB_IDS = ['overview', 'tailor', 'letter'];

function SubScore({ label, weight, value, delay }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums text-stone-500 dark:text-stone-400">{value}% <span className="text-xs">· counts {weight}</span></span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-white/10">
        <motion.div
          className="h-full rounded-full bg-brand-600 dark:bg-brand-400"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [app, setApp] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [rescoreId, setRescoreId] = useState('');
  const [rescoring, setRescoring] = useState(false);
  const [showJd, setShowJd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // The tab lives in the URL (?tab=tailor), so a refresh keeps your place
  const tab = TAB_IDS.includes(params.get('tab')) ? params.get('tab') : 'overview';
  const setTab = (t) => setParams(t === 'overview' ? {} : { tab: t }, { replace: true });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/applications/${id}`);
      setApp(data.application);
      setRescoreId(data.application.resume?._id || '');
    } catch (err) {
      toast.error(getErrorMessage(err));
      navigate('/applications', { replace: true });
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/resumes')
      .then(({ data }) => setResumes(data.resumes.filter((r) => r.parseStatus === 'parsed')))
      .catch(() => {});
  }, []);

  // Child panels call this after they change something on the server
  const onUpdated = useCallback((patch) => setApp((a) => ({ ...a, ...patch })), []);

  const rescore = async () => {
    setRescoring(true);
    try {
      await api.post(`/applications/${id}/rescore`, { resumeId: rescoreId });
      toast.success('Score updated');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRescoring(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/applications/${id}`);
      toast.success('Application deleted');
      navigate('/applications', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
    }
  };

  if (!app) return <div className="space-y-4"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-14" /><Skeleton className="h-72" /></div>;

  const score = app.atsScore || {};
  const v = verdict(score.overall || 0);
  const requiredSet = new Set((app.extractedKeywords?.required || []).map((k) => k.toLowerCase()));
  const missing = (score.missingKeywords || [])
    .map((k) => ({ label: k, marked: requiredSet.has(k.toLowerCase()) }))
    .sort((a, b) => Number(b.marked) - Number(a.marked));
  const matched = score.matchedKeywords || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Gauge },
    { id: 'tailor', label: 'Tailored resume', icon: Sparkles, done: Boolean(app.tailoredResume?.generatedAt) },
    { id: 'letter', label: 'Cover letter', icon: Mail, done: Boolean(app.coverLetter?.trim()) },
  ];

  return (
    <div>
      <Link to="/applications" className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> All applications
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">{app.jobTitle}</h1>
          <p className="mt-1 text-lg text-stone-600 dark:text-stone-300">{app.company}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-stone-500 dark:text-stone-400">
            <StatusBadge status={app.status} />
            {app.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{app.location}</span>}
            <span>Added {formatDate(app.createdAt)}</span>
            {app.jobUrl && (
              <a href={app.jobUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-semibold text-brand-700 hover:underline dark:text-brand-300">
                Job link <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={() => setConfirmDelete(true)} className="!py-2.5">
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>

      <div className="mt-8"><Tabs tabs={tabs} active={tab} onChange={setTab} /></div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="mt-6"
        >
          {tab === 'tailor' && <TailorPanel app={app} onUpdated={onUpdated} />}
          {tab === 'letter' && <CoverLetterPanel app={app} onUpdated={onUpdated} />}

          {tab === 'overview' && (
            <>
              <div className="surface grid gap-8 p-6 sm:p-8 md:grid-cols-[auto_1fr] md:items-center">
                <div className="text-center">
                  <ScoreRing value={score.overall || 0} size={190} stroke={14} />
                  <p className={`mt-3 font-display text-xl font-semibold ${v.cls}`}>{v.label}</p>
                </div>
                <div className="space-y-5">
                  <SubScore label="Keyword match" weight="50%" value={score.keywordMatch || 0} delay={0.4} />
                  <SubScore label="Skills match" weight="35%" value={score.skillsMatch || 0} delay={0.55} />
                  <SubScore label="Formatting health" weight="15%" value={score.formatting || 0} delay={0.7} />
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    This is an estimate. Real ATS software varies by employer, so use it as a guide, not a guarantee.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="surface p-6">
                  <h2 className="font-display text-xl font-semibold">Found in your resume <span className="text-brand-600 dark:text-brand-400">({matched.length})</span></h2>
                  <div className="mt-4">
                    {matched.length ? <KeywordChips items={matched} tone="good" /> : <p className="text-sm text-stone-500">No job keywords were found.</p>}
                  </div>
                </div>
                <div className="surface p-6">
                  <h2 className="font-display text-xl font-semibold">Missing <span className="text-rose-600 dark:text-rose-400">({missing.length})</span></h2>
                  <div className="mt-4">
                    {missing.length ? (
                      <>
                        <KeywordChips items={missing} tone="bad" />
                        <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> A dot means the job requires it
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-stone-500 dark:text-stone-400">Nothing missing. Every keyword is covered.</p>
                    )}
                  </div>
                </div>
              </div>

              {score.suggestions?.length > 0 && (
                <div className="surface mt-6 p-6">
                  <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                    <Lightbulb className="h-5 w-5 text-amber-500" /> How to improve this match
                  </h2>
                  <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } }} className="mt-4 space-y-3">
                    {score.suggestions.map((s, i) => (
                      <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                        className="flex gap-3 text-sm text-stone-700 dark:text-stone-300">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                        {s}
                      </motion.li>
                    ))}
                  </motion.ul>
                </div>
              )}

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="surface p-6">
                  <h2 className="font-display text-xl font-semibold">Score with another resume</h2>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    Currently using: <span className="font-semibold">{app.resume?.title || 'a resume that was deleted'}</span>. Re-scoring is instant and uses no AI.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <select
                      value={rescoreId}
                      onChange={(e) => setRescoreId(e.target.value)}
                      className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/5"
                    >
                      {!rescoreId && <option value="">Choose a resume</option>}
                      {resumes.map((r) => <option key={r._id} value={r._id} className="text-stone-900">{r.title}</option>)}
                    </select>
                    <Button onClick={rescore} loading={rescoring} disabled={!rescoreId} variant="outline">
                      <RefreshCw className="h-4 w-4" /> Re-score
                    </Button>
                  </div>
                </div>

                <div className="surface p-6">
                  <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                    <Sparkles className="h-5 w-5 text-brand-600 dark:text-brand-400" /> Next steps
                  </h2>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    Tailor your resume to this job, then write a matching cover letter.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button onClick={() => setTab('tailor')}>{app.tailoredResume?.generatedAt ? 'View tailored resume' : 'Tailor my resume'}</Button>
                    <Button variant="outline" onClick={() => setTab('letter')}>{app.coverLetter?.trim() ? 'View cover letter' : 'Write cover letter'}</Button>
                  </div>
                </div>
              </div>

              <div className="surface mt-6 p-6">
                <button onClick={() => setShowJd((s) => !s)} className="flex w-full items-center justify-between text-left">
                  <h2 className="font-display text-xl font-semibold">Original job description</h2>
                  <ChevronDown className={`h-5 w-5 transition-transform ${showJd ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {showJd && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <p className="whitespace-pre-wrap pt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{app.jobDescription}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this application?"
        message="The score, keywords, tailored resume and cover letter for this job will be removed. This cannot be undone."
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}