import { motion } from 'framer-motion';

const TONES = {
  good: 'bg-brand-100 text-brand-800 dark:bg-brand-400/15 dark:text-brand-200',
  bad: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
  muted: 'bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-300',
};

// items: array of strings, or { label, marked } where marked adds a small dot (used for "required")
export default function KeywordChips({ items = [], tone = 'good' }) {
  return (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.04 } } }}
      className="flex flex-wrap gap-2"
    >
      {items.map((item) => {
        const label = typeof item === 'string' ? item : item.label;
        const marked = typeof item === 'object' && item.marked;
        return (
          <motion.li
            key={label}
            variants={{ hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1 } }}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${TONES[tone]}`}
          >
            {marked && <span title="Required by the job" className="h-1.5 w-1.5 rounded-full bg-current" />}
            {label}
          </motion.li>
        );
      })}
    </motion.ul>
  );
}