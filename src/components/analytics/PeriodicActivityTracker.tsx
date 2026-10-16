import React, { useState, useMemo } from 'react';
import { LeetCodeProfile, SolvedProblemRecord } from '../../types/leetcode';
import { ActivityTrackingService } from '../../services/activityTrackingService';
import {
  CalendarDays,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Layers,
  Filter,
  Check,
  Code2,
} from 'lucide-react';

interface PeriodicActivityTrackerProps {
  profile: LeetCodeProfile | null;
}

export const PeriodicActivityTracker: React.FC<PeriodicActivityTrackerProps> = ({ profile }) => {
  const [periodTab, setPeriodTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [onlyActiveDays, setOnlyActiveDays] = useState(true);

  // Solved problems log (1 problem = 1 count)
  const solvedLog = useMemo(() => {
    return (
      profile?.solvedProblemsLog ||
      profile?.recentAcceptedSubmissions?.map((s) => {
        const d = new Date(s.timestamp * 1000);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return { ...s, dateISO: `${yyyy}-${mm}-${dd}` };
      }) ||
      []
    );
  }, [profile]);

  const dailyItems = useMemo(() => {
    return ActivityTrackingService.getDailyBreakdown(
      profile?.dailyActivityTimeline || [],
      solvedLog,
      60
    );
  }, [profile, solvedLog]);

  const weeklyItems = useMemo(() => {
    return ActivityTrackingService.getWeeklyBreakdown(
      profile?.dailyActivityTimeline || [],
      solvedLog,
      12
    );
  }, [profile, solvedLog]);

  const monthlyItems = useMemo(() => {
    return ActivityTrackingService.getMonthlyBreakdown(
      profile?.dailyActivityTimeline || [],
      solvedLog,
      12
    );
  }, [profile, solvedLog]);

  // Filter daily items if user only wants to see days with solved problems
  const displayedDailyItems = useMemo(() => {
    if (!onlyActiveDays) return dailyItems;
    return dailyItems.filter((d) => d.count > 0 || (d.problems && d.problems.length > 0));
  }, [dailyItems, onlyActiveDays]);

  const totalProblemsTracked = solvedLog.length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Problem-Solving History Log (Daily, Weekly, Monthly)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
              1 Problem = 1 Count
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified chronological log of solved problems (no submission counts or progress bars).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Active Days Filter for Daily View */}
          {periodTab === 'daily' && (
            <button
              onClick={() => setOnlyActiveDays((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                onlyActiveDays
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800'
              }`}
            >
              <Filter className="w-3 h-3 text-brand-600" />
              <span>{onlyActiveDays ? 'Active Solving Days Only' : 'All Calendar Days'}</span>
            </button>
          )}

          {/* Tab Switcher */}
          <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium">
            <button
              onClick={() => setPeriodTab('daily')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                periodTab === 'daily'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Daily History
            </button>
            <button
              onClick={() => setPeriodTab('weekly')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                periodTab === 'weekly'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Weekly Summary
            </button>
            <button
              onClick={() => setPeriodTab('monthly')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                periodTab === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly Log
            </button>
          </div>
        </div>
      </div>

      {/* 1. DAILY HISTORY VIEW */}
      {periodTab === 'daily' && (
        <div className="space-y-2">
          {displayedDailyItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-sans border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No problem-solving history recorded yet. Solve problems on LeetCode and refresh to populate this log.
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold font-mono">
                    <th className="py-2.5 px-4 w-44">Date & Day</th>
                    <th className="py-2.5 px-4 w-36">Problems Solved</th>
                    <th className="py-2.5 px-4">Solved Problems History (Exact Questions & Links)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayedDailyItems.map((day) => {
                    const hasSolved = day.count > 0;
                    return (
                      <tr
                        key={day.date}
                        className={`transition-colors ${
                          hasSolved
                            ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-850/50'
                            : 'bg-slate-50/40 dark:bg-slate-950/20 opacity-60'
                        }`}
                      >
                        {/* Date & Day */}
                        <td className="py-3 px-4 font-mono whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {day.date}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                              {day.dayOfWeek}
                            </span>
                          </div>
                        </td>

                        {/* Problems Solved (1 problem = 1 count) */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {hasSolved ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold font-mono text-xs border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{day.count} {day.count === 1 ? 'Problem' : 'Problems'}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">
                              0 Solved
                            </span>
                          )}
                        </td>

                        {/* History of Solving (Problems List with links) */}
                        <td className="py-3 px-4">
                          {hasSolved && day.problems.length > 0 ? (
                            <div className="space-y-1.5">
                              {day.problems.map((prob) => (
                                <div
                                  key={prob.id}
                                  className="inline-flex items-center gap-2 mr-2 mb-1 p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="font-medium text-slate-900 dark:text-white">
                                    {prob.title}
                                  </span>
                                  <a
                                    href={`https://leetcode.com/problems/${prob.titleSlug}/`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-brand-600 hover:text-brand-700 ml-1"
                                    title="Open problem on LeetCode"
                                  >
                                    <span>LeetCode</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          ) : hasSolved ? (
                            <span className="text-xs text-slate-500 font-mono">
                              {day.count} problem{day.count === 1 ? '' : 's'} recorded on calendar
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-sans italic">
                              No problems solved on this date
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. WEEKLY SUMMARY VIEW */}
      {periodTab === 'weekly' && (
        <div className="space-y-3">
          {weeklyItems.map((week) => (
            <div
              key={week.weekKey}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                    {week.weekLabel}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {week.activeDays} active day{week.activeDays === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold font-mono text-xs border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{week.totalSolved} Problems Solved</span>
                </div>
              </div>

              {week.problems.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {week.problems.map((prob) => (
                    <div
                      key={prob.id}
                      className="inline-flex items-center gap-1.5 p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{prob.title}</span>
                      <a
                        href={`https://leetcode.com/problems/${prob.titleSlug}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 hover:underline flex items-center gap-0.5 text-[10px] font-mono ml-1"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  {week.totalSolved > 0
                    ? `${week.totalSolved} problems completed during this week.`
                    : 'No problems solved this week.'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3. MONTHLY LOG VIEW */}
      {periodTab === 'monthly' && (
        <div className="space-y-3">
          {monthlyItems.map((month) => (
            <div
              key={month.monthKey}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                    {month.monthLabel}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {month.activeDays} practice days ({month.consistencyRate}% active)
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold font-mono text-xs border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{month.totalSolved} Problems Solved</span>
                </div>
              </div>

              {month.problems.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {month.problems.map((prob) => (
                    <div
                      key={prob.id}
                      className="inline-flex items-center gap-1.5 p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{prob.title}</span>
                      <a
                        href={`https://leetcode.com/problems/${prob.titleSlug}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 hover:underline flex items-center gap-0.5 text-[10px] font-mono ml-1"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  {month.totalSolved > 0
                    ? `${month.totalSolved} problems completed in ${month.monthLabel}.`
                    : `No problems solved in ${month.monthLabel}.`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
