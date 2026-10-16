import React, { useState } from 'react';
import { useStudentData } from '../../context/StudentDataContext';
import { extractLeetCodeUsername } from '../../utils/metricCalculations';
import {
  Users,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';

interface BulkAddStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BatchResult {
  raw: string;
  cleanUsername: string;
  status: 'pending' | 'scraping' | 'success' | 'failed';
  error?: string;
  solvedCount?: number;
}

export const BulkAddStudentDialog: React.FC<BulkAddStudentDialogProps> = ({ isOpen, onClose }) => {
  const { createStudent, refreshStudentData, profiles } = useStudentData();

  const [inputContent, setInputContent] = useState('');
  const [cohortTag, setCohortTag] = useState('');
  const [department, setDepartment] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setInputContent((prev) => (prev ? `${prev}\n${text}` : text));
      }
    };
    reader.readAsText(file);
  };

  const handleStartImport = async () => {
    // Parse input lines/tokens
    const tokens = inputContent
      .split(/[\n,;]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const uniqueHandles = new Map<string, string>();
    tokens.forEach((raw) => {
      const clean = extractLeetCodeUsername(raw);
      if (clean && !uniqueHandles.has(clean.toLowerCase())) {
        uniqueHandles.set(clean.toLowerCase(), raw);
      }
    });

    if (uniqueHandles.size === 0) return;

    const batch: BatchResult[] = Array.from(uniqueHandles.entries()).map(([clean, raw]) => ({
      raw,
      cleanUsername: clean,
      status: 'pending',
    }));

    setResults(batch);
    setIsProcessing(true);
    setCurrentIndex(0);

    for (let i = 0; i < batch.length; i++) {
      setCurrentIndex(i + 1);
      batch[i].status = 'scraping';
      setResults([...batch]);

      try {
        const student = await createStudent({
          leetcodeUsername: batch[i].cleanUsername,
          displayName: batch[i].cleanUsername,
          department: department.trim() || undefined,
          cohort: cohortTag.trim() || undefined,
          tags: cohortTag.trim() ? [cohortTag.trim()] : undefined,
          role: 'student',
        });

        // createStudent automatically invokes refreshStudentData
        const p = profiles[student.leetcodeUsername.toLowerCase()];
        batch[i].status = 'success';
        batch[i].solvedCount = p?.problemStatistics.all;
      } catch (err: any) {
        batch[i].status = 'failed';
        batch[i].error = err.message || 'Scraping failed';
      }

      setResults([...batch]);

      // Throttle 400ms between students to respect LeetCode API limits
      await new Promise((r) => setTimeout(r, 400));
    }

    setIsProcessing(false);
  };

  const completedCount = results.filter((r) => r.status === 'success').length;
  const progressPct = results.length > 0 ? Math.round((currentIndex / results.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              <span>Bulk Student Importer</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Add multiple students by pasting usernames/URLs or uploading a CSV
            </p>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {!isProcessing && results.length === 0 ? (
            <>
              {/* Textarea Input */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Paste LeetCode Usernames or URLs (one per line or comma-separated):
                </label>
                <textarea
                  rows={6}
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder={`lee215\nneal_wu\nhttps://leetcode.com/u/tourist/\n@student_handle`}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono text-xs text-slate-900 dark:text-white placeholder:text-slate-400 leading-relaxed"
                />
              </div>

              {/* CSV Upload Alternative */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Upload .csv / .txt file</span>
                </div>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Optional Cohort & Department Tags */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Assign Batch / Cohort (Optional):
                  </label>
                  <input
                    type="text"
                    value={cohortTag}
                    onChange={(e) => setCohortTag(e.target.value)}
                    placeholder="e.g. Batch 2026"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Department (Optional):
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Live Progress View */
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs font-medium">
                  <span className="text-slate-600 dark:text-slate-300">
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                        Scraping authentic profiles ({currentIndex} of {results.length})...
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Batch import completed! ({completedCount} successful)
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-slate-400">{progressPct}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Results List */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-100 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-850/50">
                {results.map((res, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 text-xs shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      {res.status === 'pending' && (
                        <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                      )}
                      {res.status === 'scraping' && (
                        <Loader2 className="w-4 h-4 text-brand-600 animate-spin shrink-0" />
                      )}
                      {res.status === 'success' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                      {res.status === 'failed' && (
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        @{res.cleanUsername}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono">
                      {res.status === 'success' && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {res.solvedCount} solved
                        </span>
                      )}
                      {res.status === 'failed' && (
                        <span className="text-rose-500">{res.error || 'Failed'}</span>
                      )}
                      {res.status === 'scraping' && (
                        <span className="text-brand-600">Scraping...</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-end gap-2">
          {!isProcessing && results.length === 0 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!inputContent.trim()}
                onClick={handleStartImport}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Live Batch Import</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                setResults([]);
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-lg shadow-sm"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
