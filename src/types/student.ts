export type CollectionStatus = 
  | 'pending' 
  | 'fetching' 
  | 'success' 
  | 'not_found' 
  | 'rate_limited' 
  | 'failed';

export type UserRole = 'SUPER_ADMIN' | 'FACULTY' | 'STUDENT' | 'admin' | 'student';

export interface Faculty {
  id: string;
  facultyId: string;
  name: string;
  department: string;
  email: string;
  canViewOwnDepartment: boolean;
  canExportReports: boolean;
  createdAt: string;
}

export interface Student {
  id: string;
  displayName: string;
  leetcodeUsername: string;
  studentId?: string; // Roll number
  rollNumber?: string;
  department?: string;
  yearOfStudy?: string;
  section?: string;
  batch?: string;
  email?: string;
  tags?: string[];
  cohort?: string;
  targetWeeklyGoal?: number;
  role: UserRole;
  createdAt: string;
  collectionStatus: CollectionStatus;
  lastFetchedAt: string | null;
  errorMessage?: string;
}

export interface CollectionJob {
  id: string;
  studentId: string;
  status: CollectionStatus;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  recordsUpdated?: number;
}
