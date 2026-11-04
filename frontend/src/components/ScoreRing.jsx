import { useEffect, useState } from 'react';
import { animate, motion } from 'framer-motion';

const tone = (v) =>
  v >= 75 ? { color: '#10b981', cls: 'text-emerald-500' }
  : v >= 50 ? { color: '#f59e0b', cls: 'text-amber-500' }
  : { color: '#f43f5e', cls: 'text-rose-500' };

export default function ScoreRing({ value = 0, size = 160, stroke = 12, delay = 0.3, showLabel = true }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const [shown, setShown] = useState(0);

  // Count the number up while the ring fills
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.6,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, delay]);

  const t = tone(shown); // colour shifts red -> amber -> green as it fills

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke}
          className="stroke-slate-200 dark:stroke-white/10" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke}
          strokeLinecap="round" stroke={t.color} strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - value / 100) }}
          transition={{ duration: 1.6, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-extrabold leading-none tabular-nums ${t.cls}`} style={{ fontSize: size * 0.3 }}>
          {shown}
        </span>
        {showLabel && (
          <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            ATS score
          </span>
        )}
      </div>
    </div>
  );
}