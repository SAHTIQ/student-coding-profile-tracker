import React from 'react';
import { LanguageStat } from '../../types/leetcode';
import { Code2 } from 'lucide-react';

interface LanguageDistributionChartProps {
  languages: LanguageStat[];
  title?: string;
}

export const LanguageDistributionChart: React.FC<LanguageDistributionChartProps> = ({
  languages,
  title = 'Programming Language Preferences',
}) => {
  const totalSolvedAcrossLangs = languages.reduce((acc, l) => acc + l.problemsSolved, 0);

  // Language brand colors
  const getLangColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('c++')) return 'bg-blue-600';
    if (n.includes('python')) return 'bg-amber-500';
    if (n.includes('java') && !n.includes('script')) return 'bg-orange-600';
    if (n.includes('type')) return 'bg-sky-500';
    if (n.includes('script')) return 'bg-yellow-400';
    if (n.includes('go')) return 'bg-cyan-500';
    if (n.includes('rust')) return 'bg-red-700';
    if (n.includes('sql')) return 'bg-purple-600';
    return 'bg-slate-500';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-brand-600" />
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Solutions categorized by implementation language
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {languages.map((lang) => {
          const pct =
            totalSolvedAcrossLangs > 0
              ? ((lang.problemsSolved / totalSolvedAcrossLangs) * 100).toFixed(1)
              : '0';
          const colorClass = getLangColor(lang.languageName);

          return (
            <div key={lang.languageName} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-800 dark:text-slate-200 font-mono">
                  {lang.languageName}
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-mono">
                  <strong className="text-slate-900 dark:text-white">{lang.problemsSolved}</strong> problems ({pct}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  style={{ width: `${pct}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
        * Percentage calculated relative to total language-attributed problem submissions ({totalSolvedAcrossLangs}).
      </p>
    </div>
  );
};
