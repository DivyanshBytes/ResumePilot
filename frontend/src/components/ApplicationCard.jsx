import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import ScoreRing from './ScoreRing';
import StatusBadge from './StatusBadge';
import { formatDate } from '../lib/format';

export default function ApplicationCard({ application: a }) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
      <Link
        to={`/applications/${a._id}`}
        className="surface flex items-center gap-4 p-5 transition-shadow hover:shadow-lg hover:shadow-stone-900/10"
      >
        <ScoreRing value={a.atsScore?.overall || 0} size={64} stroke={7} showLabel={false} delay={0.1} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{a.jobTitle}</p>
          <p className="truncate text-sm text-stone-500 dark:text-stone-400">
            {a.company}{a.location ? ` · ${a.location}` : ''}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={a.status} />
            <span className="text-xs text-stone-400">{formatDate(a.createdAt)}</span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-stone-300 dark:text-stone-600" />
      </Link>
    </motion.div>
  );
}