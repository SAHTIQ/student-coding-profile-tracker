import React from 'react';
import { BehavioralInsight } from '../../types/analytics';
import { Sparkles, TrendingUp, TrendingDown, Minus, Lightbulb, Compass } from 'lucide-react';
import { cn } from '../../utils/cn';

interface BehavioralInsightsCardProps {
  insights: BehavioralInsight[];
  title?: string;
}

export const BehavioralInsightsCard: React.FC<BehavioralInsightsCardProps> = ({
  insights,
  title = 'Coding Behavior Insights & Pattern Diagnostics',
}) => {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Algorithmic practice frequency, difficulty pacing, and temporal pattern diagnostics derived from recorded submission history.
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {insights.length} Signals Identified
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight) => {
          const isPositive = insight.trendDirection === 'positive';
          const isNegative = insight.trendDirection === 'negative';

          return (
            <div
              key={insight.id}
              className="flex flex-col justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {insight.title}
                  </h4>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[11px] font-medium font-mono px-2 py-0.5 rounded-full shrink-0',
                      isPositive && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
                      isNegative && 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
                      !isPositive && !isNegative && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    )}
                  >
                    {isPositive && <TrendingUp className="w-3 h-3" />}
                    {isNegative && <TrendingDown className="w-3 h-3" />}
                    {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
                    <span>{insight.supportingMetric}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  {insight.shortExplanation}
                </p>
              </div>

              {/* Actionable Recommendation */}
              <div className="flex items-start gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  <strong className="text-slate-800 dark:text-slate-200 not-italic font-medium">Recommendation: </strong>
                  {insight.recommendation}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span>Insights analyze objective timeline data points and historical practice trends. No subjective traits are assumed.</span>
      </div>
    </div>
  );
};
