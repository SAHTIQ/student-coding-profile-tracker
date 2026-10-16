import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { StudentForecastSummary, ForecastHorizon } from '../../types/forecast';
import { formatDate } from '../../utils/dateUtils';
import { TrendingUp, Sparkles, HelpCircle } from 'lucide-react';

interface ForecastChartProps {
  summary: StudentForecastSummary;
  horizon: ForecastHorizon;
  onHorizonChange: (h: ForecastHorizon) => void;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  summary,
  horizon,
  onHorizonChange,
}) => {
  if (summary.reliability === 'insufficient') {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-8 shadow-card text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Insufficient History for a Reliable Forecast
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
          {summary.reliabilityReason} We require at least 14 days of recorded submissions to construct a statistically grounded baseline without speculative projection.
        </p>
      </div>
    );
  }

  // Combine historical (last 30 days) and projected future records
  const recentHistory = summary.historicalObserved.slice(-30).map((h) => ({
    date: h.date,
    historical: h.submissions,
    forecast: null as number | null,
    lowerBound: null as number | null,
    upperBound: null as number | null,
    isForecast: false,
  }));

  // Bridge connection point: last historical point is starting point for forecast
  const lastObs = recentHistory[recentHistory.length - 1];
  const forecastRecords = summary.forecastRecords.slice(0, horizon).map((f) => ({
    date: f.date,
    historical: null as number | null,
    forecast: f.predictedSubmissions,
    lowerBound: f.lowerBound ?? f.predictedSubmissions,
    upperBound: f.upperBound ?? f.predictedSubmissions,
    isForecast: true,
  }));

  // Attach first forecast point to last historical point so lines connect seamlessly
  if (lastObs) {
    lastObs.forecast = lastObs.historical;
    lastObs.lowerBound = lastObs.historical;
    lastObs.upperBound = lastObs.historical;
  }

  const combinedData = [...recentHistory, ...forecastRecords];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              Activity Horizon & Trajectory Forecast
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Deterministic Baseline
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Past 30-day observed submissions combined with projected {horizon}-day weighted seasonal trajectory
          </p>
        </div>

        {/* Forecast Horizon Selector */}
        <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono">
          <span className="text-[11px] text-slate-400 px-2 font-sans hidden sm:inline">Horizon:</span>
          {([7, 14, 30] as ForecastHorizon[]).map((h) => (
            <button
              key={h}
              onClick={() => onHorizonChange(h)}
              className={`px-3 py-1 rounded-md transition-all ${
                horizon === h
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {h} Days
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combinedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastBoundGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818CF8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#818CF8" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#64748B' }}
              tickFormatter={(d) => d.substring(5)}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#64748B' }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl text-xs space-y-1.5 border border-slate-700">
                      <p className="font-semibold text-slate-300 font-mono">
                        {formatDate(d.date)} {d.isForecast ? '(Projected)' : '(Observed)'}
                      </p>
                      {d.historical !== null && (
                        <p className="text-blue-400 font-mono">
                          Observed: <strong className="text-white">{d.historical}</strong> submissions
                        </p>
                      )}
                      {d.forecast !== null && (
                        <p className="text-indigo-400 font-mono">
                          Projected: <strong className="text-white">{d.forecast}</strong> submissions
                        </p>
                      )}
                      {d.isForecast && (
                        <p className="text-slate-400 text-[10px] font-mono">
                          Variance bounds: {d.lowerBound} – {d.upperBound}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
            />
            {/* Uncertainty Bounds Area */}
            <Area
              name="Uncertainty Range"
              dataKey="upperBound"
              fill="url(#forecastBoundGradient)"
              stroke="none"
            />
            {/* Historical Observations Line */}
            <Line
              name="Historical Activity"
              type="monotone"
              dataKey="historical"
              stroke="#2563EB"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: '#2563EB' }}
            />
            {/* Forecast Projection Line */}
            <Line
              name="Projected Forecast"
              type="monotone"
              dataKey="forecast"
              stroke="#6366F1"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#6366F1' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span>Forecasts represent statistical estimates derived from practice momentum, not guaranteed outcomes.</span>
      </div>
    </div>
  );
};
