// Badge styles per Kanban stage. Colours carry meaning, so they are fixed.
export const STATUS = {
  wishlist: { label: 'Wishlist', cls: 'bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-300' },
  applied: { label: 'Applied', cls: 'bg-brand-100 text-brand-800 dark:bg-brand-400/15 dark:text-brand-200' },
  interview: { label: 'Interview', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300' },
  offer: { label: 'Offer', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300' },
  rejected: { label: 'Rejected', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300' },
};

export const verdict = (score) =>
  score >= 75
    ? { label: 'Strong match', cls: 'text-emerald-700 dark:text-emerald-400' }
    : score >= 50
      ? { label: 'Moderate match', cls: 'text-amber-700 dark:text-amber-400' }
      : { label: 'Weak match', cls: 'text-rose-700 dark:text-rose-400' };