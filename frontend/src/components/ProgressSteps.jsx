import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

export default function ProgressSteps({ steps, active }) {
  return (
    <div>
      {/* Thin bar that grows with each stage */}
      <div className="h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-white/10">
        <motion.div
          className="h-full rounded-full bg-brand-600 dark:bg-brand-400"
          animate={{ width: `${((active + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <ol className="mt-6 space-y-4">
        {steps.map((label, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <motion.li
              key={label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: done || current ? 1 : 0.4, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 text-sm font-medium"
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                  done
                    ? 'bg-brand-600 text-white dark:bg-brand-400 dark:text-brand-950'
                    : current
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'border border-stone-300 dark:border-white/20'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : current ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              </span>
              <span className={current ? 'text-stone-900 dark:text-white' : 'text-stone-500 dark:text-stone-400'}>{label}</span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}