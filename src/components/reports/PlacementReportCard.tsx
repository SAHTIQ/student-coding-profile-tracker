import React, { useState } from 'react';
import { Student } from '../../types/student';
import { LeetCodeProfile } from '../../types/leetcode';
import {
  Printer,
  Award,
  CheckCircle2,
  Calendar,
  Flame,
  Trophy,
  ExternalLink,
  Code2,
  BookOpen,
} from 'lucide-react';

interface PlacementReportCardProps {
  students: Student[];
  profiles: Record<string, LeetCodeProfile>;
}

export const PlacementReportCard: React.FC<PlacementReportCardProps> = ({ students, profiles }) => {
  const activeStudents = students.filter((s) => s.collectionStatus === 'success');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    activeStudents[0]?.id || students[0]?.id || ''
  );

  const student = students.find((s) => s.id === selectedStudentId);
  const profile = student ? profiles[student.leetcodeUsername.toLowerCase()] : null;

  const handlePrint = () => {
    window.print();
  };

  if (!student) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
        No student profile selected. Add or select a student to generate a Placement Report Card.
      </div>
    );
  }

  const solved = profile?.problemStatistics;
  const totalSolved = solved?.all || 0;
  const easy = solved?.easy || 0;
  const medium = solved?.medium || 0;
  const hard = solved?.hard || 0;

  // Flatten skills
  const advancedTags = profile?.tagProblemCounts?.advanced || [];
  const intermediateTags = profile?.tagProblemCounts?.intermediate || [];
  const fundamentalTags = profile?.tagProblemCounts?.fundamental || [];

  return (
    <div className="space-y-4">
      {/* Selector Toolbar - hidden when printing */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-card">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Select Student:
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName} (@{s.leetcodeUsername}) {s.cohort ? `[${s.cohort}]` : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Printable Report Card Page */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-card print:border-none print:shadow-none print:p-0 print:m-0 max-w-4xl mx-auto space-y-6 text-slate-900 dark:text-white font-sans">
        {/* Header Block */}
        <div className="flex items-start justify-between border-b-2 border-brand-600 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-brand-50 text-brand-700 font-mono text-[10px] font-bold uppercase tracking-wider">
              Official Coding Assessment Report
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {student.displayName}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Roll No: <strong>{student.studentId || 'N/A'}</strong> • Dept: {student.department || 'Computer Science'} • Cohort: {student.cohort || student.yearOfStudy || '2026 Batch'}
            </p>
          </div>

          <div className="text-right space-y-1">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-end gap-1">
              <span>CodePulse</span>
              <span className="text-brand-600">Analytics</span>
            </div>
            <a
              href={`https://leetcode.com/u/${student.leetcodeUsername}/`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-mono text-brand-600 dark:text-brand-400 hover:underline flex items-center justify-end gap-1"
            >
              <span>leetcode.com/u/{student.leetcodeUsername}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <div className="text-[10px] text-slate-400">
              Generated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* 4 Core Metric Callouts */}
        <div className="grid grid-cols-4 gap-3">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/60 dark:bg-slate-850">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Solved</div>
            <div className="text-2xl font-black font-mono text-brand-600 mt-1">{totalSolved}</div>
            <div className="text-[10px] text-slate-500">Verified LeetCode</div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/60 dark:bg-slate-850">
            <div className="text-[10px] uppercase font-bold text-slate-400">Contest Rating</div>
            <div className="text-2xl font-black font-mono text-amber-600 mt-1">
              {profile?.contestSummary?.rating ? Math.round(profile.contestSummary.rating) : 'Unrated'}
            </div>
            <div className="text-[10px] text-slate-500">
              {profile?.contestSummary?.topPercentage ? `Top ${profile.contestSummary.topPercentage.toFixed(1)}%` : 'No contests'}
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/60 dark:bg-slate-850">
            <div className="text-[10px] uppercase font-bold text-slate-400">Active Practice</div>
            <div className="text-2xl font-black font-mono text-blue-600 mt-1">
              {profile?.calendarSummary.totalActiveDays || 0}d
            </div>
            <div className="text-[10px] text-slate-500">Coding Days</div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/60 dark:bg-slate-850">
            <div className="text-[10px] uppercase font-bold text-slate-400">Current Streak</div>
            <div className="text-2xl font-black font-mono text-rose-600 mt-1">
              {profile?.calendarSummary.streak || 0}d
            </div>
            <div className="text-[10px] text-slate-500">Daily Consistency</div>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-brand-600" />
              Problem Difficulty Distribution
            </span>
            <span className="font-mono text-slate-500">{totalSolved} Total Solved</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">EASY</div>
              <div className="text-lg font-black font-mono text-emerald-800 dark:text-emerald-300">{easy}</div>
              <div className="text-[10px] text-emerald-600">
                {totalSolved > 0 ? Math.round((easy / totalSolved) * 100) : 0}% of total
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">MEDIUM</div>
              <div className="text-lg font-black font-mono text-amber-800 dark:text-amber-300">{medium}</div>
              <div className="text-[10px] text-amber-600">
                {totalSolved > 0 ? Math.round((medium / totalSolved) * 100) : 0}% of total
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
              <div className="text-[10px] font-semibold text-rose-700 dark:text-rose-400">HARD</div>
              <div className="text-lg font-black font-mono text-rose-800 dark:text-rose-300">{hard}</div>
              <div className="text-[10px] text-rose-600">
                {totalSolved > 0 ? Math.round((hard / totalSolved) * 100) : 0}% of total
              </div>
            </div>
          </div>
        </div>

        {/* DSA Topic Mastery Summary */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-brand-600" />
            Verified Topic Mastery & Problem Coverage
          </div>

          <div className="space-y-2">
            {advancedTags.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">
                  Advanced Topics
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {advancedTags.slice(0, 8).map((t) => (
                    <span
                      key={t.tagSlug}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                    >
                      {t.tagName} <strong>×{t.problemsSolved}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {intermediateTags.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
                  Intermediate Topics
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {intermediateTags.slice(0, 8).map((t) => (
                    <span
                      key={t.tagSlug}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                    >
                      {t.tagName} <strong>×{t.problemsSolved}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {fundamentalTags.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                  Fundamental Topics
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {fundamentalTags.slice(0, 8).map((t) => (
                    <span
                      key={t.tagSlug}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                    >
                      {t.tagName} <strong>×{t.problemsSolved}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Badges Earned */}
        {profile?.badges && profile.badges.length > 0 && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-600" />
              Verified LeetCode Badges Earned ({profile.badges.length})
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {profile.badges.map((b) => (
                <div
                  key={b.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 text-xs font-semibold text-purple-800 dark:text-purple-300"
                >
                  <Award className="w-3.5 h-3.5 text-purple-600" />
                  <span>{b.displayName}</span>
                  {b.creationDate && (
                    <span className="text-[10px] text-purple-500 font-normal">
                      ({b.creationDate})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div>Verified through CodePulse Analytics Platform</div>
          <div>Authorized Placement Dossier</div>
        </div>
      </div>
    </div>
  );
};
