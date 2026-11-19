import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

// A thin bar that sweeps across the top whenever you navigate
export default function RouteProgress() {
  const { pathname } = useLocation();
  const [run, setRun] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; } // not on the first page load
    setRun((n) => n + 1);
  }, [pathname]);

  if (run === 0) return null;
  return (
    <motion.div
      key={run}
      aria-hidden
      initial={{ scaleX: 0, opacity: 1 }}
      animate={{ scaleX: 1, opacity: [1, 1, 0] }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      style={{ transformOrigin: 'left' }}
      className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-brand-500"
    />
  );
}