import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GitCompare,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  LogOut,
  Activity,
  Shield,
  GraduationCap,
  Sparkles,
  X,
  Trophy,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onClose }) => {
  const { user, role, logout, loginAsAdmin, loginAsStudent } = useAuth();
  const isAdmin = role === 'admin';

  // Role-appropriate navigation items (Section 4 & 5)
  const navItems = isAdmin
    ? [
        { label: 'Overview', to: '/admin-overview', icon: LayoutDashboard },
        { label: 'Students', to: '/students', icon: Users },
        { label: 'Leaderboard & Compare', to: '/compare', icon: Trophy },
        { label: 'Reports', to: '/reports', icon: FileSpreadsheet },
        { label: 'Settings', to: '/settings', icon: Settings },
      ]
    : [
        { label: 'My Analytics', to: '/my-analytics', icon: UserCheck },
        { label: 'Leaderboard & Compare', to: '/compare', icon: Trophy },
        { label: 'Reports', to: '/reports', icon: FileSpreadsheet },
        { label: 'Settings', to: '/settings', icon: Settings },
      ];

  const handleRoleToggle = () => {
    if (isAdmin) {
      loginAsStudent();
    } else {
      loginAsAdmin();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Top: Brand Header & Navigation */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/30">
                <Activity className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  CodePulse
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-400 font-semibold border border-brand-500/30">
                    ANALYTICS
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 block -mt-0.5">
                  LeetCode Productivity
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
              {isAdmin ? 'ADMINISTRATIVE SUITE' : 'STUDENT WORKSPACE'}
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group',
                      isActive
                        ? 'bg-brand-600 text-white font-semibold shadow-sm shadow-brand-600/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                    )
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Demo User Profile & Role Switcher - Statically Pinned at Bottom */}
        <div className="shrink-0 p-4 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 mb-3 shadow-xs">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 ring-1 ring-brand-500/50">
                {user?.displayName ? user.displayName.substring(0, 2) : 'CP'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-white block truncate">
                {user?.displayName || 'Demo User'}
              </span>
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                {isAdmin ? (
                  <>
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span>Super Admin</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-3 h-3 text-brand-400" />
                    <span>Student Demo</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Quick Demo Switch Role button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRoleToggle}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 border border-slate-700/60 shadow-xs"
              title="Toggle role between Super Admin and Student"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Switch to {isAdmin ? 'Student' : 'Admin'}</span>
            </button>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-900/40 transition-colors"
              title="Logout demo session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
