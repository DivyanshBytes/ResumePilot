import { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

export default function CountUp({ value = 0, suffix = '' }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, { duration: 1, ease: 'easeOut', onUpdate: (v) => setN(Math.round(v)) });
    return () => controls.stop();
  }, [value]);

  return <>{n}{suffix}</>;
}