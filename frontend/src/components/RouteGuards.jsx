import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const FullScreenLoader = () => (
  <div className="grid min-h-screen place-items-center">
    <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 1.6 }}>
      <Logo />
    </motion.div>
  </div>
);

// Only logged-in users get through; everyone else goes to /login
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return user ? children : <Navigate to="/login" replace />;
}

// Login/signup pages are for logged-out users; logged-in users go to the dashboard
export function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return user ? <Navigate to="/dashboard" replace /> : children;
}