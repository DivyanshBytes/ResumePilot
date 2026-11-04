export default function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 19L19 5" />
          <path d="M9 5h10v10" />
        </svg>
      </div>
      <span className="text-lg font-extrabold tracking-tight">
        Resume<span className="text-gradient">Pilot</span>
      </span>
    </div>
  );
}