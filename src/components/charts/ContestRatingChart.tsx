import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ContestHistoryRecord, ContestSummary } from '../../types/leetcode';
import { Trophy, TrendingUp, Award } from 'lucide-react';

interface ContestRatingChartProps {
  summary: ContestSummary | null;
  history: ContestHistoryRecord[];
  title?: string;
}

export const ContestRatingChart: React.FC<ContestRatingChartProps> = ({
  summary,
  history,
  title = 'Contest Performance & Rating History',
}) => {
  if (!summary || summary.attendedContestsCount === 0 || history.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-8 shadow-card text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-6 h-6 stroke-[1.5]" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          No Contest History Recorded
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
          This student has not participated in official LeetCode Weekly or Biweekly contests yet. Rating history will populate once contest results are published.
        </p>
      </div>
    );
  }

  const chartData = [...history].reverse().map((item) => ({
    name: item.contestTitle.replace('Weekly Contest ', 'WC ').replace('Biweekly Contest ', 'BC '),
    fullTitle: item.contestTitle,
    rating: Math.round(item.rating),
    solved: `${item.problemsSolved}/${item.totalProblems}`,
    ranking: `#${item.ranking.toLocaleString()}`,
  }));

  const minRating = Math.min(...chartData.map((d) => d.rating));
  const maxRating = Math.max(...chartData.map((d) => d.rating));
  const yDomain = [Math.floor((minRating - 50) / 50) * 50, Math.ceil((maxRating + 50) / 50) * 50];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rating progression across official competitive rounds
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Current Rating</span>
            <span className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1 justify-end">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              {Math.round(summary.rating || 0)}
            </span>
          </div>
          {summary.topPercentage !== null && (
            <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block text-[11px]">Global Standing</span>
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                <Award className="w-3 h-3" />
                Top {summary.topPercentage.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
            />
            <YAxis
              domain={yDomain}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white rounded-lg p-2.5 shadow-xl text-xs space-y-1 border border-slate-700">
                      <p className="font-semibold text-slate-300">{d.fullTitle}</p>
                      <p className="text-amber-400 font-mono font-bold text-sm">
                        Rating: {d.rating}
                      </p>
                      <p className="text-slate-300">
                        Solved: <strong>{d.solved}</strong> | Rank: <strong>{d.ranking}</strong>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="rating"
              stroke="#F59E0B"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#F59E0B', stroke: '#fff', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: '#D97706' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
