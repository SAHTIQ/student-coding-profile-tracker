import React, { useState } from 'react';
import { TagProblemCountsSummary } from '../../types/leetcode';
import { Code2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface LeetCodeSkillsCardProps {
  skills?: TagProblemCountsSummary;
}

export const LeetCodeSkillsCard: React.FC<LeetCodeSkillsCardProps> = ({ skills }) => {
  const [showAllIntermediate, setShowAllIntermediate] = useState(false);

  if (!skills) return null;

  const { advanced = [], intermediate = [], fundamental = [] } = skills;

  const totalSkillsCount = advanced.length + intermediate.length + fundamental.length;
  if (totalSkillsCount === 0) return null;

  const displayedIntermediate = showAllIntermediate
    ? intermediate
    : intermediate.slice(0, 10);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-brand-600" />
            <span>Skills & Topic Mastery</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified algorithmic concepts and Data Structures problem-solving breakdown
          </p>
        </div>
        <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {totalSkillsCount} Topics Solved
        </span>
      </div>

      {/* Advanced Section */}
      {advanced.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span>Advanced</span>
            <span className="text-[11px] font-mono text-slate-400 font-normal">
              ({advanced.length} concepts)
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {advanced.map((item) => (
              <span
                key={item.tagSlug}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-brand-500/50 transition-colors"
              >
                <span>{item.tagName}</span>
                <span className="font-mono text-[11px] text-slate-400 font-bold">
                  x{item.problemsSolved}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Intermediate Section */}
      {intermediate.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span>Intermediate</span>
            <span className="text-[11px] font-mono text-slate-400 font-normal">
              ({intermediate.length} concepts)
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {displayedIntermediate.map((item) => (
              <span
                key={item.tagSlug}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-brand-500/50 transition-colors"
              >
                <span>{item.tagName}</span>
                <span className="font-mono text-[11px] text-slate-400 font-bold">
                  x{item.problemsSolved}
                </span>
              </span>
            ))}
          </div>

          {intermediate.length > 10 && (
            <button
              onClick={() => setShowAllIntermediate(!showAllIntermediate)}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1 font-medium pt-1"
            >
              {showAllIntermediate ? (
                <>
                  <span>Show less</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Show {intermediate.length - 10} more</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Fundamental Section */}
      {fundamental.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Fundamental</span>
            <span className="text-[11px] font-mono text-slate-400 font-normal">
              ({fundamental.length} concepts)
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {fundamental.map((item) => (
              <span
                key={item.tagSlug}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-brand-500/50 transition-colors"
              >
                <span>{item.tagName}</span>
                <span className="font-mono text-[11px] text-slate-400 font-bold">
                  x{item.problemsSolved}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
