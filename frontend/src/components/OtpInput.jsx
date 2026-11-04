import { useEffect, useRef } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

// Six boxes that behave like one field: auto-advance, backspace, and paste support.
// Digits always fill left to right, so the value can never have gaps.
export default function OtpInput({ value, onChange, onComplete, disabled, shakeKey }) {
  const refs = useRef([]);
  const controls = useAnimationControls();

  const focusAt = (n) => refs.current[Math.min(n, 5)]?.focus();

  // Shake the boxes whenever the parent bumps shakeKey (wrong code)
  useEffect(() => {
    if (shakeKey) controls.start({ x: [0, -10, 10, -8, 8, 0], transition: { duration: 0.4 } });
  }, [shakeKey, controls]);

  const handleChange = (e) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    if (!digit || value.length >= 6) return;
    const next = value + digit;
    onChange(next);
    focusAt(next.length);
    if (next.length === 6) onComplete?.(next);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (!value.length) return;
      const next = value.slice(0, -1);
      onChange(next);
      focusAt(next.length);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    onChange(text);
    focusAt(text.length);
    if (text.length === 6) onComplete?.(text);
  };

  return (
    <motion.div animate={controls} className="flex justify-between gap-2 sm:gap-3">
      {Array.from({ length: 6 }, (_, i) => (
        <motion.input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={value[i] || ''}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => focusAt(value.length)}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1}`}
          animate={{ scale: value[i] ? 1.06 : 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          className={`h-14 w-full min-w-0 rounded-xl border bg-white/80 text-center text-xl font-bold outline-none transition dark:bg-white/5 ${
            value[i]
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300'
              : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-white/10'
          }`}
        />
      ))}
    </motion.div>
  );
}