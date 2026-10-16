import { DailyActivityRecord, RecentAcceptedSubmission, SolvedProblemRecord } from '../types/leetcode';

export interface DailyActivityItem {
  date: string; // YYYY-MM-DD
  count: number; // Exact count of unique problems solved (1 problem = 1 count)
  dayOfWeek: string; // Mon, Tue, etc.
  problems: SolvedProblemRecord[];
}

export interface WeeklyActivityItem {
  weekKey: string; // YYYY-Www
  weekLabel: string; // e.g., "Oct 06 - Oct 12, 2026"
  totalSolved: number; // Exact count of unique problems solved (1 problem = 1 count)
  activeDays: number;
  problems: SolvedProblemRecord[];
}

export interface MonthlyActivityItem {
  monthKey: string; // YYYY-MM
  monthLabel: string; // e.g., "October 2026"
  totalSolved: number; // Exact count of unique problems solved (1 problem = 1 count)
  activeDays: number;
  consistencyRate: number;
  problems: SolvedProblemRecord[];
}

export class ActivityTrackingService {
  /**
   * Merges recent accepted submissions into persistent solvedProblemsLog without duplicates.
   * 1 problem accepted = 1 persistent record.
   */
  static mergeSolvedProblemsLog(
    existingLog: SolvedProblemRecord[] = [],
    recentSubmissions: RecentAcceptedSubmission[] = []
  ): SolvedProblemRecord[] {
    const map = new Map<string, SolvedProblemRecord>();

    // Add existing
    existingLog.forEach((rec) => {
      const key = `${rec.titleSlug}-${rec.dateISO || rec.timestamp}`;
      map.set(key, rec);
    });

    // Add new recent submissions
    recentSubmissions.forEach((sub) => {
      const dateObj = new Date(sub.timestamp * 1000);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const dateISO = `${yyyy}-${mm}-${dd}`;

      // Deduplicate by problem slug and date: 1 problem solved per day = 1 count
      const key = `${sub.titleSlug}-${dateISO}`;
      if (!map.has(key)) {
        map.set(key, {
          id: sub.id,
          title: sub.title,
          titleSlug: sub.titleSlug,
          timestamp: sub.timestamp,
          dateISO,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Generates chronological daily activity breakdown.
   * STRICT RULE: 1 problem finished = 1 count.
   * NEVER uses the raw submission domain (which counts failed/repeated attempts).
   */
  static getDailyBreakdown(
    timeline: DailyActivityRecord[] = [],
    solvedLog: SolvedProblemRecord[] = [],
    limitDays: number = 60
  ): DailyActivityItem[] {
    const problemsByDate = new Map<string, SolvedProblemRecord[]>();
    solvedLog.forEach((p) => {
      const list = problemsByDate.get(p.dateISO) || [];
      if (!list.some((existing) => existing.titleSlug === p.titleSlug)) {
        list.push(p);
      }
      problemsByDate.set(p.dateISO, list);
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Collect all active dates from solvedLog and timeline
    const allDates = new Set<string>();
    timeline.slice(-limitDays).forEach((t) => allDates.add(t.date));
    solvedLog.forEach((p) => allDates.add(p.dateISO));

    // Sort newest first
    const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));

    return sortedDates.map((date) => {
      const dateObj = new Date(date + 'T00:00:00');
      const dayOfWeek = days[dateObj.getDay()] || '';
      const problems = problemsByDate.get(date) || [];
      // 1 problem finished = 1 count. Never use submission counts.
      const count = problems.length;

      return {
        date,
        count,
        dayOfWeek,
        problems,
      };
    });
  }

  /**
   * Groups daily problem-solving activity into weekly blocks.
   * STRICT RULE: 1 problem finished = 1 count.
   */
  static getWeeklyBreakdown(
    timeline: DailyActivityRecord[] = [],
    solvedLog: SolvedProblemRecord[] = [],
    limitWeeks: number = 12
  ): WeeklyActivityItem[] {
    const problemsByDate = new Map<string, SolvedProblemRecord[]>();
    solvedLog.forEach((p) => {
      const list = problemsByDate.get(p.dateISO) || [];
      if (!list.some((existing) => existing.titleSlug === p.titleSlug)) {
        list.push(p);
      }
      problemsByDate.set(p.dateISO, list);
    });

    // Group by Monday of each week
    const weeksMap = new Map<string, { start: Date; end: Date; count: number; activeDays: number; problems: SolvedProblemRecord[] }>();

    // Collect all dates
    const allDates = new Set<string>();
    timeline.forEach((item) => allDates.add(item.date));
    solvedLog.forEach((p) => allDates.add(p.dateISO));

    allDates.forEach((date) => {
      const d = new Date(date + 'T00:00:00');
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const yyyy = monday.getFullYear();
      const mm = String(monday.getMonth() + 1).padStart(2, '0');
      const dd = String(monday.getDate()).padStart(2, '0');
      const weekKey = `${yyyy}-${mm}-${dd}`;

      const entry = weeksMap.get(weekKey) || {
        start: monday,
        end: sunday,
        count: 0,
        activeDays: 0,
        problems: [],
      };

      const daysProblems = problemsByDate.get(date) || [];
      if (daysProblems.length > 0) {
        entry.count += daysProblems.length;
        entry.activeDays += 1;
        entry.problems.push(...daysProblems);
      }

      weeksMap.set(weekKey, entry);
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sortedWeeks = Array.from(weeksMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, limitWeeks);

    return sortedWeeks.map(([weekKey, data]) => {
      const sM = monthNames[data.start.getMonth()];
      const sD = data.start.getDate();
      const eM = monthNames[data.end.getMonth()];
      const eD = data.end.getDate();
      const yr = data.start.getFullYear();
      const weekLabel = `${sM} ${sD} – ${eM} ${eD}, ${yr}`;

      return {
        weekKey,
        weekLabel,
        totalSolved: data.count,
        activeDays: data.activeDays,
        problems: data.problems,
      };
    });
  }

  /**
   * Groups daily activity into calendar months.
   * STRICT RULE: 1 problem finished = 1 count.
   */
  static getMonthlyBreakdown(
    timeline: DailyActivityRecord[] = [],
    solvedLog: SolvedProblemRecord[] = [],
    limitMonths: number = 12
  ): MonthlyActivityItem[] {
    const problemsByDate = new Map<string, SolvedProblemRecord[]>();
    solvedLog.forEach((p) => {
      const list = problemsByDate.get(p.dateISO) || [];
      if (!list.some((existing) => existing.titleSlug === p.titleSlug)) {
        list.push(p);
      }
      problemsByDate.set(p.dateISO, list);
    });

    const monthsMap = new Map<string, { count: number; activeDays: number; totalDays: number; problems: SolvedProblemRecord[] }>();

    // Collect all dates
    const allDates = new Set<string>();
    timeline.forEach((item) => allDates.add(item.date));
    solvedLog.forEach((p) => allDates.add(p.dateISO));

    allDates.forEach((date) => {
      const monthKey = date.substring(0, 7); // YYYY-MM
      const entry = monthsMap.get(monthKey) || {
        count: 0,
        activeDays: 0,
        totalDays: 0,
        problems: [],
      };

      entry.totalDays++;
      const daysProblems = problemsByDate.get(date) || [];
      if (daysProblems.length > 0) {
        entry.count += daysProblems.length;
        entry.activeDays += 1;
        entry.problems.push(...daysProblems);
      }

      monthsMap.set(monthKey, entry);
    });

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const sortedMonths = Array.from(monthsMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, limitMonths);

    return sortedMonths.map(([monthKey, data]) => {
      const [yyyy, mm] = monthKey.split('-');
      const monthIdx = parseInt(mm, 10) - 1;
      const monthLabel = `${monthNames[monthIdx] || mm} ${yyyy}`;
      const consistencyRate = data.totalDays > 0 ? Math.round((data.activeDays / data.totalDays) * 100) : 0;

      return {
        monthKey,
        monthLabel,
        totalSolved: data.count,
        activeDays: data.activeDays,
        consistencyRate,
        problems: data.problems,
      };
    });
  }

  /**
   * Evaluates weekly goal status using unique problems solved (1 problem = 1 count)
   */
  static getWeeklyGoalStatus(
    targetGoal: number,
    timeline: DailyActivityRecord[] = [],
    solvedLog: SolvedProblemRecord[] = []
  ): {
    currentCount: number;
    targetGoal: number;
    percentage: number;
    remaining: number;
    isAchieved: boolean;
  } {
    // Current week: calculate start of current week (Monday)
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const mondayISO = monday.toISOString().slice(0, 10);

    // Count unique problems solved since Monday
    const currentWeekProblems = solvedLog.filter((p) => p.dateISO >= mondayISO);
    const currentCount = currentWeekProblems.length;

    const percentage = targetGoal > 0 ? Math.min(100, Math.round((currentCount / targetGoal) * 100)) : 0;
    const remaining = Math.max(0, targetGoal - currentCount);
    const isAchieved = currentCount >= targetGoal;

    return {
      currentCount,
      targetGoal,
      percentage,
      remaining,
      isAchieved,
    };
  }
}
