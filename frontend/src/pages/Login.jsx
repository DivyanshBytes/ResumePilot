import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/api';
import AuthLayout from '../components/AuthLayout';
import Field from '../components/Field';
import Button from '../components/Button';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Enter your password';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back!');
      // PublicOnly sends logged-in users to the dashboard automatically
    } catch (err) {
      if (err?.response?.status === 403) {
        // Account exists but the email was never verified: send them to the OTP screen
        toast('Please verify your email first');
        navigate('/verify', { state: { email: form.email.trim().toLowerCase(), autoResend: true } });
      } else {
        toast.error(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue to your dashboard."
      footer={<>New here? <Link to="/register" className="font-semibold text-indigo-500 hover:underline">Create an account</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <Field label="Email" icon={Mail} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
        <Field label="Password" icon={Lock} type="password" placeholder="Your password" value={form.password} onChange={set('password')} error={errors.password} autoComplete="current-password" />
        <Button type="submit" loading={loading} className="w-full">
          Log in <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthLayout>
  );
}