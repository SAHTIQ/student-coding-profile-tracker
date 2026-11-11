import { prisma } from '../db/prisma';

export class ScraperService {
  /**
   * Fetches profile and submissions from LeetCode public GraphQL API
   */
  static async syncStudentLeetCode(studentProfileId: string): Promise<{ success: boolean; error?: string }> {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
    });

    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    try {
      await prisma.studentProfile.update({
        where: { id: studentProfileId },
        data: { collectionStatus: 'fetching' },
      });

      const username = student.leetcodeUsername;
      const query = `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
                submissions
              }
            }
            submissionCalendar
            tagProblemCounts {
              advanced {
                tagName
                problemsSolved
              }
              intermediate {
                tagName
                problemsSolved
              }
              fundamental {
                tagName
                problemsSolved
              }
            }
          }
          recentAcSubmissionList(username: $username, limit: 50) {
            id
            title
            titleSlug
            timestamp
          }
        }
      `;

      const response = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: `https://leetcode.com/${username}/`,
        },
        body: JSON.stringify({ query, variables: { username } }),
      });

      if (!response.ok) {
        throw new Error(`LeetCode GraphQL responded with status ${response.status}`);
      }

      const json = await response.json();
      const matchedUser = json?.data?.matchedUser;
      const recentSubs: any[] = json?.data?.recentAcSubmissionList || [];

      if (!matchedUser) {
        await prisma.studentProfile.update({
          where: { id: studentProfileId },
          data: {
            collectionStatus: 'not_found',
            lastSyncedAt: new Date(),
          },
        });
        return { success: false, error: 'LeetCode user not found' };
      }

      // Collect topic tags from matchedUser if available
      const topicTagsMap = new Map<string, string[]>();
      const allTags = [
        ...(matchedUser.tagProblemCounts?.advanced || []),
        ...(matchedUser.tagProblemCounts?.intermediate || []),
        ...(matchedUser.tagProblemCounts?.fundamental || []),
      ];

      // Process each recent submission
      const dateProblemMap = new Map<string, { total: number; easy: number; medium: number; hard: number; topics: Record<string, number> }>();

      for (const sub of recentSubs) {
        const timestampMs = parseInt(sub.timestamp, 10) * 1000;
        const dateObj = new Date(timestampMs);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const solvedDate = `${yyyy}-${mm}-${dd}`;

        // Ensure problem exists
        const problem = await prisma.problem.upsert({
          where: { titleSlug: sub.titleSlug },
          update: {
            title: sub.title,
          },
          create: {
            title: sub.title,
            titleSlug: sub.titleSlug,
            difficulty: 'MEDIUM',
            topicTags: JSON.stringify(['Algorithms']),
            platform: 'LeetCode',
            url: `https://leetcode.com/problems/${sub.titleSlug}/`,
          },
        });

        // Upsert submission record (unique per student, problem, date)
        await prisma.problemSubmission.upsert({
          where: {
            studentId_problemId_solvedDate: {
              studentId: studentProfileId,
              problemId: problem.id,
              solvedDate,
            },
          },
          update: {
            submissionId: sub.id,
            solvedTimestamp: dateObj,
          },
          create: {
            studentId: studentProfileId,
            problemId: problem.id,
            submissionId: sub.id,
            solvedDate,
            solvedTimestamp: dateObj,
            language: 'cpp',
          },
        });

        // Track for daily aggregation
        const dayStat = dateProblemMap.get(solvedDate) || {
          total: 0,
          easy: 0,
          medium: 0,
          hard: 0,
          topics: {},
        };
        dayStat.total += 1;
        if (problem.difficulty === 'EASY') dayStat.easy += 1;
        else if (problem.difficulty === 'MEDIUM') dayStat.medium += 1;
        else if (problem.difficulty === 'HARD') dayStat.hard += 1;

        let parsedTags: string[] = [];
        try {
          parsedTags = typeof problem.topicTags === 'string' ? JSON.parse(problem.topicTags || '[]') : (problem.topicTags as any) || [];
        } catch {
          parsedTags = [];
        }

        parsedTags.forEach((t) => {
          dayStat.topics[t] = (dayStat.topics[t] || 0) + 1;
        });

        dateProblemMap.set(solvedDate, dayStat);
      }

      // Update DailyActivityAggregate for each date
      for (const [activityDate, stats] of dateProblemMap.entries()) {
        await prisma.dailyActivityAggregate.upsert({
          where: {
            studentId_activityDate: {
              studentId: studentProfileId,
              activityDate,
            },
          },
          update: {
            totalSolved: stats.total,
            easySolved: stats.easy,
            mediumSolved: stats.medium,
            hardSolved: stats.hard,
            topicBreakdown: JSON.stringify(stats.topics),
          },
          create: {
            studentId: studentProfileId,
            activityDate,
            totalSolved: stats.total,
            easySolved: stats.easy,
            mediumSolved: stats.medium,
            hardSolved: stats.hard,
            topicBreakdown: JSON.stringify(stats.topics),
          },
        });
      }

      await prisma.studentProfile.update({
        where: { id: studentProfileId },
        data: {
          collectionStatus: 'success',
          lastSyncedAt: new Date(),
        },
      });

      return { success: true };
    } catch (err: any) {
      console.error(`Scrape error for ${student.leetcodeUsername}:`, err);
      await prisma.studentProfile.update({
        where: { id: studentProfileId },
        data: {
          collectionStatus: 'failed',
          lastSyncedAt: new Date(),
        },
      });
      return { success: false, error: err.message || 'Scraping failed' };
    }
  }
}
