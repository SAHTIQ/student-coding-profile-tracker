import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStudentData } from '../context/StudentDataContext';
import { extractLeetCodeUsername } from '../utils/metricCalculations';
import {
  Activity,
  Shield,
  GraduationCap,
  ArrowRight,
  Info,
  CheckCircle2,
  Code2,
  UserPlus,
} from 'lucide-react';

export const DemoLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsAdmin, loginAsStudent } = useAuth();
  const { students, createStudent } = useStudentData();

  const [selectedStudentId, setSelectedStudentId] = useState(
    students[0]?.id || ''
  );
  const [directUsername, setDirectUsername] = useState('');
  const [isAddingDirect, setIsAddingDirect] = useState(false);
  const [directError, setDirectError] = useState('');

  const handleAdminLogin = () => {
    loginAsAdmin();
    navigate('/admin-overview');
  };

  const handleStudentLogin = async () => {
    if (students.length > 0 && selectedStudentId) {
      const target = students.find((s) => s.id === selectedStudentId) || students[0];
      loginAsStudent(target.id, target.leetcodeUsername, target.displayName);
      navigate('/my-analytics');
      return;
    }

    // If no students yet or user typed a handle directly
    const cleanUser = extractLeetCodeUsername(directUsername);
    if (!cleanUser) {
      setDirectError('Please enter a LeetCode username or profile link.');
      return;
    }

    setIsAddingDirect(true);
    setDirectError('');
    try {
      const newStudent = await createStudent({
        leetcodeUsername: cleanUser,
        displayName: cleanUser,
        role: 'student',
      });
      loginAsStudent(newStudent.id, newStudent.leetcodeUsername, newStudent.displayName);
      navigate('/my-analytics');
    } catch (err: any) {
      setDirectError(err.message || 'Failed to scrape profile.');
      setIsAddingDirect(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="text-center max-w-md mb-8">
        <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/30">
          <Activity className="w-7 h-7 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          CodePulse
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          LeetCode Productivity & Live Behavioral Analytics Platform
        </p>
      </div>

      {/* Real Data Notice Banner */}
      <div className="max-w-md w-full mb-6 p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Live LeetCode GraphQL Scraper Active:</strong> Zero mock profiles. Enter as <strong>Super Admin</strong> to add and sync real student profiles by username or LeetCode URL, or sign in directly below.
        </p>
      </div>

      {/* Role Selection Cards Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl w-full">
        {/* Super Admin Option */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-card hover:border-brand-500/50 hover:shadow-lg transition-all flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 w-fit mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Super Admin</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold">
                FULL ACCESS
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Platform-wide cohort KPIs, student roster management, batch live synchronization, and cross-cohort comparisons.
            </p>

            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 mt-5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Overall cohort progress & heatmap</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Add real LeetCode handles or profile URLs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Live GraphQL scraping with zero fake data</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleAdminLogin}
            className="w-full mt-6 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Enter as Super Admin</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Student Option */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-card hover:border-brand-500/50 hover:shadow-lg transition-all flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 w-fit mb-4">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Student Workspace</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold">
                PERSONAL
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Personal problem-solving trends, activity heatmaps, contest analytics, behavioral insights, future forecasting, and read-only peer comparisons.
            </p>

            {/* Select existing student or input username */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              {students.length > 0 ? (
                <>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Select Registered Student:
                  </label>
                  <select
                    value={selectedStudentId || students[0]?.id}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.displayName} (@{s.leetcodeUsername})
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Enter Your LeetCode Username or URL:
                  </label>
                  <input
                    type="text"
                    value={directUsername}
                    onChange={(e) => {
                      setDirectUsername(e.target.value);
                      setDirectError('');
                    }}
                    placeholder="e.g. lee215 or https://leetcode.com/u/neal_wu/"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                  {directError && (
                    <p className="text-[11px] text-rose-600">{directError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleStudentLogin}
            disabled={isAddingDirect}
            className="w-full mt-6 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isAddingDirect ? (
              <span>Scraping LeetCode...</span>
            ) : (
              <>
                <span>Enter Student Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center mt-10 text-xs text-slate-400 font-mono flex items-center gap-2">
        <Code2 className="w-4 h-4 text-slate-400" />
        <span>CodePulse Analytics • Live LeetCode Public GraphQL Integration</span>
      </div>
    </div>
  );
};
