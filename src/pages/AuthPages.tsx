import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Mail, Lock, User, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import { insforge } from '../lib/insforge';
import { useStore } from '../store/useStore';

export const AuthPages: React.FC = () => {
  const navigate = useNavigate();
  const fetchUser = useStore((state) => state.fetchUser);
  const addToast = useStore((state) => state.addToast);
  const user = useStore((state) => state.user);

  const [mode, setMode] = useState<'signin' | 'signup' | 'verify' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const { data, error } = await insforge.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('email not verified') || error.message.includes('verify')) {
          setMode('verify');
          addToast('Please enter the 6-digit verification code sent to your email', 'info');
        } else {
          addToast(error.message, 'error');
        }
      } else if (data?.accessToken) {
        addToast('Signed in successfully!', 'success');
        await fetchUser();
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown sign-in error';
      addToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;

    setIsLoading(true);
    try {
      const { data, error } = await insforge.auth.signUp({
        email,
        password,
        name,
        // Passing a dummy redirection endpoint; code OTP is default verification route
        redirectTo: window.location.origin + '/auth',
      });

      if (error) {
        addToast(error.message, 'error');
      } else if (data?.requireEmailVerification) {
        setMode('verify');
        addToast('Verification code sent to your email!', 'success');
      } else if (data?.accessToken) {
        addToast('Signed up and authenticated successfully!', 'success');
        await fetchUser();
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown registration error';
      addToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) return;

    setIsLoading(true);
    try {
      const { data, error } = await insforge.auth.verifyEmail({
        email,
        otp: otp.trim(),
      });

      if (error) {
        addToast(error.message, 'error');
      } else if (data) {
        addToast('Email verified successfully! Welcome to TripNest!', 'success');
        await fetchUser();
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown verification error';
      addToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    try {
      const { error } = await insforge.auth.resendVerificationEmail({
        email,
        redirectTo: window.location.origin + '/auth',
      });
      if (error) throw error;
      addToast('A new 6-digit code has been sent!', 'success');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown resend error';
      addToast(errorMsg, 'error');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background flares */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-violet-600/10 blur-[110px] rounded-full pointer-events-none" />

      {/* Main card panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl glass-panel p-8 shadow-2xl relative"
      >
        {/* Brand logo header */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div
            onClick={() => navigate('/')}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-3 cursor-pointer"
          >
            <Compass className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-extrabold text-2xl tracking-tight text-slate-100">
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'signup' && 'Create TripNest Account'}
            {mode === 'verify' && 'Verify Email Address'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-450 mt-1">
            {mode === 'signin' && 'Relive and share travel memories with friends'}
            {mode === 'signup' && 'Start organizing collaborative trip folders'}
            {mode === 'verify' && `We sent a 6-digit code to ${email}`}
            {mode === 'forgot' && 'Enter your email to receive recovery instructions'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'signin' && (
            <motion.form
              key="signin"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleSignIn}
              className="space-y-4"
            >
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-bold text-slate-450 tracking-wider uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full glass-input pl-10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-450 tracking-wider uppercase">Password</label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full glass-input pl-10 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-550 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full glass-btn-primary py-2.5 font-bold tracking-wide mt-2"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="text-center text-xs text-slate-500 pt-2">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </motion.form>
          )}

          {mode === 'signup' && (
            <motion.form
              key="signup"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleSignUp}
              className="space-y-4"
            >
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-bold text-slate-450 tracking-wider uppercase">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full glass-input pl-10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-bold text-slate-450 tracking-wider uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full glass-input pl-10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-bold text-slate-450 tracking-wider uppercase">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full glass-input pl-10 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-550 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full glass-btn-primary py-2.5 font-bold tracking-wide mt-2"
              >
                {isLoading ? 'Registering...' : 'Create Account'}
              </button>

              <div className="text-center text-xs text-slate-500 pt-2">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  Sign In
                </button>
              </div>
            </motion.form>
          )}

          {mode === 'verify' && (
            <motion.form
              key="verify"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleVerifyOtp}
              className="space-y-4"
            >
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-bold text-slate-450 tracking-wider uppercase">Verification OTP</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full glass-input pl-10 text-sm text-center tracking-[0.25em] font-extrabold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.trim().length !== 6}
                className="w-full glass-btn-primary py-2.5 font-bold tracking-wide mt-2"
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-550 pt-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-cyan-450 hover:text-cyan-350 font-semibold transition-colors"
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign Up
                </button>
              </div>
            </motion.form>
          )}

          {mode === 'forgot' && (
            <motion.form
              key="forgot"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={async (e) => {
                e.preventDefault();
                addToast('Password reset feature (Sandbox simulation link)', 'info');
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-bold text-slate-450 tracking-wider uppercase">Account Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full glass-input pl-10 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full glass-btn-primary py-2.5 font-bold tracking-wide mt-2"
              >
                Send Recovery Instructions
              </button>

              <button
                type="button"
                onClick={() => setMode('signin')}
                className="w-full glass-btn text-xs mt-1 py-2 text-slate-405"
              >
                Back to Sign In
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
