import { Student } from '../types/student';
import { LeetCodeProfile } from '../types/leetcode';
import { MockCollectionService } from './mockCollectionService';
import { CohortOverviewKPIs, ActivityAggregationItem, TimeGranularity } from '../types/analytics';

export class AnalyticsService {
  /**
   * Computes platform-wide Super Admin KPIs
   */
  static getCohortKPIs(students: Student[], daysLookback: number = 30): CohortOverviewKPIs {
    const totalStudents = students.length;
    const collectedStudents = students.filter((s) => s.collectionStatus === 'success');
    const profiles = MockCollectionService.getStoredProfiles();

    let totalProblemsSolved = 0;
    let totalActiveDays = 0;
    let activeStudentsCount = 0;

    const lookbackCutoff = new Date();
    lookbackCutoff.setDate(lookbackCutoff.getDate() - daysLookback);

    collectedStudents.forEach((s) => {
      const p = profiles[s.leetcodeUsername.toLowerCase()];
      if (p) {
        totalProblemsSolved += p.problemStatistics.all;
        totalActiveDays += p.calendarSummary.totalActiveDays;

        // Check if student has submissions within daysLookback
        const hasRecentActivity = p.dailyActivityTimeline.some((record) => {
          if (record.submissions <= 0) return false;
          const recDate = new Date(record.date);
          return recDate >= lookbackCutoff;
        });

        if (hasRecentActivity) {
          activeStudentsCount++;
        }
      }
    });

    const averageProblemsSolved =
      collectedStudents.length > 0
        ? Math.round(totalProblemsSolved / collectedStudents.length)
        : 0;

    const averageActiveDays =
      collectedStudents.length > 0
        ? Math.round(totalActiveDays / collectedStudents.length)
        : 0;

    // Period-over-period deltas only when data exists
    return {
      totalStudents,
      profilesCollected: collectedStudents.length,
      totalProblemsSolved,
      totalActiveDays,
      averageProblemsSolved,
      averageActiveDays,
      activeStudentsInPeriod: activeStudentsCount,
      totalStudentsDelta: totalStudents > 0 ? 0 : undefined,
      profilesCollectedDelta: collectedStudents.length > 0 ? 0 : undefined,
      problemsSolvedDelta: totalProblemsSolved > 0 ? 0 : undefined,
      activeDaysDelta: totalActiveDays > 0 ? 0 : undefined,
      avgProblemsDelta: averageProblemsSolved > 0 ? 0 : undefined,
      avgActiveDaysDelta: averageActiveDays > 0 ? 0 : undefined,
      activeStudentsDelta: activeStudentsCount > 0 ? 0 : undefined,
    };
  }

