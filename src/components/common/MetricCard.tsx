import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '../../utils/cn';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  delta?: number;
  deltaLabel?: string;
  icon?: LucideIcon;
  iconColor?: string;
  tooltip?: string;
  className?: string;
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  delta,
  deltaLabel = 'vs previous period',
  icon: Icon,
  iconColor = 'text-brand-600',
  tooltip,
  className,
  badge,
}) => {
  const isPositive = delta !== undefined && delta > 0;
  const isNegative = delta !== undefined && delta < 0;
  const isNeutral = delta !== undefined && delta === 0;

  return (
    <div
      className={cn(
        'relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card transition-all hover:border-slate-300 dark:hover:border-slate-700',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <span>{title}</span>
          {tooltip && (
            <div className="group relative cursor-help">
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block z-30 w-48 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-2.5 py-1.5 text-xs font-normal normal-case shadow-lg">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80', iconColor)}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
          {value}
        </span>
        {badge && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
        {subtitle && <span>{subtitle}</span>}
        {delta !== undefined && (
          <div
            className={cn(
              'inline-flex items-center gap-0.5 font-medium',
              isPositive && 'text-emerald-600 dark:text-emerald-400',
              isNegative && 'text-rose-600 dark:text-rose-400',
              isNeutral && 'text-slate-500'
            )}
            title={deltaLabel}
          >
            {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
            {isNeutral && <Minus className="w-3.5 h-3.5" />}
            <span>
              {isPositive ? `+${delta}%` : `${delta}%`}
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-normal ml-1 hidden sm:inline">
              {deltaLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
