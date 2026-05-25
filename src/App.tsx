import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, Sparkles, Compass } from 'lucide-react';

import { useStore } from './store/useStore';
import { LandingPage } from './pages/LandingPage';
import { AuthPages } from './pages/AuthPages';
import { Dashboard } from './pages/Dashboard';
import { TripDetails } from './pages/TripDetails';

// Global Toasts Overlay Component
const ToastOverlay: React.FC = () => {
  const toasts = useStore((state) => state.toasts);
  const removeToast = useStore((state) => state.removeToast);

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-xl border glass-panel shadow-2xl flex items-start gap-3 pointer-events-auto cursor-pointer`}
            onClick={() => removeToast(toast.id)}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-450" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-xs font-semibold text-slate-250 leading-snug break-words">
                {toast.message}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Route Guard for Protected Pages
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useStore((state) => state.user);
  const isAuthLoading = useStore((state) => state.isAuthLoading);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <Compass className="w-10 h-10 animate-spin text-cyan-550" />
          <span>Restoring session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Handle Invite Join Redirect Link Route
const JoinRedirect: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const joinTripByCode = useStore((state) => state.joinTripByCode);
  const selectTrip = useStore((state) => state.selectTrip);
  const fetchUser = useStore((state) => state.fetchUser);

  useEffect(() => {
    const tryJoin = async () => {
      const activeUser = await fetchUser();
      if (!activeUser) {
        // User not logged in, send them to auth
        navigate('/auth');
        return;
      }

      if (inviteCode) {
        const vault = await joinTripByCode(inviteCode);
        if (vault) {
          await selectTrip(vault);
          navigate(`/trips/${vault.id}`);
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    };

    tryJoin();
  }, [inviteCode, navigate, joinTripByCode, selectTrip, fetchUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <Sparkles className="w-10 h-10 animate-spin text-cyan-550" />
        <span>Validating invite code and joining trip...</span>
      </div>
    </div>
  );
};

function App() {
  const fetchUser = useStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPages />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:vaultId"
            element={
              <ProtectedRoute>
                <TripDetails />
              </ProtectedRoute>
            }
          />
          <Route path="/join/:inviteCode" element={<JoinRedirect />} />
          
          {/* Catch all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Toast Alerts */}
        <ToastOverlay />
      </div>
    </Router>
  );
}

export default App;
