import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useStudentData } from '../context/StudentDataContext';
import { AppHeader } from '../components/layout/AppHeader';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import {
  Settings,
  Shield,
  RotateCcw,
  Sliders,
  Bell,
  Palette,
  Clock,
  Sparkles,
  CheckCircle2,
  Database,
  Download,
  UploadCloud,
  FileCode,
  AlertCircle,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
  const { user, role } = useAuth();
  const { theme, setTheme } = useTheme();
  const { students, profiles, resetAllData, reloadData, addToast } = useStudentData();
  const isAdmin = role === 'admin';

  const [defaultRange, setDefaultRange] = useState('30d');
  const [tableDensity, setTableDensity] = useState('compact');
  const [mockInterval, setMockInterval] = useState('15');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [contestReminders, setContestReminders] = useState(true);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: 'success',
      title: 'Preferences Saved',
      message: 'Your platform settings have been updated in browser storage.',
    });
  };

  const handleResetConfirm = () => {
    resetAllData();
    setIsResetConfirmOpen(false);
  };

  // Export full student roster and scraped profiles as JSON
  const handleExportBackup = () => {
    try {
      const backupData = {
        platform: 'CodePulse LeetCode Analytics',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        totalStudents: students.length,
        students,
        profiles,
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `codepulse-backup-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        title: 'Database Exported',
        message: `Successfully generated backup with ${students.length} student records and cached profiles.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: err.message || 'Could not serialize database backup.',
      });
    }
  };

  // Restore database from JSON backup file
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || !Array.isArray(parsed.students)) {
          throw new Error('Invalid backup file format: missing "students" array.');
        }

        // Save into localStorage
        localStorage.setItem('codepulse_students_data_live', JSON.stringify(parsed.students));
        if (parsed.profiles && typeof parsed.profiles === 'object') {
          localStorage.setItem('codepulse_leetcode_profiles_live', JSON.stringify(parsed.profiles));
        }

        reloadData();

        addToast({
          type: 'success',
          title: 'Database Restored',
          message: `Successfully loaded ${parsed.students.length} student records from backup!`,
        });

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err: any) {
        setRestoreError(err.message || 'Failed to read or parse backup JSON file.');
        addToast({
          type: 'error',
          title: 'Restore Failed',
          message: err.message || 'Could not parse the selected backup file.',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <AppHeader
        onToggleSidebar={toggleSidebar}
        breadcrumbs={[
          { label: 'System' },
          { label: 'Settings' },
        ]}
        pageTitle="Platform Settings & Configuration"
      />

      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* Appearance & Theme */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Palette className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Visual & Appearance Preferences
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Active Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                    theme === 'light'
                      ? 'border-brand-600 bg-brand-50 text-brand-700 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Light Theme (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                    theme === 'dark'
                      ? 'border-brand-600 bg-brand-950 text-brand-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Dark Theme
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Analytics Lookback Window
              </label>
              <select
                value={defaultRange}
                onChange={(e) => setDefaultRange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days (Standard)</option>
                <option value="90d">Last 90 Days (Quarterly)</option>
                <option value="180d">Last 180 Days (Semester)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Database & Data Persistence (Backup & Restore) */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Database Backup & Portability
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                JSON RESTORE & BACKUP
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Export your registered student roster and all scraped LeetCode statistics, daily activity logs, and skill metrics to a single portable JSON file. You can restore this file on any machine or browser.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-3">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-brand-600" />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Export Full Database (.json)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500">
                  Currently holding <strong>{students.length}</strong> student records and <strong>{Object.keys(profiles).length}</strong> scraped profiles.
                </p>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup File</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-3">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Restore Database (.json)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500">
                  Upload a previously exported CodePulse backup file to restore your entire cohort.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 rounded-lg shadow-sm transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Select JSON File to Restore</span>
                </button>
                {restoreError && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{restoreError}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Administration & Sync Cadence */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Data Refresh & Layout Density
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                ADMIN ONLY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Background Refresh Simulation Interval
                </label>
                <select
                  value={mockInterval}
                  onChange={(e) => setMockInterval(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                >
                  <option value="5">Every 5 minutes</option>
                  <option value="15">Every 15 minutes (Standard)</option>
                  <option value="60">Every 1 hour</option>
                  <option value="manual">Manual trigger only</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Frequency of simulated background polls.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Table Layout Density
                </label>
                <select
                  value={tableDensity}
                  onChange={(e) => setTableDensity(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                >
                  <option value="compact">Compact (Maximum visibility)</option>
                  <option value="comfortable">Comfortable spacing</option>
                </select>
              </div>
            </div>

            {/* Clear Data Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Clear All Profiles
                </h4>
                <p className="text-[11px] text-slate-500">
                  Wipes all registered students and cached scraped profiles from local storage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-3.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear All Profiles</span>
              </button>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </form>

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isResetConfirmOpen}
        title="Confirm Profile Data Purge"
        message="This will delete all registered students and their scraped LeetCode profiles from browser storage. Are you sure you want to proceed?"
        confirmLabel="Purge All Profiles"
        isDestructive={true}
        onConfirm={handleResetConfirm}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
