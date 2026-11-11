import { Response } from 'express';
import ExcelJS from 'exceljs';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middleware/auth';

export class ExportController {
  /**
   * Export solved problem list for Super Admin and authorized Faculty
   */
  static async exportProblemHistory(req: AuthRequest, res: Response) {
    try {
      // Permission check for Faculty
      if (req.user?.role === 'FACULTY' && !req.user.canExportReports) {
        return res.status(403).json({ error: 'You do not have permission to export reports.' });
      }

      const {
        department,
        yearOfStudy,
        topic,
        difficulty,
        startDate,
        endDate,
        format = 'csv',
      } = req.query;

      const studentWhere: any = {};
      if (req.user?.role === 'FACULTY' && req.user.canViewOwnDepartment && req.user.facultyDepartment) {
        studentWhere.department = req.user.facultyDepartment;
      } else if (department && department !== 'ALL') {
        studentWhere.department = String(department);
      }

      if (yearOfStudy && yearOfStudy !== 'ALL') {
        studentWhere.yearOfStudy = String(yearOfStudy);
      }

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
        problemWhere.topicTags = { contains: String(topic) };
      }
      if (Object.keys(problemWhere).length > 0) {
        submissionWhere.problem = problemWhere;
      }

      // Fetch problem submissions with student and problem details
      const submissions = await prisma.problemSubmission.findMany({
        where: {
          ...submissionWhere,
          student: studentWhere,
        },
        include: {
          student: true,
          problem: true,
        },
        orderBy: [
          { solvedDate: 'desc' },
          { student: { rollNumber: 'asc' } },
        ],
      });

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'CodePulse Institutional Analytics';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Solved Problems');

      // Setup columns
      worksheet.columns = [
        { header: 'Roll Number', key: 'rollNumber', width: 16 },
        { header: 'Student Name', key: 'name', width: 24 },
        { header: 'Department', key: 'department', width: 14 },
        { header: 'Year of Study', key: 'yearOfStudy', width: 14 },
        { header: 'Section', key: 'section', width: 10 },
        { header: 'LeetCode Username', key: 'leetcodeUsername', width: 20 },
        { header: 'Problem Title', key: 'problemTitle', width: 32 },
        { header: 'Difficulty', key: 'difficulty', width: 12 },
        { header: 'Topic Categories', key: 'topics', width: 30 },
        { header: 'Solved Date', key: 'solvedDate', width: 14 },
        { header: 'Language', key: 'language', width: 12 },
      ];

      // Format header row
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' },
      };

      // Add data rows
      submissions.forEach((sub) => {
        let topicsStr = '';
        try {
          const parsed = typeof sub.problem.topicTags === 'string' ? JSON.parse(sub.problem.topicTags || '[]') : sub.problem.topicTags;
          topicsStr = Array.isArray(parsed) ? parsed.join(', ') : String(parsed || '');
        } catch {
          topicsStr = sub.problem.topicTags || '';
        }

        worksheet.addRow({
          rollNumber: sub.student.rollNumber,
          name: sub.student.name,
          department: sub.student.department,
          yearOfStudy: sub.student.yearOfStudy,
          section: sub.student.section || 'A',
          leetcodeUsername: sub.student.leetcodeUsername,
          problemTitle: sub.problem.title,
          difficulty: sub.problem.difficulty,
          topics: topicsStr,
          solvedDate: sub.solvedDate,
          language: sub.language || 'cpp',
        });
      });

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `CodePulse_Solved_Problems_${dateStr}`;

      if (format === 'xlsx') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
      } else {
        // Default CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        await workbook.csv.write(res);
        res.end();
      }
    } catch (err: any) {
      console.error('Export error:', err);
      return res.status(500).json({ error: err.message || 'Failed to export problem history' });
    }
  }
}
