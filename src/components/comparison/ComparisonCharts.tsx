import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Student } from '../../types/student';
import { LeetCodeProfile } from '../../types/leetcode';
import { BarChart3 } from 'lucide-react';

interface ComparisonChartsProps {
  students: Student[];
  profiles: Record<string, LeetCodeProfile>;
}

export const ComparisonCharts: React.FC<ComparisonChartsProps> = ({ students, profiles }) => {
  if (students.length === 0) return null;

  // Grouped difficulty data sorted by total solved descending
  const difficultyData = students
    .map((s) => {
      const p = profiles[s.leetcodeUsername.toLowerCase()];
      const easy = p?.problemStatistics.easy || 0;
      const medium = p?.problemStatistics.medium || 0;
      const hard = p?.problemStatistics.hard || 0;
      const total = p?.problemStatistics.all || easy + medium + hard;

      return {
        name: s.displayName.length > 14 ? `${s.displayName.substring(0, 12)}…` : s.displayName,
        fullName: s.displayName,
        username: s.leetcodeUsername,
        Easy: easy,
        Medium: medium,
        Hard: hard,
        Total: total,
      };
    })
    .sort((a, b) => b.Total - a.Total);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-600" />
            <span>Solved Problems by Difficulty Tier</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cohort-wide breakdown of Easy, Medium, and Hard problems solved (sorted by total problems solved)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" /> Easy
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" /> Medium
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" /> Hard
            </span>
          </div>

          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {students.length} Students
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={difficultyData}
            margin={{
              top: 10,
              right: 15,
              left: -15,
              bottom: difficultyData.length > 6 ? 24 : 8,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              tick={{ fontSize: 11, fill: '#64748B' }}
              interval={0}
              angle={difficultyData.length > 5 ? -25 : 0}
              textAnchor={difficultyData.length > 5 ? 'end' : 'middle'}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white rounded-lg p-3 text-xs shadow-xl border border-slate-800 space-y-1.5 min-w-[160px]">
                      <div className="font-semibold text-white border-b border-slate-800 pb-1">
                        {data.fullName}
                        <span className="block text-[11px] font-mono text-slate-400 font-normal">
                          @{data.username}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-400">
                        <span>Easy:</span>
                        <span className="font-mono font-bold">{data.Easy}</span>
                      </div>
                      <div className="flex justify-between items-center text-amber-400">
                        <span>Medium:</span>
                        <span className="font-mono font-bold">{data.Medium}</span>
                      </div>
                      <div className="flex justify-between items-center text-rose-400">
                        <span>Hard:</span>
                        <span className="font-mono font-bold">{data.Hard}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-800 font-bold text-white">
                        <span>Total Solved:</span>
                        <span className="font-mono text-brand-400">{data.Total}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
            />
            <Bar dataKey="Easy" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={45} />
            <Bar dataKey="Medium" fill="#F59E0B" radius={[3, 3, 0, 0]} maxBarSize={45} />
            <Bar dataKey="Hard" fill="#EF4444" radius={[3, 3, 0, 0]} maxBarSize={45} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
