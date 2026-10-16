export type CollectionStatus = 
  | 'pending' 
  | 'fetching' 
  | 'success' 
  | 'not_found' 
  | 'rate_limited' 
  | 'failed';

export type UserRole = 'admin' | 'student';

export interface Student {
  id: string;
  displayName: string;
  leetcodeUsername: string;
  studentId?: string; // Roll number
  department?: string;
  yearOfStudy?: string;
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
