import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middleware/auth';
import { ScraperService } from '../services/scraper.service';

const addStudentSchema = z.object({
  rollNumber: z.string().min(2, 'Roll number is required'),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email().optional(),
  department: z.string().min(2, 'Department is required'),
  yearOfStudy: z.string().default('3rd Year'),
  section: z.string().optional(),
  batch: z.string().optional(),
  leetcodeUsername: z.string().min(1, 'LeetCode username is required'),
  targetWeeklyGoal: z.number().default(5),
});

const addFacultySchema = z.object({
  facultyId: z.string().min(2, 'Faculty ID is required'),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid faculty email required'),
  password: z.string().min(6).default('Faculty@123'),
  department: z.string().min(2, 'Department is required'),
  canViewOwnDepartment: z.boolean().default(true),
  canExportReports: z.boolean().default(true),
});

const updatePermissionsSchema = z.object({
  canViewOwnDepartment: z.boolean().optional(),
  canExportReports: z.boolean().optional(),
});

export class AdminController {
  /**
   * Super Admin adds a student with their Roll Number and academic info
   */
  static async addStudent(req: AuthRequest, res: Response) {
    try {
      const parsed = addStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { rollNumber, name, email, department, yearOfStudy, section, batch, leetcodeUsername, targetWeeklyGoal } = parsed.data;

      const existingRoll = await prisma.studentProfile.findUnique({ where: { rollNumber } });
      if (existingRoll) {
        return res.status(400).json({ error: `Student with roll number "${rollNumber}" already exists.` });
      }

      const existingLeet = await prisma.studentProfile.findUnique({ where: { leetcodeUsername } });
      if (existingLeet) {
        return res.status(400).json({ error: `LeetCode handle "${leetcodeUsername}" is already linked to another student.` });
      }

      // Default institutional email if not explicitly provided
      const studentEmail = email || `${rollNumber.toLowerCase()}@bitsathy.ac.in`;
      const tempPasswordHash = await bcrypt.hash('Student@123', 10);

      // Create User and StudentProfile
      const user = await prisma.user.create({
        data: {
          email: studentEmail,
          passwordHash: tempPasswordHash,
          role: 'STUDENT',
          studentProfile: {
            create: {
              rollNumber,
              name,
              department,
              yearOfStudy,
              section: section || null,
              batch: batch || null,
              leetcodeUsername,
              targetWeeklyGoal,
              collectionStatus: 'pending',
            },
          },
        },
        include: {
          studentProfile: true,
        },
      });

      // Trigger background sync for LeetCode profile
      if (user.studentProfile) {
        ScraperService.syncStudentLeetCode(user.studentProfile.id).catch((e) =>
          console.error('Initial LeetCode sync error:', e)
        );
      }

      return res.status(201).json({
        message: 'Student added successfully',
        student: user.studentProfile,
      });
    } catch (err: any) {
      console.error('Add student error:', err);
      return res.status(500).json({ error: err.message || 'Failed to add student' });
    }
  }

