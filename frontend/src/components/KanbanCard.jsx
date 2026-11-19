import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MapPin } from 'lucide-react';
import { formatDate } from '../lib/format';

const scoreDot = (s) => (s >= 75 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-500' : 'bg-rose-500');

// The visual card. It is used both in the column and in the floating copy you drag around.
export function CardView({ app, overlay = false, dragging = false }) {
  const score = app.atsScore?.overall ?? 0;
  const date = app.appliedDate || app.createdAt;

  return (
    <div
      className={`select-none rounded-xl border bg-white p-3.5 dark:bg-panel ${
        overlay
          ? 'rotate-2 border-brand-400 shadow-2xl shadow-stone-900/25'
          : 'border-stone-200 shadow-sm shadow-stone-900/5 dark:border-white/10'
      } ${dragging ? 'opacity-30' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/applications/${app._id}`}
          draggable={false}
          className="min-w-0 font-semibold leading-snug hover:text-brand-700 dark:hover:text-brand-300"
        >
          <span className="line-clamp-2">{app.jobTitle}</span>
        </Link>
        <span
          title="ATS score"
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-stone-100 px-2 py-0.5 text-xs font-bold tabular-nums dark:bg-white/10"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${scoreDot(score)}`} />
          {score}
        </span>
      </div>
      <p className="mt-1 truncate text-sm text-stone-500 dark:text-stone-400">{app.company}</p>
      <div className="mt-3 flex items-center gap-3 text-xs text-stone-400">
        {app.location && (
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{app.location}</span>
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-1" title="Applied date, or date added">
          <Calendar className="h-3 w-3" />
          {formatDate(date)}
        </span>
      </div>
    </div>
  );
}

// The draggable wrapper
export default function KanbanCard({ app }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app._id,
    attributes: { roleDescription: 'draggable application card' },
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className="list-none rounded-xl"
    >
      <CardView app={app} dragging={isDragging} />
    </li>
  );
}