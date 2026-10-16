import React from 'react';
import { RecentAcceptedSubmission } from '../../types/leetcode';
import { formatDate } from '../../utils/dateUtils';
import { ExternalLink, CheckCircle2 } from 'lucide-react';

interface RecentSubmissionsTableProps {
  submissions: RecentAcceptedSubmission[];
  title?: string;
}

export const RecentSubmissionsTable: React.FC<RecentSubmissionsTableProps> = ({
  submissions,
  title = 'Recent Accepted Submissions',
}) => {
  if (!submissions || submissions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-card text-center text-xs text-slate-500">
        No recent accepted submissions found in the latest collected profile snapshot.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified accepted submissions retrieved from public activity log
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Showing latest {submissions.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
              <th className="py-2.5 px-3">Problem Title</th>
              <th className="py-2.5 px-3">Verification</th>
              <th className="py-2.5 px-3 text-right">Submitted</th>
              <th className="py-2.5 px-3 text-right">LeetCode</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {submissions.map((sub) => {
              const problemUrl = `https://leetcode.com/problems/${sub.titleSlug}/`;
              return (
                <tr
                  key={sub.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                    <a
                      href={problemUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-brand-600 transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>{sub.title}</span>
                    </a>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-mono">
                      <CheckCircle2 className="w-3 h-3" />
                      Accepted
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500 dark:text-slate-400 font-mono">
                    {formatDate(sub.timestamp)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <a
                      href={problemUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 inline-block transition-colors"
                      title="Open problem in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
