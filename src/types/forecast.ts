export type ForecastHorizon = 7 | 14 | 30;

export type ForecastReliability = 'high' | 'moderate' | 'low' | 'insufficient';

export interface ForecastRecord {
  date: string; // 'YYYY-MM-DD'
  predictedSubmissions: number;
  lowerBound?: number;
  upperBound?: number;
  modelType: string; // e.g. "Weighted Moving Average + Day-of-Week Seasonality"
  reliability: ForecastReliability;
  generatedAt: string;
}

export interface StudentForecastSummary {
  studentId: string;
  username: string;
  expectedSubmissions7d: number;
  expectedActiveDays7d: number;
  expectedWeeklyVolume: number;
  historicalTrend: 'increasing' | 'stable' | 'declining';
  recentConsistencyPct: number; // 0 - 100
  reliability: ForecastReliability;
  reliabilityReason: string;
  forecastRecords: ForecastRecord[];
  historicalObserved: Array<{
    date: string;
    submissions: number;
  }>;
}
