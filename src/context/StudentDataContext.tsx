import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Student } from '../types/student';
import { LeetCodeProfile } from '../types/leetcode';
import { MockStudentService } from '../services/mockStudentService';
import { MockCollectionService } from '../services/mockCollectionService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface StudentDataContextType {
  students: Student[];
  profiles: Record<string, LeetCodeProfile>;
  isLoading: boolean;
  refreshingStudentId: string | null;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  refreshStudentData: (id: string) => Promise<void>;
  bulkRefreshStudents: (ids: string[]) => Promise<void>;
  createStudent: (data: Omit<Student, 'id' | 'createdAt' | 'collectionStatus' | 'lastFetchedAt'>) => Promise<Student>;
  editStudent: (id: string, updates: Partial<Student>) => void;
  removeStudent: (id: string) => void;
  resetAllData: () => void;
  reloadData: () => void;
}

const StudentDataContext = createContext<StudentDataContextType | undefined>(undefined);

export const StudentDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(() => MockStudentService.getStudents());
  const [profiles, setProfiles] = useState<Record<string, LeetCodeProfile>>(() =>
    MockCollectionService.getStoredProfiles()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [refreshingStudentId, setRefreshingStudentId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const reloadData = useCallback(() => {
    setStudents(MockStudentService.getStudents());
    setProfiles(MockCollectionService.getStoredProfiles());
  }, []);

  const refreshStudentData = useCallback(
    async (studentId: string) => {
      const student = students.find((s) => s.id === studentId);
      if (!student) return;

      setRefreshingStudentId(studentId);
      addToast({
        type: 'info',
        title: `Scraping LeetCode Data`,
        message: `Querying public GraphQL API for "${student.leetcodeUsername}"...`,
      });

      try {
        const result = await MockCollectionService.simulateCollect(
          student.id,
          student.leetcodeUsername,
          student.displayName
        );

        reloadData();

        if (result.status === 'success') {
          addToast({
            type: 'success',
            title: 'Live Profile Scraped',
            message: `Successfully synchronized real statistics for @${student.leetcodeUsername}.`,
          });
        } else if (result.status === 'not_found') {
          addToast({
            type: 'error',
            title: 'Profile Not Found',
            message: result.errorMessage,
          });
        } else if (result.status === 'rate_limited') {
          addToast({
            type: 'warning',
            title: 'Rate Limit Reached',
            message: result.errorMessage,
          });
        } else {
          addToast({
            type: 'error',
            title: 'Collection Failed',
            message: result.errorMessage || 'An unexpected error occurred during collection.',
          });
        }
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Collection Error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      } finally {
        setRefreshingStudentId(null);
      }
    },
    [students, reloadData, addToast]
  );

  const bulkRefreshStudents = useCallback(
    async (ids: string[]) => {
      setIsLoading(true);
      addToast({
        type: 'info',
        title: 'Bulk Refresh Started',
        message: `Refreshing data for ${ids.length} selected students...`,
      });

      await MockCollectionService.simulateBulkCollect(ids);
      reloadData();
      setIsLoading(false);

      addToast({
        type: 'success',
        title: 'Bulk Refresh Completed',
        message: `Updated profile metrics for ${ids.length} students.`,
      });
    },
    [reloadData, addToast]
  );

  const createStudent = useCallback(
    async (data: Omit<Student, 'id' | 'createdAt' | 'collectionStatus' | 'lastFetchedAt'>) => {
      const newStudent = MockStudentService.addStudent(data);
      reloadData();

      addToast({
        type: 'info',
        title: 'Scraping LeetCode',
        message: `Connecting to public GraphQL API for @${newStudent.leetcodeUsername}...`,
      });

      // Automatically trigger live scrape
      await refreshStudentData(newStudent.id);
      return newStudent;
    },
    [reloadData, addToast, refreshStudentData]
  );

  const editStudent = useCallback(
    (id: string, updates: Partial<Student>) => {
      MockStudentService.updateStudent(id, updates);
      reloadData();
      addToast({
        type: 'success',
        title: 'Record Updated',
        message: 'Student details have been saved successfully.',
      });
    },
    [reloadData, addToast]
  );

  const removeStudent = useCallback(
    (id: string) => {
      const target = students.find((s) => s.id === id);
      MockStudentService.deleteStudent(id);
      reloadData();
      addToast({
        type: 'info',
        title: 'Student Removed',
        message: `Removed ${target?.displayName || 'student'} from active cohort.`,
      });
    },
    [students, reloadData, addToast]
  );

  const resetAllData = useCallback(() => {
    MockStudentService.resetToDefault();
    reloadData();
    addToast({
      type: 'info',
      title: 'Demo Data Reset',
      message: 'Restored original demo dataset with 11 students.',
    });
  }, [reloadData, addToast]);

  return (
    <StudentDataContext.Provider
      value={{
        students,
        profiles,
        isLoading,
        refreshingStudentId,
        toasts,
        addToast,
        removeToast,
        refreshStudentData,
        bulkRefreshStudents,
        createStudent,
        editStudent,
        removeStudent,
        resetAllData,
        reloadData,
      }}
    >
      {children}
    </StudentDataContext.Provider>
  );
};

export const useStudentData = () => {
  const context = useContext(StudentDataContext);
  if (!context) {
    throw new Error('useStudentData must be used within a StudentDataProvider');
  }
  return context;
};
