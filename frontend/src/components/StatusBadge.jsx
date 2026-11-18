import { STATUS } from '../lib/status';

export default function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.wishlist;
  return <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}