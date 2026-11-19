import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Check, Copy, RefreshCw, Save, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import useFakeProgress from '../hooks/useFakeProgress';
import ProgressSteps from './ProgressSteps';
import DownloadButtons from './DownloadButtons';
import ConfirmDialog from './ConfirmDialog';
import Button from './Button';

const STEPS = ['Gathering your strongest evidence', 'Writing the first draft', 'Checking every claim against your resume'];

const TONES = [
  { id: 'professional', label: 'Professional', text: 'Confident and warm' },
  { id: 'enthusiastic', label: 'Enthusiastic', text: 'Energetic, still polished' },
  { id: 'concise', label: 'Concise', text: 'Short, about 180 words' },
];

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const countWords = (text) => text.split(/\s+/).filter(Boolean).length;

function TonePicker({ value, onChange, disabled }) {
  return (
    <div role="radiogroup" aria-label="Tone" className="grid gap-3 sm:grid-cols-3">
      {TONES.map((t) => {
        const on = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(t.id)}
            className={`rounded-xl border p-4 text-left transition disabled:opacity-60 ${
              on
                ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20 dark:border-brand-400 dark:bg-brand-400/10'
                : 'border-stone-200 hover:border-stone-300 dark:border-white/10 dark:hover:border-white/25'
            }`}
          >
            <p className="font-semibold">{t.label}</p>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{t.text}</p>
          </button>
        );
      })}
    </div>
  );
}

export default function CoverLetterPanel({ app, onUpdated }) {
  const [tone, setTone] = useState('professional');
  const [letter, setLetter] = useState(app.coverLetter || '');
  const [saved, setSaved] = useState(app.coverLetter || '');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [verified, setVerified] = useState(false);
  const [typed, setTyped] = useState(null); // text revealed so far, or null when not animating
  const [confirmOpen, setConfirmOpen] = useState(false);
  const step = useFakeProgress(generating, STEPS.length, 3500);

  // Typewriter reveal of a freshly written letter. Clicking the text skips it.
  useEffect(() => {
    if (typed === null) return undefined;
    if (typed.length >= letter.length) { setTyped(null); return undefined; }
    const id = setTimeout(() => setTyped(letter.slice(0, typed.length + 10)), 16);
    return () => clearTimeout(id);
  }, [typed, letter]);

  const generate = async () => {
    setConfirmOpen(false);
    setGenerating(true);
    try {
      const { data } = await api.post(`/applications/${app._id}/cover-letter`, { tone });
      setLetter(data.coverLetter);
      setSaved(data.coverLetter);
      setWarnings(data.warnings || []);
      setVerified((data.warnings || []).length === 0);
      onUpdated({ coverLetter: data.coverLetter });
      if (!reduceMotion()) setTyped('');
      toast.success('Cover letter ready');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/applications/${app._id}`, { coverLetter: letter });
      setSaved(letter);
      setWarnings([]);
      setVerified(false);
      onUpdated({ coverLetter: letter });
      toast.success('Saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Could not copy. Select the text and copy it manually.');
    }
  };

  if (generating) {
    return (
      <div className="surface p-8">
        <h2 className="font-display text-xl font-semibold">Writing your cover letter</h2>
        <p className="mb-6 mt-1 text-sm text-stone-500 dark:text-stone-400">This usually takes 10 to 25 seconds.</p>
        <ProgressSteps steps={STEPS} active={step} />
      </div>
    );
  }

  // First visit: choose a tone and write
  if (!letter) {
    return (
      <div className="surface p-6 sm:p-8">
        <h2 className="font-display text-2xl font-semibold">Write a cover letter for {app.company}</h2>
        <p className="mb-6 mt-2 max-w-2xl text-stone-600 dark:text-stone-400">
          Built only from your real experience and this job posting. Pick a tone, then edit the draft however you like.
        </p>
        <TonePicker value={tone} onChange={setTone} />
        <Button onClick={generate} className="mt-6"><Sparkles className="h-4 w-4" /> Write my cover letter</Button>
      </div>
    );
  }

  const dirty = letter !== saved;
  const typing = typed !== null;

  return (
    <div className="space-y-6">
      <div className="surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">New draft</h2>
          <Button variant="outline" onClick={() => setConfirmOpen(true)} className="!py-2.5">
            <RefreshCw className="h-4 w-4" /> Write a new draft
          </Button>
        </div>
        <div className="mt-4"><TonePicker value={tone} onChange={setTone} /></div>
      </div>

      <AnimatePresence>
        {warnings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex gap-3 rounded-xl bg-amber-100 p-4 text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <ul className="space-y-1">{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </motion.div>
        )}
        {verified && warnings.length === 0 && (
          <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl bg-brand-100 p-4 text-sm font-medium text-brand-900 dark:bg-brand-400/10 dark:text-brand-200">
            <ShieldCheck className="h-5 w-5 shrink-0" /> Checked against your resume: no unsupported skills or numbers.
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg shadow-stone-900/5 dark:border-white/10 dark:bg-stone-100">
        {typing ? (
          <div
            onClick={() => setTyped(null)}
            title="Click to skip"
            className="min-h-[26rem] cursor-pointer whitespace-pre-wrap p-8 text-[15px] leading-7 text-stone-800 sm:p-10"
          >
            {typed}
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-brand-600 align-middle" />
          </div>
        ) : (
          <textarea
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            rows={18}
            spellCheck
            aria-label="Cover letter"
            className="block min-h-[26rem] w-full resize-y bg-transparent p-8 text-[15px] leading-7 text-stone-800 outline-none sm:p-10"
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-stone-50 px-5 py-3 dark:bg-stone-200/60">
          <div className="flex items-center gap-3 text-sm text-stone-600">
            <span className="tabular-nums">{countWords(letter)} words</span>
            {typing ? (
              <span className="text-xs text-stone-500">Click the text to skip the animation</span>
            ) : dirty ? (
              <span className="font-semibold text-amber-700">Unsaved changes</span>
            ) : (
              <span className="flex items-center gap-1 font-semibold text-brand-700"><Check className="h-4 w-4" /> Saved</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={copy} className="!px-4 !py-2.5 !bg-white"><Copy className="h-4 w-4" /> Copy</Button>
            {dirty && !typing && (
              <Button onClick={save} loading={saving} className="!px-4 !py-2.5"><Save className="h-4 w-4" /> Save</Button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {dirty ? 'Save your edits to enable downloads.' : 'Download the saved letter:'}
        </p>
        <DownloadButtons
          appId={app._id}
          kind="cover-letter"
          disabled={dirty || typing}
          hint="Save your edits first"
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Replace your current letter?"
        message="A new draft will overwrite the current text, including any edits you made."
        confirmLabel="Write new draft"
        onConfirm={generate}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}