import React from 'react';
import { CollectionStatus } from '../../types/student';
import { CheckCircle2, Clock, AlertTriangle, XCircle, RefreshCw, Slash } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CollectionStatusBadgeProps {
  status: CollectionStatus;
  className?: string;
  showIcon?: boolean;
}

export const CollectionStatusBadge: React.FC<CollectionStatusBadgeProps> = ({
  status,
  className,
  showIcon = true,
}) => {
  const config = {
    pending: {
      label: 'Pending Sync',
      icon: Clock,
      classes: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    },
    fetching: {
      label: 'Fetching Data...',
      icon: RefreshCw,
      classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 animate-pulse',
      iconClass: 'animate-spin',
    },
    success: {
      label: 'Profile Active',
      icon: CheckCircle2,
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    },
    not_found: {
      label: 'Profile Not Found',
      icon: Slash,
      classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    },
    rate_limited: {
      label: 'Rate Limited (429)',
      icon: AlertTriangle,
      classes: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    },
    failed: {
      label: 'Collection Failed',
      icon: XCircle,
      classes: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    },
  }[status] || {
    label: status,
    icon: Clock,
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        config.classes,
        className
      )}
    >
      {showIcon && <Icon className={cn('w-3.5 h-3.5 shrink-0', (config as { iconClass?: string }).iconClass)} />}
      <span>{config.label}</span>
    </span>
  );
};
