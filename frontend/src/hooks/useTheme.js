import { useEffect, useState } from 'react';

export default function useTheme() {
  // The inline script in index.html already set the class, so we just read it
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* storage blocked */ }
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}