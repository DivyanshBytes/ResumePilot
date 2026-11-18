import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ChevronDown, FileText, Loader2, RefreshCw, Star, Trash2, UploadCloud } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import { formatDate } from '../lib/format';
import useFakeProgress from '../hooks/useFakeProgress';
import ProgressSteps from '../components/ProgressSteps';
import KeywordChips from '../components/KeywordChips';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';

const MAX_SIZE = 5 * 1024 * 1024; // matches the server limit
const UPLOAD_STEPS = ['Uploading your file', 'Reading the text', 'Structuring it with AI', 'Saving your resume'];

const STATUS_STYLE = {
  parsed: { label: 'Parsed', cls: 'bg-brand-100 text-brand-800 dark:bg-brand-400/15 dark:text-brand-200' },
  failed: { label: 'Parse failed', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300' },
  pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300' },
};

function ResumeCard({ resume, busy, onPrimary, onReparse, onDelete }) {
  const [open, setOpen] = useState(false);
  const parsed = resume.parsed || {};
  const status = STATUS_STYLE[resume.parseStatus] || STATUS_STYLE.pending;

  return (
    <motion.li layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="surface p-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-400/15 dark:text-brand-300">
          <FileText className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-bold">{resume.title}</h3>
            {resume.isPrimary && (
              <span className="flex items-center gap-1 rounded-md bg-brand-700 px-2 py-0.5 text-xs font-semibold text-white dark:bg-brand-400 dark:text-brand-950">
                <Star className="h-3 w-3" /> Primary
              </span>
            )}
            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${status.cls}`}>{status.label}</span>
          </div>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {resume.originalFileName} · {resume.fileType.toUpperCase()} · {formatDate(resume.createdAt)}
          </p>
          {resume.parseStatus === 'parsed' && (
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
              {parsed.skills?.length || 0} skills · {parsed.experience?.length || 0} roles · {parsed.projects?.length || 0} projects
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {busy ? (
            <Loader2 className="mx-3 h-5 w-5 animate-spin text-brand-600" />
          ) : (
            <>
              {!resume.isPrimary && resume.parseStatus === 'parsed' && (
                <button onClick={() => onPrimary(resume)} title="Make primary" aria-label="Make primary"
                  className="grid h-9 w-9 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-white/10">
                  <Star className="h-[18px] w-[18px]" />
                </button>
              )}
              <button onClick={() => onReparse(resume)} title="Re-parse with AI" aria-label="Re-parse"
                className="grid h-9 w-9 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-white/10">
                <RefreshCw className="h-[18px] w-[18px]" />
              </button>
              <button onClick={() => onDelete(resume)} title="Delete" aria-label="Delete"
                className="grid h-9 w-9 place-items-center rounded-lg text-stone-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-400/10">
                <Trash2 className="h-[18px] w-[18px]" />
              </button>
            </>
          )}
        </div>
      </div>

      {resume.parseStatus === 'parsed' && (
        <>
          <button onClick={() => setOpen((o) => !o)}
            className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-300">
            {open ? 'Hide' : 'See'} what we extracted
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="space-y-4 pt-4 text-sm">
                  {parsed.fullName && <p><span className="font-semibold">Name:</span> {parsed.fullName}</p>}
                  {parsed.skills?.length > 0 && (
                    <div>
                      <p className="mb-2 font-semibold">Skills</p>
                      <KeywordChips items={parsed.skills.slice(0, 24)} tone="muted" />
                    </div>
                  )}
                  {parsed.experience?.length > 0 && (
                    <div>
                      <p className="mb-1 font-semibold">Experience</p>
                      <ul className="space-y-1 text-stone-600 dark:text-stone-300">
                        {parsed.experience.map((e, i) => (
                          <li key={i}>{[e.role, e.company].filter(Boolean).join(' at ')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs text-stone-400">If something looks wrong, use the re-parse button.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.li>
  );
}

export default function Resumes() {
  const [resumes, setResumes] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef(null);
  const step = useFakeProgress(uploading, UPLOAD_STEPS.length, 3500);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/resumes');
      setResumes(data.resumes);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setResumes([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const upload = async (file) => {
    if (!file || uploading) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) return toast.error('Only PDF and DOCX files are supported');
    if (file.size > MAX_SIZE) return toast.error('That file is over 5 MB');

    const form = new FormData();
    form.append('resume', file); // the field name must be exactly "resume"

    setUploading(true);
    try {
      const { data } = await api.post('/resumes', form);
      if (data.resume.parseStatus === 'parsed') toast.success('Resume uploaded and parsed');
      else toast('Saved, but parsing failed. Use the re-parse button.', { icon: '⚠️' });
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files?.[0]);
  };

  const action = async (resume, run, success) => {
    setBusyId(resume._id);
    try {
      await run();
      toast.success(success);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/resumes/${toDelete._id}`);
      setResumes((list) => list.filter((r) => r._id !== toDelete._id));
      toast.success('Resume deleted');
      setToDelete(null);
      load(); // the server may have another resume to show as primary
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold tracking-tight">Resumes</h1>
      <p className="mt-2 text-stone-500 dark:text-stone-400">
        Upload your resume once. We read it and keep it organised for every application.
      </p>

      {/* Drop zone, swapped for live progress while uploading */}
      <div className="mt-8">
        {uploading ? (
          <div className="surface p-8">
            <h2 className="font-display text-xl font-semibold">Processing your resume</h2>
            <p className="mb-6 mt-1 text-sm text-stone-500 dark:text-stone-400">This usually takes 10 to 20 seconds.</p>
            <ProgressSteps steps={UPLOAD_STEPS} active={step} />
          </div>
        ) : (
          <motion.div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            animate={{ scale: dragging ? 1.015 : 1 }}
            className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
              dragging
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-400/10'
                : 'border-stone-300 bg-white hover:border-brand-400 dark:border-white/15 dark:bg-panel'
            }`}
          >
            <motion.div animate={{ y: dragging ? -6 : 0 }}
              className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-400/15 dark:text-brand-300">
              <UploadCloud className="h-7 w-7" />
            </motion.div>
            <p className="mt-4 font-semibold">{dragging ? 'Drop it here' : 'Drag your resume here, or click to browse'}</p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">PDF or DOCX, up to 5 MB. Text-based files only, not scans.</p>
            <input ref={inputRef} type="file" accept=".pdf,.docx" hidden onChange={(e) => upload(e.target.files?.[0])} />
          </motion.div>
        )}
      </div>

      <div className="mt-10">
        {resumes === null ? (
          <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        ) : resumes.length === 0 ? (
          <EmptyState icon={FileText} title="No resumes yet" text="Upload your first resume above to get started." />
        ) : (
          <ul className="space-y-4">
            <AnimatePresence>
              {resumes.map((r) => (
                <ResumeCard
                  key={r._id}
                  resume={r}
                  busy={busyId === r._id}
                  onPrimary={(x) => action(x, () => api.patch(`/resumes/${x._id}/primary`), 'Primary resume updated')}
                  onReparse={(x) => action(x, () => api.post(`/resumes/${x._id}/reparse`), 'Resume re-parsed')}
                  onDelete={setToDelete}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this resume?"
        message="Applications that used it keep their scores, but you will need to re-score them with another resume before tailoring."
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}