  /**
   * Super Admin adds faculty with permissions
   */
  static async addFaculty(req: AuthRequest, res: Response) {
    try {
      const parsed = addFacultySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { facultyId, name, email, password, department, canViewOwnDepartment, canExportReports } = parsed.data;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'A user with this email already exists.' });
      }

      const existingFac = await prisma.facultyProfile.findUnique({ where: { facultyId } });
      if (existingFac) {
        return res.status(400).json({ error: `Faculty ID "${facultyId}" already registered.` });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: 'FACULTY',
          facultyProfile: {
            create: {
              facultyId,
              name,
              department,
              canViewOwnDepartment,
              canExportReports,
            },
          },
        },
        include: {
          facultyProfile: true,
        },
      });

      return res.status(201).json({
        message: 'Faculty created successfully',
        faculty: user.facultyProfile,
      });
    } catch (err: any) {
      console.error('Add faculty error:', err);
      return res.status(500).json({ error: err.message || 'Failed to add faculty' });
    }
  }

  /**
   * Super Admin updates faculty permissions
   */
  static async updateFacultyPermissions(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const parsed = updatePermissionsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const updated = await prisma.facultyProfile.update({
        where: { id },
        data: parsed.data,
      });

      return res.json({
        message: 'Faculty permissions updated',
        faculty: updated,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to update permissions' });
    }
  }

  /**
   * List all faculties
   */
  static async listFaculties(req: AuthRequest, res: Response) {
    try {
      const faculties = await prisma.facultyProfile.findMany({
        include: {
          user: {
            select: { email: true, isActive: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json(faculties);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch faculties' });
    }
  }

  /**
   * List students with filtering and department access control
   */
  static async listStudents(req: AuthRequest, res: Response) {
    try {
      const { department, search } = req.query;

      const whereClause: any = {};

      // If user is FACULTY with canViewOwnDepartment = true and not Super Admin, lock to their department
      if (req.user?.role === 'FACULTY' && req.user.canViewOwnDepartment && req.user.facultyDepartment) {
        whereClause.department = req.user.facultyDepartment;
      } else if (department && department !== 'ALL') {
        whereClause.department = String(department);
      }

      if (search) {
        const queryStr = String(search).toLowerCase();
        whereClause.OR = [
          { name: { contains: queryStr, mode: 'insensitive' } },
          { rollNumber: { contains: queryStr, mode: 'insensitive' } },
          { leetcodeUsername: { contains: queryStr, mode: 'insensitive' } },
        ];
      }

      const students = await prisma.studentProfile.findMany({
        where: whereClause,
        include: {
          user: { select: { email: true, isActive: true } },
          _count: {
            select: { submissions: true },
          },
        },
        orderBy: { rollNumber: 'asc' },
      });

      return res.json(students);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to list students' });
    }
  }

  /**
   * Delete student
   */
  static async deleteStudent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const student = await prisma.studentProfile.findUnique({ where: { id } });
      if (!student) return res.status(404).json({ error: 'Student not found' });

      await prisma.user.delete({ where: { id: student.userId } });
      return res.json({ message: 'Student deleted successfully' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to delete student' });
    }
  }

  /**
   * Delete faculty
   */
  static async deleteFaculty(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const faculty = await prisma.facultyProfile.findUnique({ where: { id } });
      if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

      await prisma.user.delete({ where: { id: faculty.userId } });
      return res.json({ message: 'Faculty deleted successfully' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to delete faculty' });
    }
  }

  /**
   * Trigger LeetCode Sync for a student
   */
  static async syncStudent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await ScraperService.syncStudentLeetCode(id);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      return res.json({ message: 'Sync complete' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Sync failed' });
    }
  }

  /**
   * Bulk import students from JSON / CSV upload
   */
  static async bulkAddStudents(req: AuthRequest, res: Response) {
    try {
      const { students } = req.body;
      if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ error: 'Array of student records is required.' });
      }

      let imported = 0;
      let skipped = 0;
      const skippedRolls: string[] = [];

      for (const item of students) {
        const rollNumber = String(item.rollNumber || item['Roll Number'] || '').trim().toUpperCase();
        const name = String(item.name || item['Name'] || '').trim();
        const leetcodeUsername = String(item.leetcodeUsername || item['LeetCode Handle'] || '').trim();
        const department = String(item.department || item['Department'] || 'CSE').trim();
        const yearOfStudy = String(item.yearOfStudy || item['Year'] || '3rd Year').trim();
        const section = String(item.section || item['Section'] || 'A').trim();
        const batch = String(item.batch || item['Batch'] || '2022-2026').trim();

        if (!rollNumber || !name || !leetcodeUsername) {
          skipped += 1;
          continue;
        }

        const existingRoll = await prisma.studentProfile.findUnique({ where: { rollNumber } });
        const existingLeet = await prisma.studentProfile.findUnique({ where: { leetcodeUsername } });

        if (existingRoll || existingLeet) {
          skipped += 1;
          skippedRolls.push(rollNumber);
          continue;
        }

        const email = `${rollNumber.toLowerCase()}@bitsathy.ac.in`;
        const tempPasswordHash = await bcrypt.hash('Student@123', 10);

        const user = await prisma.user.create({
          data: {
            email,
            passwordHash: tempPasswordHash,
            role: 'STUDENT',
            studentProfile: {
              create: {
                rollNumber,
                name,
                department,
                yearOfStudy,
                section,
                batch,
                leetcodeUsername,
                collectionStatus: 'pending',
              },
            },
          },
          include: { studentProfile: true },
        });

        imported += 1;

        if (user.studentProfile) {
          ScraperService.syncStudentLeetCode(user.studentProfile.id).catch(console.error);
        }
      }

      return res.status(201).json({
        message: `Bulk import completed: ${imported} imported, ${skipped} skipped.`,
        imported,
        skipped,
        skippedRolls,
      });
    } catch (err: any) {
      console.error('Bulk add error:', err);
      return res.status(500).json({ error: err.message || 'Bulk student import failed' });
    }
  }

  /**
   * Super Admin triggers full sync for all registered students
   */
  static async syncAllStudents(req: AuthRequest, res: Response) {
    try {
      const { CronService } = await import('../services/cron.service');
      // Run sync in background
      CronService.syncAllStudents().then((result) => {
        console.log('Manual batch sync complete:', result);
      });

      return res.json({
        message: 'Institutional batch sync initiated across all registered students in the background.',
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to trigger batch sync' });
    }
  }
}
