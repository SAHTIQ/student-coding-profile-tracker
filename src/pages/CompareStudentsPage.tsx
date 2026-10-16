import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useOutletContext, Link } from 'react-router-dom';
import { useStudentData } from '../context/StudentDataContext';
import { useAuth } from '../context/AuthContext';
import { Student } from '../types/student';
import { AppHeader } from '../components/layout/AppHeader';
import { ComparisonMetricTable } from '../components/comparison/ComparisonMetricTable';
import { ComparisonCharts } from '../components/comparison/ComparisonCharts';
import { LeaderboardTable } from '../components/comparison/LeaderboardTable';
import {
  GitCompare,
  Search,
  Plus,
  X,
  Users,
  Trophy,
  Flame,
  Award,
  Sparkles,
  Layers,
  Table as TableIcon,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface CohortStats {
  topSolver: Student;
  maxSolved: number;
  topRater: Student | null;
  maxRating: number;
  topStreaker: Student;
  maxStreak: number;
  avgSolved: number;
  totalCount: number;
}

export const CompareStudentsPage: React.FC = () => {
  const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { students, profiles } = useStudentData();
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  // Active students with successful scraped data
  const activeStudents = useMemo(() => {
    return students.filter((s) => s.collectionStatus === 'success');
  }, [students]);

  // Mode: 'all' (compare all students) vs 'custom' (compare selected subset)
  const [comparisonMode, setComparisonMode] = useState<'all' | 'custom'>(() => {
    const param = searchParams.get('students');
    return param ? 'custom' : 'all';
  });

  // Active view: 'leaderboard' (full tabular matrix) vs 'matrix' (side-by-side metric columns)
  const [viewMode, setViewMode] = useState<'leaderboard' | 'matrix'>('leaderboard');

  // Search input for adding students in custom mode
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Selected student IDs when in custom mode (no arbitrary 5-student limit!)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const param = searchParams.get('students');
    if (param) {
      const handles = param.split(',').map((h) => h.trim().toLowerCase());
      const matched = students
        .filter((s) => handles.includes(s.leetcodeUsername.toLowerCase()))
        .map((s) => s.id);
      if (matched.length > 0) return matched;
    }
    // Default to all active students
    return activeStudents.map((s) => s.id);
  });

  // Synchronize URL search params
  useEffect(() => {
    if (comparisonMode === 'custom' && selectedIds.length > 0) {
      const handles = students
        .filter((s) => selectedIds.includes(s.id))
        .map((s) => s.leetcodeUsername)
        .join(',');
      setSearchParams({ students: handles }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [comparisonMode, selectedIds, students, setSearchParams]);

  // The actual students to display in charts and tables
  const displayedStudents = useMemo(() => {
    if (comparisonMode === 'all') {
      return activeStudents;
    }
    return students.filter((s) => selectedIds.includes(s.id) && s.collectionStatus === 'success');
  }, [comparisonMode, activeStudents, students, selectedIds]);

  // Cohort Highlights (Leaders for Top KPI Banner)
  const cohortStats = useMemo<CohortStats | null>(() => {
    if (displayedStudents.length === 0) return null;

    let topSolver: Student = displayedStudents[0];
    let maxSolved = -1;

    let topRater: Student | null = null;
    let maxRating = -1;

    let topStreaker: Student = displayedStudents[0];
    let maxStreak = -1;

    let totalSolvedSum = 0;

    for (const s of displayedStudents) {
      const p = profiles[s.leetcodeUsername.toLowerCase()];
      const solved = p?.problemStatistics.all || 0;
      const rating = p?.contestSummary?.rating || 0;
      const streak = p?.calendarSummary.streak || 0;

      totalSolvedSum += solved;

      if (solved > maxSolved) {
        maxSolved = solved;
        topSolver = s;
      }

      if (rating > maxRating && rating > 0) {
        maxRating = rating;
        topRater = s;
      }

      if (streak > maxStreak) {
        maxStreak = streak;
        topStreaker = s;
      }
    }

    const avgSolved = Math.round(totalSolvedSum / displayedStudents.length);

    return {
      topSolver,
      maxSolved,
      topRater,
      maxRating: Math.round(maxRating),
      topStreaker,
      maxStreak,
      avgSolved,
      totalCount: displayedStudents.length,
    };
  }, [displayedStudents, profiles]);

  // Eligible students for search dropdown in custom mode
  const eligibleStudents = useMemo(() => {
    return activeStudents.filter(
      (s) =>
        !selectedIds.includes(s.id) &&
        (s.displayName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          s.leetcodeUsername.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    );
  }, [activeStudents, selectedIds, searchQuery]);

  const handleAddStudent = (id: string) => {
    setSelectedIds([...selectedIds, id]);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleRemoveStudent = (id: string) => {
    setSelectedIds(selectedIds.filter((sId) => sId !== id));
  };

  const handleSelectAll = () => {
    setSelectedIds(activeStudents.map((s) => s.id));
    setComparisonMode('all');
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AppHeader
        onToggleSidebar={toggleSidebar}
        breadcrumbs={[
          { label: 'Analytics' },
          { label: 'Leaderboard & Comparison' },
        ]}
        pageTitle="Student Performance Leaderboard & Benchmarking"
      />

      {/* Top Cohort Benchmark Summary Banner */}
      {cohortStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Benchmarked */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 border border-brand-200 dark:border-brand-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {cohortStats.totalCount}
              </div>
              <div className="text-xs text-slate-500 font-medium">Students Compared</div>
            </div>
          </div>

          {/* Top Solver */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {cohortStats.maxSolved}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">solved</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold truncate">
                {cohortStats.topSolver.displayName} (#1)
              </div>
            </div>
          </div>

          {/* Contest Rating Leader */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {cohortStats.maxRating > 0 ? cohortStats.maxRating : 'Unrated'}
                </span>
                {cohortStats.maxRating > 0 && (
                  <span className="text-[11px] text-slate-400 font-mono">rating</span>
                )}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold truncate">
                {cohortStats.topRater ? cohortStats.topRater.displayName : 'None Rated'}
              </div>
            </div>
          </div>

          {/* Highest Active Streak */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
              <Flame className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {cohortStats.maxStreak}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">days</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold truncate">
                {cohortStats.topStreaker.displayName} (Streak)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel: Cohort Scope & View Mode */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Comparison Scope Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                onClick={() => {
                  setComparisonMode('all');
                  setSelectedIds(activeStudents.map((s) => s.id));
                }}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  comparisonMode === 'all'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Compare All Students ({activeStudents.length})</span>
              </button>

              <button
                onClick={() => setComparisonMode('custom')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  comparisonMode === 'custom'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Custom Selection ({selectedIds.length})</span>
              </button>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <span className="text-xs text-slate-400 font-medium">Layout:</span>
            <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setViewMode('leaderboard')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === 'leaderboard'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Full Leaderboard Table with all columns"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Leaderboard</span>
              </button>

              <button
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === 'matrix'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Side-by-side metric matrix"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Side-by-Side Matrix</span>
              </button>
            </div>
          </div>
        </div>

        {/* Custom Selection Chips & Add Student (shown only in Custom Mode) */}
        {comparisonMode === 'custom' && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-medium mr-1">Benchmarked:</span>
            {displayedStudents.map((student) => {
              const p = profiles[student.leetcodeUsername.toLowerCase()];
              return (
                <div
                  key={student.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-xs"
                >
                  {p?.profile.userAvatar ? (
                    <img
                      src={p.profile.userAvatar}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-[9px]">
                      {student.displayName.substring(0, 1)}
                    </div>
                  )}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {student.displayName}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    @{student.leetcodeUsername}
                  </span>
                  <button
                    onClick={() => handleRemoveStudent(student.id)}
                    className="text-slate-400 hover:text-rose-600 ml-1 p-0.5"
                    title="Remove from comparison"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {/* Add Student Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 text-slate-600 dark:text-slate-400 text-xs font-medium hover:text-brand-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Student to Compare...</span>
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-72 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2 animate-in fade-in duration-150">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search student..."
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {eligibleStudents.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400">
                          No more eligible active students
                        </div>
                      ) : (
                        eligibleStudents.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => handleAddStudent(s.id)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs transition-colors"
                          >
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white block">
                                {s.displayName}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                @{s.leetcodeUsername}
                              </span>
                            </div>
                            <Plus className="w-3.5 h-3.5 text-brand-600" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {selectedIds.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium ml-2"
              >
                Clear all
              </button>
            )}

            <button
              onClick={handleSelectAll}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium ml-2"
            >
              Select All ({activeStudents.length})
            </button>
          </div>
        )}
      </div>

      {/* Main Section */}
      {students.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center shadow-card">
          <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No Student Profiles to Compare Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            Add real LeetCode handles or profile URLs from the Students page to automatically generate your cohort leaderboard and benchmark all students side-by-side.
          </p>
          <div className="mt-4">
            <Link
              to="/students"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Real Students</span>
            </Link>
          </div>
        </div>
      ) : displayedStudents.length === 0 ? (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-8 text-center text-amber-900 dark:text-amber-200 shadow-card">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold">No students selected for comparison</h3>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 max-w-sm mx-auto">
            Click "Compare All Students" above or add students to the cohort selection to view benchmark analytics.
          </p>
          <button
            onClick={handleSelectAll}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors"
          >
            Compare All Students ({activeStudents.length})
          </button>
        </div>
      ) : (
        <>
          {/* Comparative Visual Charts across all compared students */}
          <ComparisonCharts students={displayedStudents} profiles={profiles} />

          {/* Primary View: Comprehensive Leaderboard Table */}
          {viewMode === 'leaderboard' ? (
            <LeaderboardTable students={displayedStudents} profiles={profiles} />
          ) : (
            <ComparisonMetricTable students={displayedStudents} profiles={profiles} />
          )}
        </>
      )}
    </div>
  );
};
