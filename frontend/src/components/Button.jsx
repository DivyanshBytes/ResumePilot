import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const styles = {
  primary: 'bg-brand-700 text-white shadow-sm hover:bg-brand-800 dark:bg-brand-400 dark:text-brand-950 dark:hover:bg-brand-300',
  outline: 'border border-stone-300 bg-white/60 text-stone-800 hover:bg-stone-100 dark:border-white/15 dark:bg-transparent dark:text-stone-200 dark:hover:bg-white/5',
  ghost: 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/5',
  light: 'bg-white text-brand-900 shadow-sm hover:bg-brand-50', // for dark green sections
};

export default function Button({ children, variant = 'primary', loading = false, className = '', disabled, ...props }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </motion.button>
  );
}