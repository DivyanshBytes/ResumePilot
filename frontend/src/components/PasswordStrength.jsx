const score = (p) => {
  let s = 0;
  if (p.length >= 6) s++;
  if (p.length >= 10) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return s;
};

const LEVELS = [
  { label: 'Too short', bar: 'bg-slate-300 dark:bg-white/20' },
  { label: 'Weak', bar: 'bg-rose-500' },
  { label: 'Okay', bar: 'bg-amber-500' },
  { label: 'Good', bar: 'bg-lime-500' },
  { label: 'Strong', bar: 'bg-emerald-500' },
];

export default function PasswordStrength({ password }) {
  if (!password) return null;
  const s = score(password);
  const level = LEVELS[s];
  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${i <= s ? level.bar : ''}`}
              style={{ width: i <= s ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{level.label}</p>
    </div>
  );
}