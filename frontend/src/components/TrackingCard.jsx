import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import { STATUS } from '../lib/status';
import Button from './Button';

const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const inputClass =
  'w-full rounded-xl border border-stone-200 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-white/10 dark:bg-white/5';

export default function TrackingCard({ app, onUpdated }) {
  const [notes, setNotes] = useState(app.notes || '');
  const [date, setDate] = useState(toInput(app.appliedDate));
  const [moving, setMoving] = useState(false);
  const [saving, setSaving] = useState(false);

  // The server fills in the applied date when a card first reaches "Applied"
  useEffect(() => setDate(toInput(app.appliedDate)), [app.appliedDate]);

  const dirty = notes !== (app.notes || '') || date !== toInput(app.appliedDate);

  const changeStage = async (status) => {
    if (status === app.status) return;
    setMoving(true);
    try {
      const { data } = await api.patch(`/applications/${app._id}/move`, { status });
      onUpdated({ status: data.application.status, appliedDate: data.application.appliedDate });
      toast.success(`Moved to ${STATUS[status].label}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMoving(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/applications/${app._id}`, { notes, appliedDate: date });
      onUpdated({ notes, appliedDate: date ? new Date(date).toISOString() : undefined });
      toast.success('Saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="surface p-6">
      <h2 className="font-display text-xl font-semibold">Tracking</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="stage" className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">Stage</label>
          <select id="stage" value={app.status} disabled={moving} onChange={(e) => changeStage(e.target.value)} className={inputClass}>
            {Object.entries(STATUS).map(([id, s]) => (
              <option key={id} value={id} className="text-stone-900">{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="applied" className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">Applied on</label>
          <input id="applied" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">Notes</label>
        <textarea
          id="notes"
          rows={4}
          maxLength={5000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Referral, recruiter name, interview dates, follow-ups..."
          className={`${inputClass} resize-y`}
        />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-stone-400">{dirty ? 'Unsaved changes' : 'Everything is saved'}</p>
        <Button onClick={save} loading={saving} disabled={!dirty} className="!py-2.5">
          <Save className="h-4 w-4" /> Save
        </Button>
      </div>
    </div>
  );
}