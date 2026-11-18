import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Briefcase, Building2, ChevronDown, FileText, Link2, MapPin, Sparkles } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import useFakeProgress from '../hooks/useFakeProgress';
import ProgressSteps from '../components/ProgressSteps';
import EmptyState from '../components/EmptyState';
import Field from '../components/Field';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';

const STEPS = ['Reading the job posting', 'Extracting required skills', 'Matching against your resume', 'Calculating your ATS score'];
const MIN_CHARS = 100;

export default function NewApplication() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState(null);
  const [resumeId, setResumeId] = useState('');
  const [jd, setJd] = useState('');
  const [extra, setExtra] = useState({ company: '', jobTitle: '', jobUrl: '', location: '' });
  const [showExtra, setShowExtra] = useState(false);
  const [loading, setLoading] = useState(false);
  const step = useFakeProgress(loading, STEPS.length, 2600);

  useEffect(() => {
    api.get('/resumes')
      .then(({ data }) => {
        const parsed = data.resumes.filter((r) => r.parseStatus === 'parsed');
        setResumes(parsed);
        setResumeId((parsed.find((r) => r.isPrimary) || parsed[0])?._id || '');
      })
      .catch((err) => { toast.error(getErrorMessage(err)); setResumes([]); });
  }, []);

  const setField = (key) => (e) => setExtra((x) => ({ ...x, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (jd.trim().length < MIN_CHARS) return toast.error('Paste the full job description (at least 100 characters)');

    const body = { jobDescription: jd.trim(), resumeId };
    Object.entries(extra).forEach(([k, v]) => { if (v.trim()) body[k] = v.trim(); });

    setLoading(true);
    try {
      const { data } = await api.post('/applications', body);
      toast.success('Job analysed and scored');
      navigate(`/applications/${data.application._id}`);
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(message);
      // The AI could not find the company or title, so reveal those fields
      if (/company or job title/i.test(message)) setShowExtra(true);
      setLoading(false);
    }
  };

  if (resumes === null) return <Skeleton className="h-96" />;

  if (resumes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Upload a resume first"
        text="We need a parsed resume to score against the job."
        action={<Link to="/resumes"><Button>Go to resumes</Button></Link>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Analyse a job</h1>
      <p className="mt-2 text-stone-500 dark:text-stone-400">
        Paste a job posting. We will score how well your resume fits and show what is missing.
      </p>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="progress" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="surface mt-8 p-8">
            <h2 className="font-display text-xl font-semibold">Analysing your match</h2>
            <p className="mb-6 mt-1 text-sm text-stone-500 dark:text-stone-400">This usually takes 5 to 15 seconds.</p>
            <ProgressSteps steps={STEPS} active={step} />
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="surface mt-8 space-y-6 p-6 sm:p-8">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">Resume to score</label>
              <select
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white/80 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-white/10 dark:bg-white/5"
              >
                {resumes.map((r) => (
                  <option key={r._id} value={r._id} className="text-stone-900">
                    {r.title}{r.isPrimary ? ' (primary)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">Job description</label>
                <span className={`text-xs ${jd.trim().length >= MIN_CHARS ? 'text-brand-600 dark:text-brand-400' : 'text-stone-400'}`}>
                  {jd.trim().length} characters
                </span>
              </div>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                rows={11}
                placeholder="Paste the full job posting here: responsibilities, requirements, nice-to-haves..."
                className="w-full resize-y rounded-xl border border-stone-200 bg-white/80 px-4 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div>
              <button type="button" onClick={() => setShowExtra((s) => !s)}
                className="flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-300">
                Company and job details (optional)
                <ChevronDown className={`h-4 w-4 transition-transform ${showExtra ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {showExtra && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <p className="pt-3 text-xs text-stone-500 dark:text-stone-400">
                      We detect these from the posting. Fill them in only if you want to override, or if detection fails.
                    </p>
                    <div className="grid gap-4 pt-4 sm:grid-cols-2">
                      <Field label="Company" icon={Building2} value={extra.company} onChange={setField('company')} />
                      <Field label="Job title" icon={Briefcase} value={extra.jobTitle} onChange={setField('jobTitle')} />
                      <Field label="Location" icon={MapPin} value={extra.location} onChange={setField('location')} />
                      <Field label="Job link" icon={Link2} value={extra.jobUrl} onChange={setField('jobUrl')} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button type="submit" className="w-full" disabled={!resumeId}>
              <Sparkles className="h-4 w-4" /> Analyse this job
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}