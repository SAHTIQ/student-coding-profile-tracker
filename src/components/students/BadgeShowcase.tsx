import React from 'react';
import { LeetCodeBadge, ContestBadge } from '../../types/leetcode';
import { Award, Shield, Sparkles } from 'lucide-react';

interface BadgeShowcaseProps {
  badges: LeetCodeBadge[];
  contestBadge?: ContestBadge | null;
}

export const BadgeShowcase: React.FC<BadgeShowcaseProps> = ({ badges = [], contestBadge }) => {
  if (badges.length === 0 && !contestBadge) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            LeetCode Badges & Honors Shelf
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-500">
          {badges.length + (contestBadge ? 1 : 0)} Earned
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Contest Badge if available */}
        {contestBadge && (
          <div className="p-3 rounded-xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20 flex flex-col items-center text-center group hover:border-amber-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[100px]">
              {contestBadge.name}
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5 font-semibold">
              Contest Rank
            </span>
          </div>
        )}

        {/* Official Earned Badges */}
        {badges.map((b) => {
          const isSvgOrPng = b.icon && (b.icon.startsWith('http') || b.icon.startsWith('/'));
          const iconUrl = b.icon?.startsWith('http')
            ? b.icon
            : b.icon
            ? `https://leetcode.com${b.icon}`
            : '';

          return (
            <div
              key={b.id || b.name}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center text-center group hover:border-brand-500/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700/80 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform overflow-hidden p-1">
                {iconUrl ? (
                  <img
                    src={iconUrl}
                    alt={b.displayName || b.name}
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <Award className="w-6 h-6 text-brand-600" />
                )}
              </div>
              <span className="font-semibold text-slate-900 dark:text-white text-xs truncate max-w-[110px]" title={b.displayName || b.name}>
                {b.displayName || b.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                {b.creationDate ? b.creationDate.substring(0, 10) : 'Achievement'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
