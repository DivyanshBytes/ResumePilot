import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/api';
import AuthLayout from '../components/AuthLayout';
import OtpInput from '../components/OtpInput';
import Button from '../components/Button';

export default function VerifyOtp() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();
  const email = state?.email;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [cooldown, setCooldown] = useState(30); // seconds before "Resend" works
  const autoSent = useRef(false);

  // Coming from a blocked login: request a fresh code once (ref guards React's double effect in dev)
  useEffect(() => {
    if (!email || !state?.autoResend || autoSent.current) return;
    autoSent.current = true;
    resendOtp(email)
      .then(() => toast.success('A new code is on its way'))
      .catch((err) => toast.error(getErrorMessage(err)));
  }, [email, state, resendOtp]);

  // Countdown for the resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!email) return <Navigate to="/register" replace />; // opened /verify directly

  const submit = async (value = code) => {
    if (value.length !== 6 || loading) return;
    setLoading(true);
    try {
      await verifyOtp(email, value);
      toast.success('Email verified. Welcome to ResumePilot!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setShakeKey((k) => k + 1); // shake the boxes
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    try {
      await resendOtp(email);
      toast.success('New code sent. Check your inbox.');
      setCode('');
      setCooldown(30);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <AuthLayout
      title="Check your email"
      subtitle={<>We sent a 6-digit code to <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>. It expires in 10 minutes.</>}
      footer={<Link to="/register" className="font-semibold text-indigo-500 hover:underline">Use a different email</Link>}
    >
      <div className="space-y-6">
        <OtpInput value={code} onChange={setCode} onComplete={submit} disabled={loading} shakeKey={shakeKey} />
        <Button onClick={() => submit()} loading={loading} disabled={code.length !== 6} className="w-full">
          <ShieldCheck className="h-4 w-4" /> Verify email
        </Button>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Did not get it?{' '}
          <button
            onClick={resend}
            disabled={cooldown > 0}
            className="font-semibold text-indigo-500 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}