  /**
   * Aggregates cohort coding activity time series by daily, weekly, or monthly granularity
   */
  static getCohortActivityTimeline(
    students: Student[],
    granularity: TimeGranularity = 'daily',
    daysCount: number = 60
  ): ActivityAggregationItem[] {
    const profiles = MockCollectionService.getStoredProfiles();
    const collectedUsernames = students
      .filter((s) => s.collectionStatus === 'success')
      .map((s) => s.leetcodeUsername.toLowerCase());

    const dateMap = new Map<string, { submissions: number; activeStudents: Set<string> }>();

    collectedUsernames.forEach((uname) => {
      const profile = profiles[uname];
      if (!profile) return;

      const recentTimeline = profile.dailyActivityTimeline.slice(-daysCount);
      recentTimeline.forEach((record) => {
        if (!dateMap.has(record.date)) {
          dateMap.set(record.date, { submissions: 0, activeStudents: new Set() });
        }
        const entry = dateMap.get(record.date)!;
        entry.submissions += record.submissions;
        if (record.submissions > 0) {
          entry.activeStudents.add(uname);
        }
      });
    });

    // Sort by date ascending
    const sortedDates = Array.from(dateMap.keys()).sort();

    if (granularity === 'daily') {
      return sortedDates.map((date) => {
        const item = dateMap.get(date)!;
        return {
          period: date.substring(5), // 'MM-DD'
          date,
          submissions: item.submissions,
          activeStudents: item.activeStudents.size,
        };
      });
    }

    if (granularity === 'weekly') {
      const weeks: ActivityAggregationItem[] = [];
      for (let i = 0; i < sortedDates.length; i += 7) {
        const chunk = sortedDates.slice(i, i + 7);
        if (chunk.length === 0) continue;
        const totalSubs = chunk.reduce(
          (sum, d) => sum + (dateMap.get(d)?.submissions || 0),
          0
        );
        const uniqueActive = new Set<string>();
        chunk.forEach((d) => {
          dateMap.get(d)?.activeStudents.forEach((u) => uniqueActive.add(u));
        });

        const startDate = chunk[0].substring(5);
        const endDate = chunk[chunk.length - 1].substring(5);
        weeks.push({
          period: `${startDate} - ${endDate}`,
          date: chunk[0],
          submissions: totalSubs,
          activeStudents: uniqueActive.size,
        });
      }
      return weeks;
    }

    // Monthly
    const monthMap = new Map<string, { submissions: number; activeStudents: Set<string> }>();
    sortedDates.forEach((date) => {
      const ym = date.substring(0, 7); // 'YYYY-MM'
      if (!monthMap.has(ym)) {
        monthMap.set(ym, { submissions: 0, activeStudents: new Set() });
      }
      const entry = monthMap.get(ym)!;
      entry.submissions += dateMap.get(date)?.submissions || 0;
      dateMap.get(date)?.activeStudents.forEach((u) => entry.activeStudents.add(u));
    });

    return Array.from(monthMap.entries()).map(([ym, data]) => ({
      period: ym,
      date: `${ym}-01`,
      submissions: data.submissions,
      activeStudents: data.activeStudents.size,
    }));
  }

  /**
   * Stacked bar chart data for problem solving progress across top students
   */
  static getTopStudentsProblemProgress(students: Student[], limit: number = 8) {
    const profiles = MockCollectionService.getStoredProfiles();
    const collected = students.filter((s) => s.collectionStatus === 'success');

    const mapped = collected.map((s) => {
      const p = profiles[s.leetcodeUsername.toLowerCase()];
      return {
        id: s.id,
        name: s.displayName || s.leetcodeUsername,
        username: s.leetcodeUsername,
        total: p?.problemStatistics.all || 0,
        easy: p?.problemStatistics.easy || 0,
        medium: p?.problemStatistics.medium || 0,
        hard: p?.problemStatistics.hard || 0,
      };
    });

    mapped.sort((a, b) => b.total - a.total);
    return mapped.slice(0, limit);
  }

  /**
   * Contest rating distribution brackets
   */
  static getContestRatingDistribution(students: Student[]) {
    const profiles = MockCollectionService.getStoredProfiles();
    const brackets = [
      { bracket: '< 1500 (Novice)', count: 0, color: '#94A3B8' },
      { bracket: '1500 - 1700 (Intermediate)', count: 0, color: '#3B82F6' },
      { bracket: '1700 - 1900 (Advanced)', count: 0, color: '#10B981' },
      { bracket: '1900 - 2100 (Knight)', count: 0, color: '#8B5CF6' },
      { bracket: '2100+ (Guardian)', count: 0, color: '#F59E0B' },
      { bracket: 'Unrated (0 Contests)', count: 0, color: '#CBD5E1' },
    ];

    students
      .filter((s) => s.collectionStatus === 'success')
      .forEach((s) => {
        const p = profiles[s.leetcodeUsername.toLowerCase()];
        const rating = p?.contestSummary?.rating;
        if (!rating || p?.contestSummary?.attendedContestsCount === 0) {
          brackets[5].count++;
        } else if (rating < 1500) {
          brackets[0].count++;
        } else if (rating < 1700) {
          brackets[1].count++;
        } else if (rating < 1900) {
          brackets[2].count++;
        } else if (rating < 2100) {
          brackets[3].count++;
        } else {
          brackets[4].count++;
        }
      });

    return brackets;
  }
}
