import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useStudentData } from '../../context/StudentDataContext';
import { Breadcrumbs } from '../common/Breadcrumbs';
import {
  Menu,
  Bell,
  RefreshCw,
  Sun,
  Moon,
  Shield,
  GraduationCap,
  Sparkles,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface AppHeaderProps {
  onToggleSidebar?: () => void;
  breadcrumbs?: Array<{ label: string; path?: string }>;
  pageTitle?: string;
  selectedRange?: string;
  onRangeChange?: (range: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onToggleSidebar,
  breadcrumbs = [{ label: 'Dashboard' }],
  pageTitle,
  selectedRange = '30d',
  onRangeChange,
}) => {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { bulkRefreshStudents, students, isLoading } = useStudentData();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleGlobalRefresh = () => {
    const successStudentIds = students
      .filter((s) => s.collectionStatus === 'success')
      .slice(0, 5)
      .map((s) => s.id);
    bulkRefreshStudents(successStudentIds);
  };

  const sampleNotifications = [
    {
      id: 'n1',
      title: 'Cohort Sync Completed',
      time: '12m ago',
      desc: 'Simulated metrics collection refreshed for active students.',
    },
    {
      id: 'n2',
      title: 'Weekly Contest 418 Processed',
      time: '1h ago',
      desc: '3 students showed rating increases in recent contest standings.',
    },
    {
      id: 'n3',
      title: 'Activity Forecast Model Calibrated',
      time: 'Yesterday',
      desc: 'Baseline WMA weights updated with 180-day seasonality.',
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            title="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <Breadcrumbs items={breadcrumbs} />
            {pageTitle && (
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                {pageTitle}
              </h1>
            )}
          </div>
        </div>

        {/* Right: Date-range selector, Refresh, Notifications, Theme, User menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Date range filter */}
          {onRangeChange && (
            <div className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              {['7d', '30d', '90d', 'all'].map((r) => (
                <button
                  key={r}
                  onClick={() => onRangeChange(r)}
                  className={`px-2.5 py-1 rounded-md uppercase font-mono font-medium transition-all ${
                    selectedRange === r
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* Refresh Action Button */}
          <button
            onClick={handleGlobalRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
            title="Trigger simulated cohort data sync"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Notification Menu */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-white dark:ring-slate-900" />
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      System Notifications
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-600 font-medium">
                      Simulated
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {sampleNotifications.map((n) => (
                      <div key={n.id} className="text-xs space-y-0.5">
                        <div className="flex items-center justify-between font-medium text-slate-800 dark:text-slate-200">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {n.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Avatar & Dropdown */}
          <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {user?.displayName ? user.displayName.substring(0, 2) : 'CP'}
                </div>
              )}
              <div className="text-left hidden xl:block">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block leading-tight">
                  {user?.displayName}
                </span>
                <span className="text-[10px] font-mono text-slate-400 capitalize">
                  {role} Demo
                </span>
              </div>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {user?.displayName}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-medium"
                  >
                    Logout Demo Session
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
