import React from 'react';
import { StudentForecastSummary } from '../../types/forecast';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Info,
  CalendarDays,
  Target,
  BarChart2,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface ForecastMetricsCardProps {
  summary: StudentForecastSummary;
}

export const ForecastMetricsCard: React.FC<ForecastMetricsCardProps> = ({ summary }) => {
  const {
    expectedSubmissions7d,
    expectedActiveDays7d,
    expectedWeeklyVolume,
    historicalTrend,
    recentConsistencyPct,
    reliability,
    reliabilityReason,
  } = summary;

  const reliabilityConfig = {
    high: {
      label: 'High Confidence',
      icon: CheckCircle2,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    },
    moderate: {
      label: 'Moderate Reliability',
      icon: Info,
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    },
    low: {
      label: 'Low Reliability',
      icon: AlertTriangle,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    },
    insufficient: {
      label: 'Insufficient History',
      icon: AlertTriangle,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    },
  }[reliability];

  const RelIcon = reliabilityConfig.icon;

  return (
    <div className="space-y-4">
      {/* 4 KPI Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Expected Submissions (7 Days) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500 mb-2">
            <span>Expected 7d Volume</span>
            <Target className="w-4 h-4 text-brand-600" />
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {expectedSubmissions7d}
            </span>
            <span className="text-xs text-slate-400">subs</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Estimated problems submitted over the coming 7 days
          </p>
        </div>

        {/* Expected Active Days */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500 mb-2">
            <span>Projected Active Days</span>
            <CalendarDays className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {expectedActiveDays7d}
            </span>
            <span className="text-xs text-slate-400">/ 7 days</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Days with at least 1 projected submission session
          </p>
        </div>

        {/* Historical Practice Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500 mb-2">
            <span>Practice Momentum</span>
            <BarChart2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            {historicalTrend === 'increasing' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200">
                <TrendingUp className="w-3.5 h-3.5" />
                Accelerating
              </span>
            )}
            {historicalTrend === 'declining' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200">
                <TrendingDown className="w-3.5 h-3.5" />
                Decelerating
              </span>
            )}
            {historicalTrend === 'stable' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200">
                <Minus className="w-3.5 h-3.5" />
                Steady Cadence
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Last 4 weeks vs prior 4 weeks submission trend
          </p>
        </div>

        {/* Practice Consistency */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500 mb-2">
            <span>28-Day Consistency</span>
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
              {recentConsistencyPct}%
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2 mb-2">
            <div
              style={{ width: `${recentConsistencyPct}%` }}
              className="h-full bg-brand-600 rounded-full transition-all duration-500"
            />
          </div>
          <p className="text-xs text-slate-500">
            Active on {Math.round((recentConsistencyPct * 28) / 100)} of last 28 days
          </p>
        </div>
      </div>

      {/* Forecast Model Reliability Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
            <RelIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                Forecast Reliability:
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-mono font-semibold border',
                  reliabilityConfig.badgeClass
                )}
              >
                {reliabilityConfig.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {reliabilityReason}
            </p>
          </div>
        </div>

        <div className="text-right self-end sm:self-auto text-xs font-mono text-slate-400">
          Model: 14d WMA + DOW Seasonality
        </div>
      </div>
    </div>
  );
};
