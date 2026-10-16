import React from 'react';
import { cn } from '../../utils/cn';

interface DifficultyBadgeProps {
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'easy' | 'medium' | 'hard';
  count?: number;
  className?: string;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({
  difficulty,
  count,
  className,
}) => {
  const norm = difficulty.toLowerCase();

  const styles = {
    easy: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    hard: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
  }[norm] || 'bg-slate-100 text-slate-700 border-slate-200';

  const label = norm.charAt(0).toUpperCase() + norm.slice(1);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold font-mono border',
        styles,
        className
      )}
    >
      <span>{label}</span>
      {count !== undefined && <span className="font-bold opacity-90">{count}</span>}
    </span>
  );
};

export const TagPill: React.FC<{ label: string; className?: string }> = ({ label, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700',
        className
      )}
    >
      {label}
    </span>
  );
};
