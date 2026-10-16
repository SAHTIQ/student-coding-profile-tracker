import { LeetCodeProfile } from '../types/leetcode';
import { BehavioralInsight } from '../types/analytics';

/**
 * Calculates acceptance rate based on aggregate accepted vs total submissions.
 * Guaranteed to not average percentages.
 */
export function calculateAcceptanceRate(accepted: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((accepted / total) * 100).toFixed(1));
}

/**
 * Counts days with at least 1 submission within the given daily activity timeline.
 */
export function calculateActiveDays(timeline: Array<{ date: string; submissions: number }>): number {
  return timeline.filter((d) => d.submissions > 0).length;
}

/**
 * Consistency metric: Percentage of active days within the specified number of recent days.
 */
export function calculateConsistencyRate(
  timeline: Array<{ date: string; submissions: number }>,
  lookbackDays: number = 30
): number {
  if (!timeline || timeline.length === 0) return 0;
  const recent = timeline.slice(-lookbackDays);
  if (recent.length === 0) return 0;
  const activeCount = recent.filter((d) => d.submissions > 0).length;
  return Number(((activeCount / recent.length) * 100).toFixed(1));
}

/**
 * Calculates current active streak from timeline (from latest backwards).
 */
export function calculateCurrentStreak(timeline: Array<{ date: string; submissions: number }>): number {
  if (!timeline || timeline.length === 0) return 0;
  let streak = 0;
  for (let i = timeline.length - 1; i >= 0; i--) {
    if (timeline[i].submissions > 0) {
      streak++;
    } else {
      // If today has 0 submissions, allow streak from yesterday
      if (i === timeline.length - 1) continue;
      break;
    }
  }
  return streak;
}

/**
 * Calculates longest continuous streak recorded in timeline.
 */
export function calculateLongestStreak(timeline: Array<{ date: string; submissions: number }>): number {
  if (!timeline || timeline.length === 0) return 0;
  let maxStreak = 0;
  let current = 0;
  for (const day of timeline) {
    if (day.submissions > 0) {
      current++;
      if (current > maxStreak) maxStreak = current;
    } else {
      current = 0;
    }
  }
  return maxStreak;
}

/**
 * Returns public LeetCode profile URL
 */
export function getLeetCodeProfileUrl(username: string): string {
  return `https://leetcode.com/u/${encodeURIComponent(username)}`;
}

/**
 * Extracts clean LeetCode username from a raw username or full profile URL.
 * Handles inputs like:
 * - https://leetcode.com/u/neal_wu/
 * - https://leetcode.com/lee215
 * - leetcode.com/u/tourist
 * - @username
 * - username
 */
