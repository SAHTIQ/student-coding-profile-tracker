import { DailyActivityRecord } from '../types/leetcode';
import {
  ForecastHorizon,
  ForecastRecord,
  ForecastReliability,
  StudentForecastSummary,
} from '../types/forecast';
import { getISODateString } from '../utils/dateUtils';

export class ForecastService {
  /**
   * Generates a deterministic forecasting model using 14-day exponential-weighted moving average
   * calibrated with 7-day day-of-week seasonality factors.
   */
  static generateStudentForecast(
    studentId: string,
    username: string,
    timeline: DailyActivityRecord[],
    horizon: ForecastHorizon = 14
  ): StudentForecastSummary {
    const historicalObserved = timeline.slice(-60).map((t) => ({
      date: t.date,
      submissions: t.submissions,
    }));

    // Check for insufficient history
    if (!timeline || timeline.length < 14) {
      return {
        studentId,
        username,
        expectedSubmissions7d: 0,
        expectedActiveDays7d: 0,
        expectedWeeklyVolume: 0,
        historicalTrend: 'stable',
        recentConsistencyPct: 0,
        reliability: 'insufficient',
        reliabilityReason: 'Insufficient history for a reliable forecast (minimum 14 recorded days required).',
        forecastRecords: [],
        historicalObserved,
      };
    }

    // 1. Analyze recent 28 days for trend & consistency
    const recent28 = timeline.slice(-28);
    const activeDaysRecent = recent28.filter((d) => d.submissions > 0).length;
    const recentConsistencyPct = Math.round((activeDaysRecent / recent28.length) * 100);

    // Prior 28 days comparison
    const prior28 = timeline.slice(-56, -28);
    const recentSubs = recent28.reduce((s, d) => s + d.submissions, 0);
    const priorSubs = prior28.reduce((s, d) => s + d.submissions, 0);

    let historicalTrend: 'increasing' | 'stable' | 'declining' = 'stable';
    if (prior28.length >= 14) {
      const delta = recentSubs - priorSubs;
      if (delta > 8) historicalTrend = 'increasing';
      else if (delta < -8) historicalTrend = 'declining';
    }

    // 2. Compute Day of Week seasonality factor (Sunday = 0 .. Saturday = 6)
    const dowSums = [0, 0, 0, 0, 0, 0, 0];
    const dowCounts = [0, 0, 0, 0, 0, 0, 0];

    recent28.forEach((day) => {
      const dow = new Date(day.date).getDay();
      dowSums[dow] += day.submissions;
      dowCounts[dow] += 1;
    });

    const overallAvgPerDay = recentSubs / Math.max(1, recent28.length);
    const dowFactors = dowSums.map((sum, dow) => {
      const count = dowCounts[dow] || 1;
      const dowAvg = sum / count;
      if (overallAvgPerDay === 0) return 1.0;
      return Math.max(0.2, Math.min(2.5, dowAvg / overallAvgPerDay));
    });

    // 3. Weighted Moving Average baseline of recent 14 days
    const recent14 = timeline.slice(-14);
    let weightedSum = 0;
    let weightTotal = 0;
    recent14.forEach((day, idx) => {
      const weight = idx + 1; // More recent days carry higher weight
      weightedSum += day.submissions * weight;
      weightTotal += weight;
    });
    const baselineDailyAvg = weightTotal > 0 ? weightedSum / weightTotal : 0;

    // 4. Determine Forecast Reliability
    let reliability: ForecastReliability = 'moderate';
    let reliabilityReason = 'Calculated using 28-day baseline with day-of-week seasonality calibration.';

    if (timeline.length >= 60 && recentConsistencyPct >= 70) {
      reliability = 'high';
      reliabilityReason = 'High data density (>60 days observed) with strong practice consistency (>70%).';
    } else if (recentConsistencyPct < 25) {
      reliability = 'low';
      reliabilityReason = 'Low recent practice consistency (<25%) introduces wide variance in prediction bounds.';
    }

    // 5. Generate future projected records
    const forecastRecords: ForecastRecord[] = [];
    const lastDate = new Date(timeline[timeline.length - 1].date);
    const modelType = 'Seasonal Exponential Moving Average (14d WMA + DOW)';
    const generatedAt = new Date().toISOString();

    for (let dayOffset = 1; dayOffset <= horizon; dayOffset++) {
      const targetDate = new Date(lastDate);
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const dow = targetDate.getDay();
      const seasonFactor = dowFactors[dow];

      // Point prediction
      let pred = baselineDailyAvg * seasonFactor;
      if (pred < 0.2 && recentConsistencyPct < 30) pred = 0;

      // Variance increases with forecast horizon distance
      const uncertaintySlack = (dayOffset / horizon) * 1.4 + 0.6;
      const lowerBound = Math.max(0, Number((pred - uncertaintySlack).toFixed(1)));
      const upperBound = Number((pred + uncertaintySlack).toFixed(1));

      forecastRecords.push({
        date: getISODateString(targetDate),
        predictedSubmissions: Number(pred.toFixed(1)),
        lowerBound,
        upperBound,
        modelType,
        reliability,
        generatedAt,
      });
    }

    // 6. Aggregate 7-day projections
    const next7 = forecastRecords.slice(0, 7);
    const expectedSubmissions7d = Number(
      next7.reduce((sum, r) => sum + r.predictedSubmissions, 0).toFixed(1)
    );
    const expectedActiveDays7d = next7.filter((r) => r.predictedSubmissions >= 0.8).length;
    const expectedWeeklyVolume = Number((expectedSubmissions7d).toFixed(1));

    return {
      studentId,
      username,
      expectedSubmissions7d,
      expectedActiveDays7d,
      expectedWeeklyVolume,
      historicalTrend,
      recentConsistencyPct,
      reliability,
      reliabilityReason,
      forecastRecords,
      historicalObserved,
    };
  }
}
