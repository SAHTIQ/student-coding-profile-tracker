import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'FACULTY' | 'STUDENT';
  studentProfileId?: string;
  facultyProfileId?: string;
  facultyDepartment?: string;
  canViewOwnDepartment?: boolean;
  canExportReports?: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-bitsathy-codepulse-2026';

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: any };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        studentProfile: true,
        facultyProfile: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'Account inactive or not found' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as any,
      studentProfileId: user.studentProfile?.id,
      facultyProfileId: user.facultyProfile?.id,
      facultyDepartment: user.facultyProfile?.department,
      canViewOwnDepartment: user.facultyProfile?.canViewOwnDepartment ?? false,
      canExportReports: user.facultyProfile?.canExportReports ?? false,
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin permissions required' });
  }
  next();
};

export const requireFacultyOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'FACULTY')) {
    return res.status(403).json({ error: 'Faculty or Super Admin permissions required' });
  }
  next();
};
