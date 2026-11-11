import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Shield,
  GraduationCap,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Lock,
  Mail,
  User,
  Key,
  Sparkles,
} from 'lucide-react';

export const DemoLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithCredentials, loginAsAdmin, loginAsFaculty } = useAuth();

  const [activeTab, setActiveTab] = useState<'google' | 'superadmin' | 'faculty' | 'password'>('google');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Sign-In state
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // First-time Google Onboarding Modal State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    email: '',
    name: '',
    rollNumber: '',
    department: 'AI&DS',
    yearOfStudy: '3rd Year',
    leetcodeUsername: '',
  });

  // Admin / Faculty direct login
  const [adminEmail, setAdminEmail] = useState('admin@bitsathy.ac.in');
  const [adminPassword, setAdminPassword] = useState('Admin@123');

  const handleGoogleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const targetEmail = googleEmail.trim().toLowerCase();
    if (!targetEmail) {
      setError('Please enter your @bitsathy.ac.in institutional email.');
      return;
    }

    if (!targetEmail.endsWith('@bitsathy.ac.in')) {
      setError('Access Denied: Only institutional accounts ending in @bitsathy.ac.in are permitted.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithGoogle({
        email: targetEmail,
        name: googleName || targetEmail.split('@')[0],
      });

      if (result.needsProfileCompletion) {
        setOnboardingData({
          email: targetEmail,
          name: googleName || targetEmail.split('@')[0],
          rollNumber: result.suggestedRoll || '',
          department: 'AI&DS',
          yearOfStudy: '3rd Year',
          leetcodeUsername: '',
        });
        setShowOnboarding(true);
      } else {
        navigate('/my-analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGoogleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!onboardingData.rollNumber || !onboardingData.leetcodeUsername) {
      setError('Please provide your Roll Number and LeetCode handle to link your account.');
      return;
    }

    setLoading(true);
    try {
      await loginWithGoogle({
        email: onboardingData.email,
        name: onboardingData.name,
        rollNumber: onboardingData.rollNumber,
        department: onboardingData.department,
        yearOfStudy: onboardingData.yearOfStudy,
        leetcodeUsername: onboardingData.leetcodeUsername,
      });

      setShowOnboarding(false);
      navigate('/my-analytics');
    } catch (err: any) {
      setError(err.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginWithCredentials(adminEmail, adminPassword);
      if (user.role === 'SUPER_ADMIN') {
        navigate('/super-admin');
      } else if (user.role === 'FACULTY') {
        navigate('/faculty-portal');
      } else {
        navigate('/my-analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="text-center max-w-md mb-6">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-600/30">
          <Activity className="w-7 h-7 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          CodePulse Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Bannari Amman Institute of Technology &bull; Single Sign-On Portal
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-card">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('google'); setError(''); }}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Google Sign-In</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('superadmin'); setError(''); }}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'superadmin'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Super Admin</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('faculty'); setError(''); }}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'faculty'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Faculty</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* PRIMARY TAB: GOOGLE SIGN-IN (@bitsathy.ac.in) */}
        {/* ======================================================== */}
        {activeTab === 'google' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <span className="text-xs font-bold text-blue-950 dark:text-blue-200 block">
                  Institutional Single Sign-On Active
                </span>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                  No separate password needed. Sign in directly with your official <strong>@bitsathy.ac.in</strong> Google Workspace account.
                </p>
              </div>
            </div>

            <form onSubmit={handleGoogleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Institutional Google Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="e.g. mohammedsahtiqs.ad24@bitsathy.ac.in"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Full Name (as on College ID)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. MOHAMMED SAHTIQ S"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Official Google Button Style */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-semibold text-sm border border-slate-300 dark:border-slate-700 shadow-sm transition-all flex items-center justify-center gap-3 group"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google (@bitsathy.ac.in)</span>
                <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>

            {/* Quick Demo Pre-fills */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block mb-2">Instant One-Click Login Demo:</span>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setGoogleEmail('mohammedsahtiqs.ad24@bitsathy.ac.in');
                    setGoogleName('MOHAMMED SAHTIQ S');
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  MOHAMMED SAHTIQ S
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGoogleEmail('7376221cs101@bitsathy.ac.in');
                    setGoogleName('Aarav Sharma');
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Aarav Sharma (CSE)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUPER ADMIN TAB */}
        {/* ======================================================== */}
        {activeTab === 'superadmin' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                  Super Administrator Access
                </span>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  Full control: Add students with Roll Numbers, manage faculty permissions, automated nightly sync, and problem history export.
                </p>
              </div>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Enter Super Admin Command Center</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* FACULTY TAB */}
        {/* ======================================================== */}
        {activeTab === 'faculty' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                  Faculty Department Portal
                </span>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                  Access granted by Super Admin to view department students and export problem reports.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  loginAsFaculty('CSE');
                  navigate('/faculty-portal');
                }}
                className="w-full p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/60 transition-all flex items-center justify-between text-left"
              >
                <div>
                  <span className="text-sm font-bold text-indigo-950 dark:text-indigo-200 block">
                    Dr. K. Senthil Nathan (CSE)
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Department of Computer Science & Engineering
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-600" />
              </button>

              <button
                type="button"
                onClick={() => {
                  loginAsFaculty('AI&DS');
                  navigate('/faculty-portal');
                }}
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-between text-left"
              >
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    Dr. M. Sangeetha (AI&DS)
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Department of Artificial Intelligence & Data Science
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* FIRST-TIME GOOGLE ONBOARDING MODAL */}
      {/* ======================================================== */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Link Academic Information
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  First-time Google Sign-In setup for {onboardingData.email}
                </p>
              </div>
            </div>

            <form onSubmit={handleCompleteGoogleOnboarding} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Roll Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7376242AD219"
                  value={onboardingData.rollNumber}
                  onChange={(e) =>
                    setOnboardingData({ ...onboardingData, rollNumber: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  LeetCode Profile Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ffPkHQwoN1"
                  value={onboardingData.leetcodeUsername}
                  onChange={(e) =>
                    setOnboardingData({ ...onboardingData, leetcodeUsername: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Daily problem history and analytics will be tracked from this profile.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={onboardingData.department}
                    onChange={(e) =>
                      setOnboardingData({ ...onboardingData, department: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="AI&DS">AI&DS</option>
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Year of Study
                  </label>
                  <select
                    value={onboardingData.yearOfStudy}
                    onChange={(e) =>
                      setOnboardingData({ ...onboardingData, yearOfStudy: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOnboarding(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-600/30"
                >
                  Finish & Enter Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
