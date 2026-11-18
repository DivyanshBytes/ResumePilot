import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Dashboard from '../pages/Dashboard';
import Resumes from '../pages/Resumes';
import Applications from '../pages/Applications';
import NewApplication from '../pages/NewApplication';
import ApplicationDetail from '../pages/ApplicationDetail';

export default function PrivateRoutes() {
  const location = useLocation();

  // Every new page starts at the top
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  return (
    // mode="wait": the old page finishes fading out before the new one fades in
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        {/* Passing `location` freezes the OLD page while it fades out */}
        <Routes location={location}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="resumes" element={<Resumes />} />
          <Route path="applications" element={<Applications />} />
          <Route path="applications/new" element={<NewApplication />} />
          <Route path="applications/:id" element={<ApplicationDetail />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}