export function extractLeetCodeUsername(input: string): string {
  if (!input) return '';
  let str = input.trim();
  str = str.replace(/^https?:\/\//i, '');
  str = str.replace(/^www\./i, '');
  str = str.replace(/^leetcode\.com\//i, '');
  str = str.replace(/^u\//i, '');
  str = str.replace(/^@/, '');
  str = str.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return str.trim();
}

/**
 * Generates dynamic, evidence-based behavioral insights from actual profile data.
 * Complies with Section 9.I:
 * - Title
 * - Short explanation
 * - Supporting metric
 * - Trend direction
 * - Practical recommendation
 */
export function generateBehavioralInsights(profile: LeetCodeProfile): BehavioralInsight[] {
  const insights: BehavioralInsight[] = [];
  const timeline = profile.dailyActivityTimeline || [];
  
  if (timeline.length < 14) {
    insights.push({
      id: 'ins-sparse',
      title: 'Limited Historical Activity Tracked',
      shortExplanation: 'Fewer than 14 days of activity history are currently recorded.',
      supportingMetric: `${timeline.length} recorded days`,
      trendDirection: 'neutral',
      recommendation: 'Log in and submit problems consistently over the next 2-3 weeks to build baseline behavioral analytics.',
    });
    return insights;
  }

  // 1. Weekly activity consistency comparison (Last 4 weeks vs previous 4 weeks)
  const last28 = timeline.slice(-28);
  const prev28 = timeline.slice(-56, -28);
  
  const lastActiveDays = last28.filter(d => d.submissions > 0).length;
  const prevActiveDays = prev28.length > 0 ? prev28.filter(d => d.submissions > 0).length : 0;
  
  const lastSubmissions = last28.reduce((acc, d) => acc + d.submissions, 0);
  const prevSubmissions = prev28.reduce((acc, d) => acc + d.submissions, 0);

  if (prev28.length >= 14) {
    if (lastActiveDays > prevActiveDays) {
      insights.push({
        id: 'ins-consistency-up',
        title: 'Accelerating Coding Consistency',
        shortExplanation: `Active on ${lastActiveDays} days during the last 4 weeks compared to ${prevActiveDays} days in the prior 4-week period.`,
        supportingMetric: `+${lastActiveDays - prevActiveDays} active days (+${Math.round(((lastActiveDays - prevActiveDays) / Math.max(1, prevActiveDays)) * 100)}%)`,
        trendDirection: 'positive',
        recommendation: 'Maintain your current study rhythm. Your daily problem-solving routine shows solid momentum.',
      });
    } else if (lastActiveDays < prevActiveDays) {
      insights.push({
        id: 'ins-consistency-down',
        title: 'Decreased Practice Frequency',
        shortExplanation: `Active on ${lastActiveDays} days in the last 4 weeks, down from ${prevActiveDays} days previously.`,
        supportingMetric: `${lastActiveDays - prevActiveDays} active days`,
        trendDirection: 'negative',
        recommendation: 'Try scheduling a 25-minute daily focus block for one LeetCode problem to rebuild steady cadence.',
      });
    } else {
      insights.push({
        id: 'ins-consistency-stable',
        title: 'Steady Practice Cadence',
        shortExplanation: `Maintained consistent active frequency with ${lastActiveDays} active days per 4-week window.`,
        supportingMetric: `${Math.round((lastActiveDays / 28) * 100)}% active rate`,
        trendDirection: 'neutral',
        recommendation: 'Good steady commitment. Consider incrementally increasing problem difficulty to test problem-solving boundaries.',
      });
    }
  }

  // 2. Weekday vs Weekend distribution
  let weekdaySubs = 0;
  let weekendSubs = 0;
  let weekdayDays = 0;
  let weekendDays = 0;

  last28.forEach(d => {
    const dayOfWeek = new Date(d.date).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendSubs += d.submissions;
      weekendDays++;
    } else {
      weekdaySubs += d.submissions;
      weekdayDays++;
    }
  });

  const avgWeekday = weekdayDays > 0 ? (weekdaySubs / weekdayDays) : 0;
  const avgWeekend = weekendDays > 0 ? (weekendSubs / weekendDays) : 0;

  if (avgWeekend > avgWeekday * 1.5 && weekendSubs > 5) {
    insights.push({
      id: 'ins-weekend-heavy',
      title: 'Weekend Sprint Practice Pattern',
      shortExplanation: 'Submissions are significantly concentrated on Saturdays and Sundays rather than distributed through workdays.',
      supportingMetric: `${avgWeekend.toFixed(1)} avg subs/weekend day vs ${avgWeekday.toFixed(1)} weekday`,
      trendDirection: 'neutral',
      recommendation: 'Spreading 1 problem onto Tuesday and Thursday can improve memory retention better than batching all problems into weekends.',
    });
  } else if (avgWeekday > avgWeekend * 1.5 && weekdaySubs > 5) {
    insights.push({
      id: 'ins-weekday-focus',
      title: 'Weekday Routine Alignment',
      shortExplanation: 'Practicing primarily during weekdays alongside coursework or work schedules.',
      supportingMetric: `${avgWeekday.toFixed(1)} avg subs/weekday vs ${avgWeekend.toFixed(1)} weekend`,
      trendDirection: 'positive',
      recommendation: 'Strong habit integration into your daily work week. Use weekends for contest participation or deep-dive mock interviews.',
    });
  }

  // 3. Problem Difficulty Distribution Insight
  const { easy, medium, hard, all } = profile.problemStatistics;
  if (all > 0) {
    const mediumRatio = medium / all;
    const hardRatio = hard / all;
    const easyRatio = easy / all;

    if (easyRatio > 0.65 && all > 30) {
      insights.push({
        id: 'ins-difficulty-easy',
        title: 'High Easy-Problem Concentration',
        shortExplanation: `${Math.round(easyRatio * 100)}% of solved problems are Easy. Strong baseline mechanics established.`,
        supportingMetric: `${easy} Easy / ${medium} Medium / ${hard} Hard`,
        trendDirection: 'neutral',
        recommendation: 'Transition to Medium-tier problems (especially Dynamic Programming, Graphs, and Trees) to prepare for standard technical interview bars.',
      });
    } else if (mediumRatio > 0.45) {
      insights.push({
        id: 'ins-difficulty-medium-balanced',
        title: 'Targeted Interview-Grade Distribution',
        shortExplanation: `Over 45% of solved problems are Medium difficulty, reflecting focused technical interview preparation.`,
        supportingMetric: `${Math.round(mediumRatio * 100)}% Medium tier (${medium} solved)`,
        trendDirection: 'positive',
        recommendation: 'Excellent distribution. Start tackling 1 Hard problem every 10 Mediums to master complex state transitions and optimization techniques.',
      });
    }
  }

  // 4. Contest participation insight
  if (profile.contestSummary && profile.contestSummary.attendedContestsCount > 0) {
    insights.push({
      id: 'ins-contest-active',
      title: 'Active Competitive Participant',
      shortExplanation: `Participated in ${profile.contestSummary.attendedContestsCount} official LeetCode contests with rating ${Math.round(profile.contestSummary.rating || 1500)}.`,
      supportingMetric: `Top ${profile.contestSummary.topPercentage ? profile.contestSummary.topPercentage.toFixed(1) + '%' : 'contender'}`,
      trendDirection: 'positive',
      recommendation: 'Contests build real-time problem-solving under pressure. Review unsolved problems during post-contest virtual upside solving.',
    });
  } else {
    insights.push({
      id: 'ins-contest-none',
      title: 'Contest Upskilling Opportunity',
      shortExplanation: 'No official weekly or biweekly contest participation recorded on this profile.',
      supportingMetric: '0 contests attended',
      trendDirection: 'neutral',
      recommendation: 'Joining LeetCode Weekly Contests will help calibrate pacing under timed conditions and uncover unseen problem templates.',
    });
  }

  return insights;
}
