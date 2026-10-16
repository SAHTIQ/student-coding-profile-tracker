import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TimeGranularity, ActivityAggregationItem } from '../../types/analytics';

interface ActivityTrendChartProps {
  data: ActivityAggregationItem[];
  granularity: TimeGranularity;
  onGranularityChange?: (g: TimeGranularity) => void;
  title?: string;
  subtitle?: string;
}

export const ActivityTrendChart: React.FC<ActivityTrendChartProps> = ({
  data,
  granularity,
  onGranularityChange,
  title = 'Coding Activity Overview',
  subtitle = 'Submission volume and practice trends over time',
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        {onGranularityChange && (
          <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium">
            {(['daily', 'weekly', 'monthly'] as TimeGranularity[]).map((g) => (
              <button
                key={g}
                onClick={() => onGranularityChange(g)}
                className={`px-3 py-1 rounded-md capitalize transition-all ${
                  granularity === g
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as ActivityAggregationItem;
                  return (
                    <div className="bg-slate-900 text-white rounded-lg p-2.5 shadow-xl text-xs space-y-1 border border-slate-700">
                      <p className="font-semibold text-slate-300">{item.date || item.period}</p>
                      <p className="text-brand-400 font-mono">
                        <strong className="text-white text-sm">{item.submissions}</strong> Submissions
                      </p>
                      {item.activeStudents !== undefined && (
                        <p className="text-slate-400">
                          {item.activeStudents} active {item.activeStudents === 1 ? 'coder' : 'coders'}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="submissions"
              stroke="#2563EB"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#activityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
