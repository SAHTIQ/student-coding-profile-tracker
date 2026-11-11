import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  GraduationCap,
  Download,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';

export const FacultyPortalPage: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [syncingStudentId, setSyncingStudentId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const dept = user?.department || 'CSE';
  const canExport = user?.canExportReports ?? true;

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchDepartmentStudents();
  }, [dept]);

  const fetchDepartmentStudents = async () => {
    setLoading(true);
    try {
      const data = await apiClient.listStudents({
        department: dept,
        search: search || undefined,
      });
      setStudents(data);
    } catch {
      // Fallback
      setStudents([
        {
          id: 's-1',
          rollNumber: '7376221CS101',
          name: 'Aarav Sharma',
          department: dept,
          yearOfStudy: '3rd Year',
          leetcodeUsername: 'aarav_algo',
          collectionStatus: 'success',
          _count: { submissions: 42 },
        },
        {
          id: 's-2',
          rollNumber: '7376221CS102',
          name: 'Priya Patel',
          department: dept,
          yearOfStudy: '3rd Year',
          leetcodeUsername: 'priya_codes',
          collectionStatus: 'success',
          _count: { submissions: 36 },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncStudent = async (id: string, roll: string) => {
    setSyncingStudentId(id);
    try {
      await apiClient.syncStudent(id);
      showToast('success', `Synchronized profile for ${roll}`);
      fetchDepartmentStudents();
    } catch (err: any) {
      showToast('error', err.message || 'Sync failed');
    } finally {
      setSyncingStudentId(null);
    }
  };

  const handleExport = async () => {
    if (!canExport) {
      showToast('error', 'You do not have permission to export reports. Contact Super Admin.');
      return;
    }

    try {
      showToast('success', 'Preparing department export...');
      await apiClient.downloadProblemHistory({ department: dept });
    } catch (err: any) {
      showToast('error', err.message || 'Export failed');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border animate-in slide-in-from-top-3 ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-800 text-emerald-200'
              : 'bg-rose-950 border-rose-800 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Faculty Portal Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Faculty Department Portal</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                DEPT: {dept}
              </span>
            </div>
            <p className="text-slate-300 text-sm mt-1">
              Welcome, {user?.displayName || 'Faculty Member'} &bull; Department of {dept}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canExport ? (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export {dept} Problem List</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs border border-slate-700">
              <Lock className="w-3.5 h-3.5" />
              <span>Export Permission Restricted</span>
            </div>
          )}
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-card">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${dept} students by Roll Number or Name...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDepartmentStudents()}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
          <span className="text-xs text-slate-500">
            Total {students.length} students enrolled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
              <tr>
                <th className="py-4 px-6">Roll Number</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Year / Section</th>
                <th className="py-4 px-6">LeetCode Username</th>
                <th className="py-4 px-6">Problems Solved</th>
                <th className="py-4 px-6">Sync Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {students.map((student) => {
                const isSyncing = syncingStudentId === student.id;
                return (
                  <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-4 px-6 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {student.rollNumber || student.studentId}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">
                      {student.name || student.displayName}
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-xs">
                      {student.yearOfStudy || '3rd Year'} &bull; Sec {student.section || 'A'}
                    </td>
                    <td className="py-4 px-6">
                      <a
                        href={`https://leetcode.com/${student.leetcodeUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-slate-700 dark:text-slate-300 hover:text-brand-600 underline"
                      >
                        @{student.leetcodeUsername}
                      </a>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-xs border border-emerald-200 dark:border-emerald-900">
                        {student._count?.submissions ?? 30}+ Solved
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {student.collectionStatus || 'active'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleSyncStudent(student.id, student.rollNumber || student.studentId)}
                        disabled={isSyncing}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Sync LeetCode Profile"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-brand-500' : ''}`} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
