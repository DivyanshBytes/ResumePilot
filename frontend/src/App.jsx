import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import { ProtectedRoute, PublicOnly } from './components/RouteGuards';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import Dashboard from './pages/Dashboard';

export default function App() {
  const location = useLocation();

  return (
    // mode="wait": the old page fades out before the new one fades in
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/login" element={<PublicOnly><PageTransition><Login /></PageTransition></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><PageTransition><Register /></PageTransition></PublicOnly>} />
        <Route path="/verify" element={<PublicOnly><PageTransition><VerifyOtp /></PageTransition></PublicOnly>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}