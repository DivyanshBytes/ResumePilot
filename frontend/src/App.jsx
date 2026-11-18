import { Navigate, Route, Routes } from 'react-router-dom';
import PageTransition from './components/PageTransition';
import AppLayout from './components/AppLayout';
import { ProtectedRoute, PublicOnly } from './components/RouteGuards';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import Dashboard from './pages/Dashboard';
import Resumes from './pages/Resumes';
import Applications from './pages/Applications';
import NewApplication from './pages/NewApplication';
import ApplicationDetail from './pages/ApplicationDetail';

export default function App() {
  return (
    <Routes>
      {/* Public pages. The key makes each page replay its entrance animation */}
      <Route path="/" element={<PageTransition key="landing"><Landing /></PageTransition>} />
      <Route path="/login" element={<PublicOnly><PageTransition key="login"><Login /></PageTransition></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><PageTransition key="register"><Register /></PageTransition></PublicOnly>} />
      <Route path="/verify" element={<PublicOnly><PageTransition key="verify"><VerifyOtp /></PageTransition></PublicOnly>} />

      {/* Private pages share one sidebar layout */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resumes" element={<Resumes />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/applications/new" element={<NewApplication />} />
        <Route path="/applications/:id" element={<ApplicationDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}