import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Building,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../../types';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    login,
    signup,
    forgotPassword,
    resetPassword,
    enterDemoMode
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState<UserRole>('manager');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (authModalMode === 'login') {
        if (!email.trim() || !password.trim()) {
          setErrorMessage('Please enter both email and password.');
          setIsSubmitting(false);
          return;
        }
        const success = await login(email.trim(), password.trim());
        if (success) {
          closeAuthModal();
        } else {
          setErrorMessage('Invalid email or password. Please try again.');
        }
      } else if (authModalMode === 'signup') {
        if (!name.trim() || !email.trim() || !password.trim()) {
          setErrorMessage('Please fill in all required fields.');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters.');
          setIsSubmitting(false);
          return;
        }
        const success = await signup(
          name.trim(),
          email.trim(),
          password.trim(),
          role,
          company.trim() || 'My Enterprise'
        );
        if (success) {
          closeAuthModal();
        } else {
          setErrorMessage('Registration failed. Email may already be registered.');
        }
      } else if (authModalMode === 'forgot_password') {
        if (!email.trim()) {
          setErrorMessage('Please enter your account email.');
          setIsSubmitting(false);
          return;
        }
        const res = await forgotPassword(email.trim());
        if (res.success) {
          setSuccessMessage(res.message);
          if (res.resetCode) {
            setResetCode(res.resetCode);
          }
        } else {
          setErrorMessage(res.message || 'Failed to send recovery code.');
        }
      } else if (authModalMode === 'reset_password') {
        if (!email.trim() || !resetCode.trim() || !newPassword.trim()) {
          setErrorMessage('Please complete all reset fields.');
          setIsSubmitting(false);
          return;
        }
        const success = await resetPassword(email.trim(), resetCode.trim(), newPassword.trim());
        if (success) {
          setSuccessMessage('Password reset successfully! Please log in.');
          setAuthModalMode('login');
        } else {
          setErrorMessage('Invalid recovery code or email.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLaunch = () => {
    enterDemoMode();
    closeAuthModal();
  };

  const fillQuickCredentials = (demoEmail: string, demoPass: string, demoRole: UserRole) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setRole(demoRole);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-[#080808] border border-white/20 shadow-2xl overflow-hidden my-6"
      >
        {/* Brand Banner */}
        <div className="p-6 bg-gradient-to-b from-white/[0.06] to-transparent border-b border-white/10 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white text-black flex items-center justify-center font-black text-sm tracking-tighter border border-white">
                <span className="font-display font-black text-base">TP</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-base uppercase tracking-tighter text-white">
                    TEAM PILOT AI
                  </span>
                  <span className="bg-[#FF3D00] text-black font-black text-[9px] px-1.5 py-0.2 uppercase tracking-widest">
                    ENTERPRISE
                  </span>
                </div>
                <p className="text-[9px] uppercase tracking-widest text-white/50 font-semibold">
                  Secure Workspace Authentication
                </p>
              </div>
            </div>
            <button
              onClick={closeAuthModal}
              className="p-1.5 text-white/50 hover:text-white border border-white/10 hover:border-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 mt-6 p-1 bg-black border border-white/10">
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 text-[10px] uppercase font-black tracking-wider transition cursor-pointer ${
                authModalMode === 'login'
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 text-[10px] uppercase font-black tracking-wider transition cursor-pointer ${
                authModalMode === 'signup'
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('forgot_password');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-1.5 px-2 text-[10px] uppercase font-black tracking-wider transition cursor-pointer ${
                authModalMode === 'forgot_password' || authModalMode === 'reset_password'
                  ? 'bg-white text-black'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-[#FF3D00]/10 border border-[#FF3D00]/40 text-[#FF3D00] text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-white/10 border border-white/40 text-white text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#FF3D00] shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Signup Specific Fields */}
          {authModalMode === 'signup' && (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-white/30" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    className="w-full pl-9 pr-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs placeholder:text-white/30 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                  Company / Team Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-2.5 text-white/30" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Tech Labs"
                    className="w-full pl-9 pr-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs placeholder:text-white/30 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1.5">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('manager')}
                    className={`p-2.5 border text-left transition cursor-pointer ${
                      role === 'manager'
                        ? 'border-[#FF3D00] bg-white/[0.04]'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase">Manager</span>
                      {role === 'manager' && <span className="w-2 h-2 bg-[#FF3D00]"></span>}
                    </div>
                    <p className="text-[9px] text-white/40 mt-0.5">Planning & team oversight</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('team_member')}
                    className={`p-2.5 border text-left transition cursor-pointer ${
                      role === 'team_member'
                        ? 'border-[#FF3D00] bg-white/[0.04]'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase">Employee</span>
                      {role === 'team_member' && <span className="w-2 h-2 bg-[#FF3D00]"></span>}
                    </div>
                    <p className="text-[9px] text-white/40 mt-0.5">Tasks & personal AI assistant</p>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Email field */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-white/30" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-9 pr-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs placeholder:text-white/30 outline-none"
              />
            </div>
          </div>

          {/* Password field for Login & Signup */}
          {(authModalMode === 'login' || authModalMode === 'signup') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] uppercase tracking-widest font-black text-white/60">
                  Password *
                </label>
                {authModalMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setAuthModalMode('forgot_password')}
                    className="text-[9px] uppercase tracking-wider text-white/40 hover:text-white font-bold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-white/30" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs placeholder:text-white/30 outline-none"
                />
              </div>
            </div>
          )}

          {/* Reset Password Specific Fields */}
          {authModalMode === 'reset_password' && (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                  Recovery Code *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-white/30" />
                  <input
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Enter 6-digit recovery code"
                    className="w-full pl-9 pr-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs font-mono placeholder:text-white/30 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-white/30" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs placeholder:text-white/30 outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-black hover:bg-[#FF3D00] hover:text-black text-xs uppercase font-black tracking-wider transition cursor-pointer active:scale-95 disabled:opacity-50 mt-4"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <span>
                  {authModalMode === 'login' && 'Sign In to Workspace'}
                  {authModalMode === 'signup' && 'Create Isolated Workspace'}
                  {authModalMode === 'forgot_password' && 'Send Recovery Code'}
                  {authModalMode === 'reset_password' && 'Reset Password'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* Quick Demo Credentials for Evaluation */}
          {authModalMode === 'login' && (
            <div className="pt-4 border-t border-white/10">
              <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold mb-2 text-center">
                Quick Demo Accounts (1-Click Fill)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillQuickCredentials('manager@teampilot.ai', 'password123', 'manager')}
                  className="p-2 border border-white/10 bg-white/[0.02] hover:border-white/40 text-left transition cursor-pointer"
                >
                  <p className="text-[10px] font-bold text-white uppercase">Manager Account</p>
                  <p className="text-[9px] text-white/40 font-mono truncate">manager@teampilot.ai</p>
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickCredentials('employee@teampilot.ai', 'password123', 'team_member')}
                  className="p-2 border border-white/10 bg-white/[0.02] hover:border-white/40 text-left transition cursor-pointer"
                >
                  <p className="text-[10px] font-bold text-white uppercase">Employee Account</p>
                  <p className="text-[9px] text-white/40 font-mono truncate">employee@teampilot.ai</p>
                </button>
              </div>
            </div>
          )}

          {/* Explore Demo Preview button */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleDemoLaunch}
              className="inline-flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-widest text-white/50 hover:text-[#FF3D00] transition cursor-pointer"
            >
              <Zap className="w-3 h-3 text-[#FF3D00]" />
              <span>Or explore in Demo Preview Mode</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
