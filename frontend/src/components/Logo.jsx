export default function Logo({ className = '', tone = 'default' }) {
  const light = tone === 'light'; // for use on the dark green panel
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`grid h-9 w-9 place-items-center rounded-lg ${
          light ? 'bg-white text-brand-900' : 'bg-brand-700 text-white dark:bg-brand-400 dark:text-brand-950'
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 19L19 5" />
          <path d="M9 5h10v10" />
        </svg>
      </div>
      <span className={`font-display text-xl font-semibold tracking-tight ${light ? 'text-white' : ''}`}>
        Resume<span className={light ? 'text-brand-300' : 'text-brand-600 dark:text-brand-400'}>Pilot</span>
      </span>
    </div>
  );
}