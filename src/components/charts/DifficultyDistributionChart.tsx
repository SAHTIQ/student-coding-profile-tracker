import React from 'react';
import { ProblemStatsByDifficulty } from '../../types/leetcode';

interface DifficultyDistributionChartProps {
  stats: ProblemStatsByDifficulty;
  title?: string;
}

export const DifficultyDistributionChart: React.FC<DifficultyDistributionChartProps> = ({
  stats,
  title = 'Problem Difficulty Distribution',
}) => {
  const { easy, medium, hard, all } = stats;
  const easyPct = all > 0 ? ((easy / all) * 100).toFixed(1) : '0';
  const mediumPct = all > 0 ? ((medium / all) * 100).toFixed(1) : '0';
  const hardPct = all > 0 ? ((hard / all) * 100).toFixed(1) : '0';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Breakdown across difficulty categories
          </p>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">{all}</span>
          <span className="text-xs text-slate-400 block font-normal">Solved Total</span>
        </div>
      </div>

      {/* Progress Bar Multi-Segment */}
      <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex mb-6">
        <div
          style={{ width: `${easyPct}%` }}
          className="bg-emerald-500 h-full transition-all duration-500"
          title={`Easy: ${easy} (${easyPct}%)`}
        />
        <div
          style={{ width: `${mediumPct}%` }}
          className="bg-amber-500 h-full transition-all duration-500"
          title={`Medium: ${medium} (${mediumPct}%)`}
        />
        <div
          style={{ width: `${hardPct}%` }}
          className="bg-rose-500 h-full transition-all duration-500"
          title={`Hard: ${hard} (${hardPct}%)`}
        />
      </div>

      {/* 3 Metric Rows */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Easy</span>
          </div>
          <span className="text-lg font-bold font-mono text-slate-900 dark:text-white block">
            {easy}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {easyPct}%
          </span>
        </div>

        <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Medium</span>
          </div>
          <span className="text-lg font-bold font-mono text-slate-900 dark:text-white block">
            {medium}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {mediumPct}%
          </span>
        </div>

        <div className="p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Hard</span>
          </div>
          <span className="text-lg font-bold font-mono text-slate-900 dark:text-white block">
            {hard}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {hardPct}%
          </span>
        </div>
      </div>
    </div>
  );
};
