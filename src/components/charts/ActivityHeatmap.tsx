import React, { useState } from 'react';
import { DailyActivityRecord } from '../../types/leetcode';
import { formatDate } from '../../utils/dateUtils';
import { Flame, Calendar, Award } from 'lucide-react';

interface ActivityHeatmapProps {
  timeline: DailyActivityRecord[];
  streak?: number;
  totalActiveDays?: number;
  title?: string;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  timeline,
  streak = 0,
  totalActiveDays,
  title = 'Coding Activity Timeline',
}) => {
  const [hoveredDay, setHoveredDay] = useState<DailyActivityRecord | null>(null);

  // Take the most recent ~140 days (20 weeks) to fit nicely on desktop grid
  const recentDays = timeline.slice(-140);
  const totalSubmissions = recentDays.reduce((acc, d) => acc + d.submissions, 0);
  const activeDaysCount = totalActiveDays ?? recentDays.filter((d) => d.submissions > 0).length;

  // Group into columns of 7 days (Sunday - Saturday)
  const weeks: DailyActivityRecord[][] = [];
  let currentWeek: DailyActivityRecord[] = [];

  recentDays.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Intensity color
  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50';
    if (count <= 2) return 'bg-emerald-200 dark:bg-emerald-900/60 border-emerald-300 dark:border-emerald-800';
    if (count <= 4) return 'bg-emerald-400 dark:bg-emerald-700 border-emerald-500 dark:border-emerald-600';
    if (count <= 6) return 'bg-emerald-500 dark:bg-emerald-600 border-emerald-600 dark:border-emerald-500';
    return 'bg-emerald-600 dark:bg-emerald-500 border-emerald-700 dark:border-emerald-400';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600" />
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Past 20 weeks of daily coding submissions and consistency
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Streak: <strong className="font-bold">{streak} days</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <Award className="w-3.5 h-3.5" />
            <span>Active: <strong className="font-bold">{activeDaysCount} days</strong></span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex gap-1.5 items-start">
          {/* Day of week labels */}
          <div className="grid grid-rows-7 gap-1 text-[10px] text-slate-400 font-mono pr-2 select-none h-[112px]">
            <span>Sun</span>
            <span></span>
            <span>Tue</span>
            <span></span>
            <span>Thu</span>
            <span></span>
            <span>Sat</span>
          </div>

          {/* Week columns */}
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-rows-7 gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`w-3.5 h-3.5 rounded-[3px] border cursor-pointer transition-all hover:scale-125 hover:z-10 relative ${getIntensityClass(
                    day.submissions
                  )}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Legend & Hover Tooltip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        <div className="h-5 flex items-center font-mono">
          {hoveredDay ? (
            <span className="text-slate-800 dark:text-slate-200">
              <strong className="font-semibold text-brand-600 dark:text-brand-400">
                {hoveredDay.submissions} {hoveredDay.submissions === 1 ? 'submission' : 'submissions'}
              </strong>{' '}
              on {formatDate(hoveredDay.date)}
            </span>
          ) : (
            <span>Total: <strong>{totalSubmissions}</strong> submissions across period</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-[11px] text-slate-400 mr-1">Less</span>
          <div className="w-3 h-3 rounded-[2px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-200 dark:bg-emerald-900 border border-emerald-300 dark:border-emerald-800" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-400 dark:bg-emerald-700 border border-emerald-500 dark:border-emerald-600" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-500 dark:bg-emerald-600 border border-emerald-600 dark:border-emerald-500" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-600 dark:bg-emerald-500 border border-emerald-700 dark:border-emerald-400" />
          <span className="text-[11px] text-slate-400 ml-1">More</span>
        </div>
      </div>
    </div>
  );
};
