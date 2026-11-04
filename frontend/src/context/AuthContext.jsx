import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check "am I already logged in?"

  // On every page load, ask the backend who we are (the cookie answers for us)
  useEffect(() => {
    let active = true;
    api.get('/auth/me')
      .then(({ data }) => active && setUser(data.user))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.user);
  }, []);

  const register = useCallback(
    (name, email, password) => api.post('/auth/register', { name, email, password }).then((r) => r.data),
    []
  );

  const verifyOtp = useCallback(async (email, otp) => {
    const { data } = await api.post('/auth/verify-otp', { email, otp });
    setUser(data.user);
  }, []);

  const resendOtp = useCallback((email) => api.post('/auth/resend-otp', { email }).then((r) => r.data), []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } finally { setUser(null); }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, verifyOtp, resendOtp, logout }),
    [user, loading, login, register, verifyOtp, resendOtp, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);