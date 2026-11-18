import { useEffect, useState } from 'react';

// Advances 0 -> 1 -> 2 ... on a timer while `running`, and stops at the last step.
// The real request decides when we are done; this only shows the stages.
export default function useFakeProgress(running, count, intervalMs = 2500) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!running) { setStep(0); return undefined; }
    const id = setInterval(() => setStep((s) => Math.min(s + 1, count - 1)), intervalMs);
    return () => clearInterval(id);
  }, [running, count, intervalMs]);

  return step;
}