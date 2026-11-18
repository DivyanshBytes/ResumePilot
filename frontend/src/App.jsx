import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import AppLayout from './components/AppLayout';
import PrivateRoutes from './components/PrivateRoutes';
import { ProtectedRoute, PublicOnly } from './components/RouteGuards';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';

const PUBLIC_PATHS = ['/', '/login', '/register', '/verify'];

export default function App() {
  const location = useLocation();

  // Public pages are keyed by their path, so they cross-fade between each other.
  // The whole private area shares ONE key, so the sidebar never remounts.
  const groupKey = PUBLIC_PATHS.includes(location.pathname) ? location.pathname : 'app';

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={groupKey}>
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/login" element={<PublicOnly><PageTransition><Login /></PageTransition></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><PageTransition><Register /></PageTransition></PublicOnly>} />
        <Route path="/verify" element={<PublicOnly><PageTransition><VerifyOtp /></PageTransition></PublicOnly>} />

        {/* Everything else is the private app */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PrivateRoutes />
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}