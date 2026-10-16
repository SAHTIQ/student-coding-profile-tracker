import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { DemoLoginPage } from './pages/DemoLoginPage';
import { AdminOverviewPage } from './pages/AdminOverviewPage';
import { StudentsPage } from './pages/StudentsPage';
import { StudentAnalyticsPage } from './pages/StudentAnalyticsPage';
import { MyAnalyticsPage } from './pages/MyAnalyticsPage';
import { CompareStudentsPage } from './pages/CompareStudentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Route guard for authenticated users
const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

// Route guard for Super Admin only routes (Section 4: protect routes and actions, not just hide sidebar links)
const RequireAdmin: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (role !== 'admin') {
    // If student tries to access admin routes, redirect to student analytics
    return <Navigate to="/my-analytics" replace />;
  }
  return children;
};

// Index redirect based on active role
const RoleIndexRedirect: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (role === 'admin') {
    return <Navigate to="/admin-overview" replace />;
  }
  return <Navigate to="/my-analytics" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<DemoLoginPage />} />

      {/* Protected App Routes */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<RoleIndexRedirect />} />

        {/* Super Admin Only */}
        <Route
          path="admin-overview"
          element={
            <RequireAdmin>
              <AdminOverviewPage />
            </RequireAdmin>
          }
        />
        <Route
          path="students"
          element={
            <RequireAdmin>
              <StudentsPage />
            </RequireAdmin>
          }
        />

        {/* Student Primary Analytics */}
        <Route path="my-analytics" element={<MyAnalyticsPage />} />

        {/* Individual Student Detail */}
        <Route path="students/:id" element={<StudentAnalyticsPage />} />

        {/* Shared Analytics & Features */}
        <Route path="compare" element={<CompareStudentsPage />} />
        <Route path="forecast" element={<Navigate to="/compare" replace />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
