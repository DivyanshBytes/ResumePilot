import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor,
  closestCorners, useSensor, useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Columns3, Plus } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import { STATUS } from '../lib/status';
import KanbanColumn from '../components/KanbanColumn';
import { CardView } from '../components/KanbanCard';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';

const STATUSES = ['wishlist', 'applied', 'interview', 'offer', 'rejected'];
const emptyBoard = () => Object.fromEntries(STATUSES.map((s) => [s, []]));

// Which column does this id belong to? (the id can be a column or a card)
const findContainer = (id, cols) =>
  id in cols ? id : STATUSES.find((s) => cols[s].some((a) => a._id === id));

export default function Board() {
  const [columns, setColumns] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);
  const snapshot = useRef(null); // the board as it was when the drag began

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),   // a small drag, so clicks still work
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }), // press and hold on phones
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/applications/board');
      setColumns({ ...emptyBoard(), ...data.board });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setColumns(emptyBoard());
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const total = columns ? STATUSES.reduce((n, s) => n + columns[s].length, 0) : 0;
  const activeApp = columns && activeId
    ? STATUSES.flatMap((s) => columns[s]).find((a) => a._id === activeId)
    : null;

  const handleDragStart = ({ active }) => {
    snapshot.current = columns;
    setActiveId(active.id);
  };

  // While dragging over another column, move the card into it right away,
  // so the other cards make room as you hover
  const handleDragOver = ({ active, over }) => {
    if (!over) { setOverColumn(null); return; }
    setOverColumn(findContainer(over.id, columns));

    setColumns((prev) => {
      const from = findContainer(active.id, prev);
      const to = findContainer(over.id, prev);
      if (!from || !to || from === to) return prev;

      const moving = prev[from].find((a) => a._id === active.id);
      const target = prev[to];
      let index = target.length; // dropping on the column itself means "at the end"

      if (!(over.id in prev)) {
        const overIndex = target.findIndex((a) => a._id === over.id);
        const translated = active.rect.current.translated;
        const below = translated && translated.top > over.rect.top + over.rect.height;
        index = overIndex + (below ? 1 : 0);
      }

      return {
        ...prev,
        [from]: prev[from].filter((a) => a._id !== active.id),
        [to]: [...target.slice(0, index), { ...moving, status: to }, ...target.slice(index)],
      };
    });
  };

  const persist = async (id, status, position, movedColumns) => {
    try {
      const { data } = await api.patch(`/applications/${id}/move`, { status, position });
      // The server sets the applied date the first time a card reaches "Applied"
      setColumns((cols) => ({
        ...cols,
        [status]: cols[status].map((a) => (a._id === id ? { ...a, appliedDate: data.application.appliedDate } : a)),
      }));
      if (movedColumns) toast.success(`Moved to ${STATUS[status].label}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      load(); // the server is the source of truth, so reload the real board
    }
  };

  const handleDragEnd = ({ active, over }) => {
    const start = snapshot.current;
    snapshot.current = null;
    setActiveId(null);
    setOverColumn(null);

    if (!over) { if (start) setColumns(start); return; } // dropped outside: put it back

    let next = columns;
    const container = findContainer(active.id, columns);
    const overContainer = findContainer(over.id, columns);

    // Reordering inside one column
    if (container && container === overContainer) {
      const list = columns[container];
      const oldIndex = list.findIndex((a) => a._id === active.id);
      const newIndex = over.id in columns ? list.length - 1 : list.findIndex((a) => a._id === over.id);
      if (newIndex !== -1 && oldIndex !== newIndex) {
        next = { ...columns, [container]: arrayMove(list, oldIndex, newIndex) };
        setColumns(next);
      }
    }

    // Save only if something actually changed compared with the start
    const to = findContainer(active.id, next);
    const was = findContainer(active.id, start);
    const index = next[to].findIndex((a) => a._id === active.id);
    const wasIndex = start[was].findIndex((a) => a._id === active.id);
    if (to === was && index === wasIndex) return;

    persist(active.id, to, index, to !== was);
  };

  const handleDragCancel = () => {
    if (snapshot.current) setColumns(snapshot.current); // Escape key
    snapshot.current = null;
    setActiveId(null);
    setOverColumn(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Board</h1>
          <p className="mt-2 text-stone-500 dark:text-stone-400">
            Drag applications between stages. On a phone, press and hold a card first.
          </p>
        </div>
        <Link to="/applications/new"><Button><Plus className="h-4 w-4" /> Analyse a job</Button></Link>
      </div>

      <div className="mt-8">
        {columns === null ? (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {STATUSES.map((s) => <Skeleton key={s} className="h-80" />)}
          </div>
        ) : total === 0 ? (
          <EmptyState
            icon={Columns3}
            title="Your board is empty"
            text="Every job you analyse lands in the Wishlist column. Start with one."
            action={<Link to="/applications/new"><Button>Analyse your first job</Button></Link>}
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="overflow-x-auto pb-4">
              <div className="grid auto-cols-[minmax(250px,1fr)] grid-flow-col gap-4">
                {STATUSES.map((s) => (
                  <KanbanColumn key={s} id={s} items={columns[s]} highlighted={overColumn === s && activeId !== null} />
                ))}
              </div>
            </div>
            <DragOverlay dropAnimation={{ duration: 180 }}>
              {activeApp ? <CardView app={activeApp} overlay /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}