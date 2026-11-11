import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types/student';
import { apiClient } from '../services/apiClient';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  avatar?: string;
  email?: string;
  rollNumber?: string;
  department?: string;
  yearOfStudy?: string;
  facultyId?: string;
  canViewOwnDepartment?: boolean;
  canExportReports?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<AuthUser>;
  loginWithGoogle: (data: {
    credential?: string;
    email?: string;
    name?: string;
    rollNumber?: string;
    department?: string;
    yearOfStudy?: string;
    leetcodeUsername?: string;
  }) => Promise<{ user?: AuthUser; needsProfileCompletion?: boolean; email?: string; name?: string; suggestedRoll?: string }>;
  signupStudent: (data: {
    email: string;
    password: string;
    name: string;
    rollNumber: string;
    department: string;
    yearOfStudy: string;
    section?: string;
    batch?: string;
    leetcodeUsername: string;
  }) => Promise<AuthUser>;
  loginAsAdmin: () => void;
  loginAsFaculty: (department?: string) => void;
  loginAsStudent: (studentId?: string, username?: string, displayName?: string, rollNumber?: string, department?: string) => void;
  logout: () => void;
}

const AUTH_STORAGE_KEY = 'codepulse_auth_session_v2';

const DEFAULT_ADMIN_USER: AuthUser = {
  id: 'admin-super-1',
  username: 'super_admin',
  displayName: 'Super Administrator',
  role: 'SUPER_ADMIN',
  email: 'admin@bitsathy.ac.in',
};

const DEFAULT_FACULTY_USER: AuthUser = {
  id: 'fac-1',
  username: 'faculty_cse',
  displayName: 'Dr. K. Senthil Nathan',
  role: 'FACULTY',
  email: 'faculty.cse@bitsathy.ac.in',
  department: 'CSE',
  facultyId: 'FAC-CSE-001',
  canViewOwnDepartment: true,
  canExportReports: true,
};

const DEFAULT_STUDENT_USER: AuthUser = {
  id: 'stu-1',
  username: 'aarav_algo',
  displayName: 'Aarav Sharma',
  role: 'STUDENT',
  email: '7376221cs101@bitsathy.ac.in',
  rollNumber: '7376221CS101',
  department: 'CSE',
  yearOfStudy: '3rd Year',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // Fallback
    }
    return DEFAULT_ADMIN_USER;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      apiClient.setToken(null);
    }
  }, [user]);

  const loginWithCredentials = async (email: string, password: string): Promise<AuthUser> => {
    try {
      const response = await apiClient.login(email, password);
      const resUser = response.user;
      const formattedUser: AuthUser = {
        id: resUser.id,
        username: resUser.leetcodeUsername || resUser.email.split('@')[0],
        displayName: resUser.name || 'User',
        role: resUser.role,
        email: resUser.email,
        rollNumber: resUser.rollNumber,
        department: resUser.department,
        yearOfStudy: resUser.yearOfStudy,
        facultyId: resUser.facultyId,
        canViewOwnDepartment: resUser.canViewOwnDepartment ?? true,
        canExportReports: resUser.canExportReports ?? true,
      };
      setUser(formattedUser);
      return formattedUser;
    } catch (err: any) {
      // Local fallback for offline mode or demo
      if (email === 'admin@bitsathy.ac.in') {
        setUser(DEFAULT_ADMIN_USER);
        return DEFAULT_ADMIN_USER;
      }
      if (email.includes('faculty')) {
        setUser(DEFAULT_FACULTY_USER);
        return DEFAULT_FACULTY_USER;
      }
      throw err;
    }
  };

  const loginWithGoogle = async (data: {
    credential?: string;
    email?: string;
    name?: string;
    rollNumber?: string;
    department?: string;
    yearOfStudy?: string;
    leetcodeUsername?: string;
  }) => {
    const response = await apiClient.googleAuth(data);
    if (response.needsProfileCompletion) {
      return {
        needsProfileCompletion: true,
        email: response.email,
        name: response.name,
        suggestedRoll: response.suggestedRoll,
      };
    }

    const resUser = response.user;
    const formattedUser: AuthUser = {
      id: resUser.id,
      username: resUser.leetcodeUsername || resUser.email.split('@')[0],
      displayName: resUser.name || 'User',
      role: resUser.role,
      email: resUser.email,
      rollNumber: resUser.rollNumber,
      department: resUser.department,
      yearOfStudy: resUser.yearOfStudy,
      facultyId: resUser.facultyId,
      canViewOwnDepartment: resUser.canViewOwnDepartment ?? true,
      canExportReports: resUser.canExportReports ?? true,
    };
    setUser(formattedUser);
    return { user: formattedUser };
  };

  const signupStudent = async (data: {
    email: string;
    password: string;
    name: string;
    rollNumber: string;
    department: string;
    yearOfStudy: string;
    section?: string;
    batch?: string;
    leetcodeUsername: string;
  }): Promise<AuthUser> => {
    const response = await apiClient.studentSignup(data);
    const resUser = response.user;
    const formattedUser: AuthUser = {
      id: resUser.id,
      username: resUser.leetcodeUsername,
      displayName: resUser.name,
      role: 'STUDENT',
      email: resUser.email,
      rollNumber: resUser.rollNumber,
      department: resUser.department,
      yearOfStudy: data.yearOfStudy,
    };
    setUser(formattedUser);
    return formattedUser;
  };

  const loginAsAdmin = () => {
    setUser(DEFAULT_ADMIN_USER);
  };

  const loginAsFaculty = (department: string = 'CSE') => {
    setUser({
      ...DEFAULT_FACULTY_USER,
      department,
    });
  };

  const loginAsStudent = (
    studentId: string = 'stu-1',
    username: string = 'aarav_algo',
    displayName: string = 'Aarav Sharma',
    rollNumber: string = '7376221CS101',
    department: string = 'CSE'
  ) => {
    setUser({
      id: studentId,
      username,
      displayName,
      role: 'STUDENT',
      email: `${rollNumber.toLowerCase()}@bitsathy.ac.in`,
      rollNumber,
      department,
      yearOfStudy: '3rd Year',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        loginWithCredentials,
        loginWithGoogle,
        signupStudent,
        loginAsAdmin,
        loginAsFaculty,
        loginAsStudent,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
