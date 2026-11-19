import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { STATUS } from '../lib/status';
import KanbanCard from './KanbanCard';

const DOT = {
  wishlist: 'bg-stone-400',
  applied: 'bg-brand-500',
  interview: 'bg-amber-500',
  offer: 'bg-emerald-500',
  rejected: 'bg-rose-500',
};

export default function KanbanColumn({ id, items, highlighted }) {
  // The column itself is a drop target, so you can drop into an empty column
  const { setNodeRef } = useDroppable({ id });

  return (
    <section
      aria-label={`${STATUS[id].label}, ${items.length} applications`}
      className={`flex min-h-[22rem] flex-col rounded-2xl p-3 transition-colors ${
        highlighted ? 'bg-brand-100/70 dark:bg-brand-400/10' : 'bg-stone-100/80 dark:bg-white/[0.03]'
      }`}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <span className={`h-2.5 w-2.5 rounded-full ${DOT[id]}`} />
          {STATUS[id].label}
        </h2>
        <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold tabular-nums dark:bg-white/10">
          {items.length}
        </span>
      </header>

      <SortableContext items={items.map((a) => a._id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex flex-1 flex-col gap-2.5">
          {items.map((a) => (
            <KanbanCard key={a._id} app={a} />
          ))}
          {items.length === 0 && (
            <li className="grid flex-1 list-none place-items-center rounded-xl border border-dashed border-stone-300 py-8 text-xs text-stone-400 dark:border-white/15">
              Drop here
            </li>
          )}
        </ul>
      </SortableContext>
    </section>
  );
}