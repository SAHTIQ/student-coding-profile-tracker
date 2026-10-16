import React, { useState, useEffect } from 'react';
import { useStudentData } from '../../context/StudentDataContext';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2, X, Users } from 'lucide-react';

interface BatchSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BatchSyncModal: React.FC<BatchSyncModalProps> = ({ isOpen, onClose }) => {
  const { students, refreshStudentData } = useStudentData();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setIsSyncing(false);
      setSyncedCount(0);
      setFailedCount(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartSync = async () => {
    setIsSyncing(true);
    setCurrentIndex(0);
    setSyncedCount(0);
    setFailedCount(0);

    for (let i = 0; i < students.length; i++) {
      setCurrentIndex(i + 1);
      const student = students[i];
      try {
        await refreshStudentData(student.id);
        setSyncedCount((c) => c + 1);
      } catch {
        setFailedCount((c) => c + 1);
      }

      // 350ms delay between scrapes to respect LeetCode rate limits
      await new Promise((r) => setTimeout(r, 350));
    }

    setIsSyncing(false);
  };

  const progressPct = students.length > 0 ? Math.round((currentIndex / students.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-5 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Sync All Student Profiles
              </h3>
              <p className="text-[11px] text-slate-500">
                Refresh live statistics directly from LeetCode
              </p>
            </div>
          </div>
          {!isSyncing && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            This will sequentially fetch authentic statistics, difficulty counts, streaks, contest rankings, and newly solved questions for all{' '}
            <strong className="text-slate-900 dark:text-white">{students.length} registered students</strong>.
          </p>

          {isSyncing && (
            <div className="space-y-2 py-2">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-brand-600 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Syncing student {currentIndex} of {students.length}...
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {progressPct}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {currentIndex === students.length && !isSyncing && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Successfully refreshed {syncedCount} of {students.length} student profiles!
                {failedCount > 0 && ` (${failedCount} failed)`}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {!isSyncing && currentIndex === 0 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartSync}
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Start Batch Sync</span>
              </button>
            </>
          )}

          {!isSyncing && currentIndex > 0 && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
