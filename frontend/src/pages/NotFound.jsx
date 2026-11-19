import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Button from '../components/Button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-400/15 dark:text-brand-300">
        <Compass className="h-8 w-8" />
      </div>
      <p className="mt-6 font-display text-6xl font-semibold text-brand-700 dark:text-brand-300">404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold">This page does not exist</h1>
      <p className="mt-2 max-w-sm text-stone-500 dark:text-stone-400">The link may be broken, or the page may have moved.</p>
      <Link to="/dashboard" className="mt-8"><Button>Back to dashboard</Button></Link>
    </div>
  );
}