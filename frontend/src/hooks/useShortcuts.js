import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Press "g", then a letter (like GitHub): g d = dashboard, g b = board...
const GO = { d: '/dashboard', r: '/resumes', a: '/applications', b: '/board', i: '/insights', n: '/applications/new' };

const isTyping = (el) =>
  el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

export default function useShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    let armed = false;
    let timer;

    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      const key = e.key.toLowerCase();

      if (!armed) {
        if (key === 'g') {
          armed = true;
          clearTimeout(timer);
          timer = setTimeout(() => { armed = false; }, 1200); // the second key must follow quickly
        }
        return;
      }

      armed = false;
      clearTimeout(timer);
      if (GO[key]) {
        e.preventDefault();
        navigate(GO[key]);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(timer); };
  }, [navigate]);
}