import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middleware/auth';

export class AnalyticsController {
  /**
   * Multi-Category Retrieval Engine for student coding activity
   */
  static async getCodingActivity(req: AuthRequest, res: Response) {
    try {
      const {
        department,
        yearOfStudy,
        batch,
        section,
        topic,
        difficulty,
        startDate,
        endDate,
        tier,
      } = req.query;

      // Base student filters
      const studentWhere: any = {};

      // Department restriction for Faculty
      if (req.user?.role === 'FACULTY' && req.user.canViewOwnDepartment && req.user.facultyDepartment) {
        studentWhere.department = req.user.facultyDepartment;
      } else if (department && department !== 'ALL') {
        studentWhere.department = String(department);
      }

      if (yearOfStudy && yearOfStudy !== 'ALL') {
        studentWhere.yearOfStudy = String(yearOfStudy);
      }
      if (batch && batch !== 'ALL') {
        studentWhere.batch = String(batch);
      }
      if (section && section !== 'ALL') {
        studentWhere.section = String(section);
      }

      // Base submission filters
      const submissionWhere: any = {};
      if (startDate || endDate) {
        submissionWhere.solvedDate = {};
        if (startDate) submissionWhere.solvedDate.gte = String(startDate);
        if (endDate) submissionWhere.solvedDate.lte = String(endDate);
      }

      const problemWhere: any = {};
      if (difficulty && difficulty !== 'ALL') {
        problemWhere.difficulty = String(difficulty).toUpperCase();
      }
      if (topic && topic !== 'ALL') {
        problemWhere.topicTags = {
          contains: String(topic),
        };
      }
      if (Object.keys(problemWhere).length > 0) {
        submissionWhere.problem = problemWhere;
      }

      // Fetch matching students with their filtered submissions
      const students = await prisma.studentProfile.findMany({
        where: studentWhere,
        include: {
          submissions: {
            where: submissionWhere,
            include: {
              problem: true,
            },
            orderBy: { solvedTimestamp: 'desc' },
          },
          dailyAggregates: {
            where: startDate || endDate ? {
              activityDate: {
                ...(startDate ? { gte: String(startDate) } : {}),
                ...(endDate ? { lte: String(endDate) } : {}),
              },
            } : undefined,
          },
        },
      });

      // Aggregate global statistics across filtered records
      let totalSolvedCount = 0;
      let easyCount = 0;
      let mediumCount = 0;
      let hardCount = 0;
      const topicCountMap = new Map<string, number>();
      const departmentCountMap = new Map<string, number>();
      const dailyTrendMap = new Map<string, number>();

      const studentResults = students.map((stu) => {
        const solved = stu.submissions.length;
        totalSolvedCount += solved;

        let stuEasy = 0;
        let stuMedium = 0;
        let stuHard = 0;

        stu.submissions.forEach((sub) => {
          if (sub.problem.difficulty === 'EASY') {
            easyCount += 1;
            stuEasy += 1;
          } else if (sub.problem.difficulty === 'MEDIUM') {
            mediumCount += 1;
            stuMedium += 1;
          } else if (sub.problem.difficulty === 'HARD') {
            hardCount += 1;
            stuHard += 1;
          }

          // Topic stats
          let parsedTags: string[] = [];
          try {
            parsedTags = typeof sub.problem.topicTags === 'string' ? JSON.parse(sub.problem.topicTags || '[]') : (sub.problem.topicTags as any) || [];
          } catch {
            parsedTags = [sub.problem.topicTags];
          }

          parsedTags.forEach((t) => {
            topicCountMap.set(t, (topicCountMap.get(t) || 0) + 1);
          });

          // Daily trends
          dailyTrendMap.set(sub.solvedDate, (dailyTrendMap.get(sub.solvedDate) || 0) + 1);
        });

        // Department stats
        departmentCountMap.set(
          stu.department,
          (departmentCountMap.get(stu.department) || 0) + solved
        );

        return {
          id: stu.id,
          rollNumber: stu.rollNumber,
          name: stu.name,
          department: stu.department,
          yearOfStudy: stu.yearOfStudy,
          batch: stu.batch,
          section: stu.section,
          leetcodeUsername: stu.leetcodeUsername,
          totalSolvedInFilter: solved,
          easy: stuEasy,
          medium: stuMedium,
          hard: stuHard,
          lastActiveDate: stu.submissions[0]?.solvedDate || null,
          recentProblems: stu.submissions.slice(0, 5).map((s) => ({
            title: s.problem.title,
            difficulty: s.problem.difficulty,
            tags: s.problem.topicTags,
            date: s.solvedDate,
          })),
        };
      });

      // Filter by tier if specified
      let filteredStudents = studentResults;
      if (tier === 'active') {
        filteredStudents = studentResults.filter((s) => s.totalSolvedInFilter > 0);
      } else if (tier === 'inactive') {
        filteredStudents = studentResults.filter((s) => s.totalSolvedInFilter === 0);
      } else if (tier === 'high') {
        filteredStudents = studentResults.filter((s) => s.totalSolvedInFilter >= 10);
      }

      // Sort students by activity count descending
      filteredStudents.sort((a, b) => b.totalSolvedInFilter - a.totalSolvedInFilter);

      // Format topic distribution
      const topicDistribution = Array.from(topicCountMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Format department distribution
      const departmentDistribution = Array.from(departmentCountMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Format daily trend
      const dailyTrends = Array.from(dailyTrendMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return res.json({
        summary: {
          totalStudentsCount: students.length,
          activeStudentsCount: studentResults.filter((s) => s.totalSolvedInFilter > 0).length,
          totalSolvedCount,
          easyCount,
          mediumCount,
          hardCount,
        },
        topicDistribution,
        departmentDistribution,
        dailyTrends,
        students: filteredStudents,
      });
    } catch (err: any) {
      console.error('Analytics query error:', err);
      return res.status(500).json({ error: err.message || 'Failed to retrieve coding activity' });
    }
  }

  /**
   * Retrieves unique filter categories available in the database
   */
  static async getCategories(req: AuthRequest, res: Response) {
    try {
      const departments = await prisma.studentProfile.findMany({
        distinct: ['department'],
        select: { department: true },
      });

      const years = await prisma.studentProfile.findMany({
        distinct: ['yearOfStudy'],
        select: { yearOfStudy: true },
      });

      const batches = await prisma.studentProfile.findMany({
        where: { batch: { not: null } },
        distinct: ['batch'],
        select: { batch: true },
      });

      const problems = await prisma.problem.findMany({
        select: { topicTags: true },
      });

      const uniqueTopics = Array.from(
        new Set(
          problems.flatMap((p) => {
            try {
              return typeof p.topicTags === 'string' ? JSON.parse(p.topicTags || '[]') : (p.topicTags as any) || [];
            } catch {
              return [];
            }
          })
        )
      ).sort();

      return res.json({
        departments: departments.map((d) => d.department).filter(Boolean),
        years: years.map((y) => y.yearOfStudy).filter(Boolean),
        batches: batches.map((b) => b.batch).filter(Boolean),
        topics: uniqueTopics.length > 0 ? uniqueTopics : [
          'Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting',
          'Greedy', 'Depth-First Search', 'Binary Search', 'Tree', 'Breadth-First Search',
          'Matrix', 'Two Pointers', 'Bit Manipulation', 'Stack', 'Graph', 'Design'
        ],
        difficulties: ['EASY', 'MEDIUM', 'HARD'],
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch categories' });
    }
  }
}
