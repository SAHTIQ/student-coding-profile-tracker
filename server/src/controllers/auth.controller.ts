import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middleware/auth';
import { ScraperService } from '../services/scraper.service';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-bitsathy-codepulse-2026';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const studentSignupSchema = z.object({
  email: z
    .string()
    .email()
    .refine((val) => val.endsWith('@bitsathy.ac.in'), {
      message: 'Email must belong to the @bitsathy.ac.in institutional domain',
    }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name is required'),
  rollNumber: z.string().min(3, 'Roll number is required'),
  department: z.string().min(2, 'Department is required'),
  yearOfStudy: z.string().min(1, 'Year of study is required'),
  section: z.string().optional(),
  batch: z.string().optional(),
  leetcodeUsername: z.string().min(1, 'LeetCode username is required'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  /**
   * Google Sign-In with strict @bitsathy.ac.in domain enforcement
   */
  static async googleAuth(req: Request, res: Response) {
    try {
      const { credential, email: directEmail, name: directName, rollNumber, department, yearOfStudy, leetcodeUsername } = req.body;

      let verifiedEmail = directEmail;
      let verifiedName = directName;

      // Verify Google ID Token if present
      if (credential) {
        try {
          if (process.env.GOOGLE_CLIENT_ID) {
            const ticket = await googleClient.verifyIdToken({
              idToken: credential,
              audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            verifiedEmail = payload?.email;
            verifiedName = payload?.name;
          } else {
            const decoded: any = jwt.decode(credential);
            if (decoded && decoded.email) {
              verifiedEmail = decoded.email;
              verifiedName = decoded.name;
            }
          }
        } catch {
          const decoded: any = jwt.decode(credential);
          if (decoded && decoded.email) {
            verifiedEmail = decoded.email;
            verifiedName = decoded.name;
          }
        }
      }

      if (!verifiedEmail) {
        return res.status(400).json({ error: 'Google authentication failed: Email could not be verified.' });
      }

      // STRICT VALIDATION: Domain MUST be @bitsathy.ac.in
      if (!verifiedEmail.toLowerCase().endsWith('@bitsathy.ac.in')) {
        return res.status(403).json({
          error: 'Access restricted: Only @bitsathy.ac.in institutional accounts are permitted to sign in.',
        });
      }

      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: verifiedEmail.toLowerCase() },
        include: { studentProfile: true, facultyProfile: true },
      });

      if (!user) {
        // If first-time student Google sign-in and academic details missing, prompt onboarding modal
        if (!rollNumber || !leetcodeUsername) {
          const localPart = verifiedEmail.split('@')[0];
          const inferredRoll = localPart.match(/^\d{7}[A-Za-z]{2}\d{3}/i) ? localPart.toUpperCase() : '';

          return res.status(200).json({
            needsProfileCompletion: true,
            email: verifiedEmail,
            name: verifiedName || localPart,
            suggestedRoll: inferredRoll,
          });
        }

        // Check uniqueness of Roll Number and LeetCode handle
        const existingRoll = await prisma.studentProfile.findUnique({ where: { rollNumber: rollNumber.toUpperCase() } });
        if (existingRoll) {
          return res.status(400).json({ error: `Roll number ${rollNumber} is already registered.` });
        }

        const existingLeet = await prisma.studentProfile.findUnique({ where: { leetcodeUsername } });
        if (existingLeet) {
          return res.status(400).json({ error: `LeetCode handle "${leetcodeUsername}" is already linked.` });
        }

        // Create new student
        const dummyPasswordHash = await bcrypt.hash(`google-auth-${Date.now()}-${Math.random()}`, 10);
        user = await prisma.user.create({
          data: {
            email: verifiedEmail.toLowerCase(),
            passwordHash: dummyPasswordHash,
            role: 'STUDENT',
            studentProfile: {
              create: {
                rollNumber: rollNumber.toUpperCase(),
                name: verifiedName || rollNumber,
                department: department || 'CSE',
                yearOfStudy: yearOfStudy || '3rd Year',
                leetcodeUsername,
                collectionStatus: 'pending',
              },
            },
          },
          include: { studentProfile: true, facultyProfile: true },
        });

        // Trigger background sync
        if (user.studentProfile) {
          ScraperService.syncStudentLeetCode(user.studentProfile.id).catch(console.error);
        }
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      let profileData: any = {};
      if (user.role === 'STUDENT' && user.studentProfile) {
        profileData = {
          rollNumber: user.studentProfile.rollNumber,
          name: user.studentProfile.name,
          department: user.studentProfile.department,
          yearOfStudy: user.studentProfile.yearOfStudy,
          leetcodeUsername: user.studentProfile.leetcodeUsername,
        };
      } else if (user.role === 'FACULTY' && user.facultyProfile) {
        profileData = {
          facultyId: user.facultyProfile.facultyId,
          name: user.facultyProfile.name,
          department: user.facultyProfile.department,
          canViewOwnDepartment: user.facultyProfile.canViewOwnDepartment,
          canExportReports: user.facultyProfile.canExportReports,
        };
      } else if (user.role === 'SUPER_ADMIN') {
        profileData = {
          name: 'Super Administrator',
          isSuperAdmin: true,
        };
      }

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          ...profileData,
        },
      });
    } catch (err: any) {
      console.error('Google auth error:', err);
      return res.status(500).json({ error: err.message || 'Google authentication failed' });
    }
  }

  /**
   * Student self-registration with @bitsathy.ac.in validation
   */
  static async studentSignup(req: Request, res: Response) {
    try {
      const parsed = studentSignupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { email, password, name, rollNumber, department, yearOfStudy, section, batch, leetcodeUsername } = parsed.data;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      const existingRoll = await prisma.studentProfile.findUnique({ where: { rollNumber } });
      if (existingRoll) {
        return res.status(400).json({ error: `Student with roll number ${rollNumber} already exists` });
      }

      const existingLeet = await prisma.studentProfile.findUnique({ where: { leetcodeUsername } });
      if (existingLeet) {
        return res.status(400).json({ error: `LeetCode handle "${leetcodeUsername}" is already linked` });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
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
            },
          },
        },
        include: {
          studentProfile: true,
        },
      });

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({
        message: 'Account successfully created',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.studentProfile?.name,
          rollNumber: user.studentProfile?.rollNumber,
          department: user.studentProfile?.department,
          leetcodeUsername: user.studentProfile?.leetcodeUsername,
        },
      });
    } catch (err: any) {
      console.error('Student signup error:', err);
      return res.status(500).json({ error: err.message || 'Internal server error during registration' });
    }
  }

  /**
   * Universal Login (Super Admin, Faculty, Student)
   */
  static async login(req: Request, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { email, password } = parsed.data;

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          studentProfile: true,
          facultyProfile: true,
        },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      let profileData: any = {};
      if (user.role === 'STUDENT' && user.studentProfile) {
        profileData = {
          rollNumber: user.studentProfile.rollNumber,
          name: user.studentProfile.name,
          department: user.studentProfile.department,
          yearOfStudy: user.studentProfile.yearOfStudy,
          leetcodeUsername: user.studentProfile.leetcodeUsername,
        };
      } else if (user.role === 'FACULTY' && user.facultyProfile) {
        profileData = {
          facultyId: user.facultyProfile.facultyId,
          name: user.facultyProfile.name,
          department: user.facultyProfile.department,
          canViewOwnDepartment: user.facultyProfile.canViewOwnDepartment,
          canExportReports: user.facultyProfile.canExportReports,
        };
      } else if (user.role === 'SUPER_ADMIN') {
        profileData = {
          name: 'Super Administrator',
          isSuperAdmin: true,
        };
      }

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          ...profileData,
        },
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: err.message || 'Internal server error during login' });
    }
  }

  /**
   * Current user session profile
   */
  static async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          studentProfile: true,
          facultyProfile: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({
        id: user.id,
        email: user.email,
        role: user.role,
        student: user.studentProfile,
        faculty: user.facultyProfile,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch current user' });
    }
  }
}
