import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types/student';

interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  avatar?: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loginAsAdmin: () => void;
  loginAsStudent: (studentId?: string, username?: string, displayName?: string) => void;
  logout: () => void;
}

const AUTH_STORAGE_KEY = 'codepulse_auth_session_v1';

const DEFAULT_ADMIN_USER: AuthUser = {
  id: 'admin-1',
  username: 'admin',
  displayName: 'Super Admin',
  role: 'admin',
  email: 'admin@campus-codepulse.org',
};

const DEFAULT_STUDENT_USER: AuthUser = {
  id: 'stu-1',
  username: 'aarav_algo',
  displayName: 'Aarav Sharma',
  role: 'student',
  email: 'aarav.sharma@campus.edu',
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
    return DEFAULT_ADMIN_USER; // Default to admin for fast demo access
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const loginAsAdmin = () => {
    setUser(DEFAULT_ADMIN_USER);
  };

  const loginAsStudent = (
    studentId: string = 'stu-1',
    username: string = 'aarav_algo',
    displayName: string = 'Aarav Sharma'
  ) => {
    setUser({
      id: studentId,
      username,
      displayName,
      role: 'student',
      email: `${username}@campus.edu`,
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
        loginAsAdmin,
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
