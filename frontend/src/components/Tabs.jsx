import { motion } from 'framer-motion';

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div
      role="tablist"
      className="flex gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1 dark:border-white/10 dark:bg-panel"
    >
      {tabs.map(({ id, label, icon: Icon, done }) => {
        const on = id === active;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(id)}
            className={`relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              on ? 'text-brand-800 dark:text-brand-100' : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
            }`}
          >
            {on && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-lg bg-brand-100 dark:bg-brand-400/15"
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            )}
            <Icon className="relative h-4 w-4" />
            <span className="relative">{label}</span>
            {done && <span title="Done" className="relative h-1.5 w-1.5 rounded-full bg-brand-500" />}
          </button>
        );
      })}
    </div>
  );
}