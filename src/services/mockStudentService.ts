import { Student, CollectionStatus } from '../types/student';
import { extractLeetCodeUsername } from '../utils/metricCalculations';

const STORAGE_KEY = 'codepulse_students_data_live';

export class MockStudentService {
  static cleanupLegacyDemoData(): void {
    try {
      localStorage.removeItem('codepulse_students_data_v1');
      localStorage.removeItem('codepulse_leetcode_profiles_v1');
    } catch {
      // Ignore
    }
  }

  static getStudents(): Student[] {
    this.cleanupLegacyDemoData();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return [];
  }

  static saveStudents(students: Student[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch {
      // Storage error
    }
  }

  static getStudentById(id: string): Student | undefined {
    const students = this.getStudents();
    return students.find((s) => s.id === id);
  }

  static getStudentByUsername(usernameOrUrl: string): Student | undefined {
    const clean = extractLeetCodeUsername(usernameOrUrl).toLowerCase();
    const students = this.getStudents();
    return students.find(
      (s) => s.leetcodeUsername.toLowerCase() === clean
    );
  }

  static addStudent(data: Omit<Student, 'id' | 'createdAt' | 'collectionStatus' | 'lastFetchedAt'>): Student {
    const students = this.getStudents();
    const cleanUsername = extractLeetCodeUsername(data.leetcodeUsername).toLowerCase();

    if (!cleanUsername) {
      throw new Error('Please enter a valid LeetCode username or profile link.');
    }

    // Check duplicate
    const exists = students.some(
      (s) => s.leetcodeUsername.toLowerCase() === cleanUsername
    );
    if (exists) {
      throw new Error(`A student with LeetCode handle "@${cleanUsername}" already exists.`);
    }

    const newStudent: Student = {
      ...data,
      id: `stu-${Date.now()}`,
      leetcodeUsername: cleanUsername,
      displayName: data.displayName?.trim() || cleanUsername,
      createdAt: new Date().toISOString(),
      collectionStatus: 'pending',
      lastFetchedAt: null,
      role: 'student',
    };

    students.unshift(newStudent);
    this.saveStudents(students);
    return newStudent;
  }

  static updateStudent(id: string, updates: Partial<Student>): Student {
    const students = this.getStudents();
    const index = students.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Student with id "${id}" not found.`);
    }

    students[index] = { ...students[index], ...updates };
    this.saveStudents(students);
    return students[index];
  }

  static updateCollectionStatus(
    id: string,
    status: CollectionStatus,
    errorMessage?: string
  ): Student {
    return this.updateStudent(id, {
      collectionStatus: status,
      lastFetchedAt: status === 'success' ? new Date().toISOString() : undefined,
      errorMessage,
    });
  }

  static deleteStudent(id: string): boolean {
    const students = this.getStudents();
    const filtered = students.filter((s) => s.id !== id);
    if (filtered.length === students.length) return false;
    this.saveStudents(filtered);
    return true;
  }

  static resetToDefault(): Student[] {
    this.saveStudents([]);
    return [];
  }
}
