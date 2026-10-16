export interface CohortOverviewKPIs {
  totalStudents: number;
  profilesCollected: number;
  totalProblemsSolved: number;
  totalActiveDays: number;
  averageProblemsSolved: number;
  averageActiveDays: number;
  activeStudentsInPeriod: number;
  // Percentage comparisons with previous period
  totalStudentsDelta?: number;
  profilesCollectedDelta?: number;
  problemsSolvedDelta?: number;
  activeDaysDelta?: number;
  avgProblemsDelta?: number;
  avgActiveDaysDelta?: number;
  activeStudentsDelta?: number;
}

export interface BehavioralInsight {
  id: string;
  title: string;
  shortExplanation: string;
  supportingMetric: string;
  trendDirection: 'positive' | 'negative' | 'neutral';
  recommendation: string;
}

export interface ActivityAggregationItem {
  period: string; // date or week label
  date: string;
  submissions: number;
  activeStudents?: number;
}

export type TimeGranularity = 'daily' | 'weekly' | 'monthly';
export type DateRangePreset = '7d' | '30d' | '90d' | '180d' | '1y' | 'all';
