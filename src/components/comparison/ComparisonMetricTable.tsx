import React from 'react';
import { Student } from '../../types/student';
import { LeetCodeProfile } from '../../types/leetcode';
import { calculateAcceptanceRate, calculateConsistencyRate } from '../../utils/metricCalculations';
import { Trophy, Flame, Calendar, CheckCircle2, TrendingUp } from 'lucide-react';

interface ComparisonMetricTableProps {
  students: Student[];
  profiles: Record<string, LeetCodeProfile>;
}

export const ComparisonMetricTable: React.FC<ComparisonMetricTableProps> = ({
  students,
  profiles,
}) => {
  if (students.length === 0) return null;

  const metrics = [
    {
      label: 'Total Problems Solved',
      getValue: (p: LeetCodeProfile | undefined) => p?.problemStatistics.all ?? 0,
      format: (v: number) => <span className="font-bold text-slate-900 dark:text-white font-mono">{v}</span>,
      highlightMax: true,
    },
    {
      label: 'Easy Solved',
      getValue: (p: LeetCodeProfile | undefined) => p?.problemStatistics.easy ?? 0,
      format: (v: number) => <span className="text-emerald-600 font-mono font-medium">{v}</span>,
      highlightMax: true,
    },
    {
      label: 'Medium Solved',
      getValue: (p: LeetCodeProfile | undefined) => p?.problemStatistics.medium ?? 0,
      format: (v: number) => <span className="text-amber-600 font-mono font-medium">{v}</span>,
      highlightMax: true,
    },
    {
      label: 'Hard Solved',
      getValue: (p: LeetCodeProfile | undefined) => p?.problemStatistics.hard ?? 0,
      format: (v: number) => <span className="text-rose-600 font-mono font-medium">{v}</span>,
      highlightMax: true,
    },
    {
      label: 'Active Coding Days',
      getValue: (p: LeetCodeProfile | undefined) => p?.calendarSummary.totalActiveDays ?? 0,
      format: (v: number) => <span className="font-mono">{v} days</span>,
      highlightMax: true,
    },
    {
      label: 'Current Streak',
      getValue: (p: LeetCodeProfile | undefined) => p?.calendarSummary.streak ?? 0,
      format: (v: number) => (
        <span className="inline-flex items-center gap-1 font-mono font-semibold text-amber-600">
          <Flame className="w-3.5 h-3.5 fill-current" />
          {v}d
        </span>
      ),
      highlightMax: true,
    },
    {
      label: 'Acceptance Rate',
      getValue: (p: LeetCodeProfile | undefined) =>
        p ? calculateAcceptanceRate(p.allSubmissionStatistics.all, p.allSubmissionStatistics.all * 1.5) : 0,
      format: (v: number) => <span className="font-mono">{v}%</span>,
      highlightMax: true,
    },
    {
      label: 'Contest Rating',
      getValue: (p: LeetCodeProfile | undefined) => Math.round(p?.contestSummary?.rating || 0),
      format: (v: number) =>
        v > 0 ? (
          <span className="font-mono font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            {v}
          </span>
        ) : (
          <span className="text-slate-400 italic font-mono text-xs">Unrated</span>
        ),
      highlightMax: true,
    },
    {
      label: '30-Day Practice Consistency',
      getValue: (p: LeetCodeProfile | undefined) =>
        p ? calculateConsistencyRate(p.dailyActivityTimeline, 30) : 0,
      format: (v: number) => <span className="font-mono">{v}%</span>,
      highlightMax: true,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-card overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Head-to-Head Comparative Metric Matrix
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Side-by-side comparison across volume, pacing, consistency, and contest ratings
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
              <th className="py-3 px-4 text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-56">
                Metric
              </th>
              {students.map((student) => {
                const profile = profiles[student.leetcodeUsername.toLowerCase()];
                return (
                  <th key={student.id} className="py-3 px-4 min-w-[140px]">
                    <div className="flex flex-col items-center gap-1">
                      {profile?.profile.userAvatar ? (
                        <img
                          src={profile.profile.userAvatar}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs uppercase">
                          {student.displayName.substring(0, 2)}
                        </div>
                      )}
                      <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[130px]">
                        {student.displayName}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 -mt-0.5">
                        @{student.leetcodeUsername}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {metrics.map((m, idx) => {
              // Calculate highest value to optionally highlight
              const values = students.map((s) =>
                m.getValue(profiles[s.leetcodeUsername.toLowerCase()])
              );
              const maxVal = Math.max(...values);

              return (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 text-left font-medium text-slate-700 dark:text-slate-300">
                    {m.label}
                  </td>
                  {students.map((student, sIdx) => {
                    const val = values[sIdx];
                    const isLeader = m.highlightMax && val > 0 && val === maxVal && students.length > 1;

                    return (
                      <td
                        key={student.id}
                        className={`py-3 px-4 ${
                          isLeader
                            ? 'bg-brand-50/40 dark:bg-brand-950/20 font-semibold'
                            : ''
                        }`}
                      >
                        {m.format(val)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
