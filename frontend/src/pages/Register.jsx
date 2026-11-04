import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/api';
import AuthLayout from '../components/AuthLayout';
import Field from '../components/Field';
import Button from '../components/Button';
import PasswordStrength from '../components/PasswordStrength';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: '' })); // clear the error as they type
  };

  // Quick checks in the browser; the server still validates everything again
  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Please enter your name';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (form.password.length < 6) next.password = 'Use at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await register(form.name.trim(), form.email.trim(), form.password);
      toast.success(data.message || 'Verification code sent');
      navigate('/verify', { state: { email: data.email } });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tailoring resumes in minutes."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-indigo-500 hover:underline">Log in</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <Field label="Full name" icon={User} placeholder="Your name" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
        <Field label="Email" icon={Mail} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
        <div>
          <Field label="Password" icon={Lock} type="password" placeholder="At least 6 characters" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
          <PasswordStrength password={form.password} />
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Create account <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthLayout>
  );
}