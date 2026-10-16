import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Student, CollectionStatus } from '../../types/student';
import { LeetCodeProfile } from '../../types/leetcode';
import { CollectionStatusBadge } from '../common/CollectionStatusBadge';
import { formatRelativeTime } from '../../utils/dateUtils';
import { getLeetCodeProfileUrl } from '../../utils/metricCalculations';
import {
  ExternalLink,
  Eye,
  GitCompare,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  Edit,
  Flame,
  Award,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';

interface StudentTableProps {
  students: Student[];
  profiles: Record<string, LeetCodeProfile>;
  isAdmin?: boolean;
  onRefreshStudent?: (id: string) => void;
  onEditStudent?: (student: Student) => void;
  onDeleteStudent?: (id: string) => void;
  onBulkRefresh?: (ids: string[]) => void;
  refreshingStudentId?: string | null;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  profiles,
  isAdmin = false,
  onRefreshStudent,
  onEditStudent,
  onDeleteStudent,
  onBulkRefresh,
  refreshingStudentId,
}) => {
  const navigate = useNavigate();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'problemsSolved' | 'activeDays' | 'streak' | 'contestRating' | 'lastFetchedAt' | 'displayName'
  >('problemsSolved');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set);
  }, [students]);

  // Unique years
  const years = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.yearOfStudy) set.add(s.yearOfStudy);
    });
    return Array.from(set);
  }, [students]);

  // Filtered & Sorted
  const filteredStudents = useMemo(() => {
    let list = [...students];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.displayName.toLowerCase().includes(q) ||
          s.leetcodeUsername.toLowerCase().includes(q) ||
          (s.studentId && s.studentId.toLowerCase().includes(q))
      );
    }

    if (departmentFilter !== 'all') {
      list = list.filter((s) => s.department === departmentFilter);
    }

    if (yearFilter !== 'all') {
      list = list.filter((s) => s.yearOfStudy === yearFilter);
    }

    if (statusFilter !== 'all') {
      list = list.filter((s) => s.collectionStatus === statusFilter);
    }

    // Sort
    list.sort((a, b) => {
      const pa = profiles[a.leetcodeUsername.toLowerCase()];
      const pb = profiles[b.leetcodeUsername.toLowerCase()];

      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (sortBy) {
        case 'displayName':
          valA = a.displayName.toLowerCase();
          valB = b.displayName.toLowerCase();
          break;
        case 'problemsSolved':
          valA = pa?.problemStatistics.all || 0;
          valB = pb?.problemStatistics.all || 0;
          break;
        case 'activeDays':
          valA = pa?.calendarSummary.totalActiveDays || 0;
          valB = pb?.calendarSummary.totalActiveDays || 0;
          break;
        case 'streak':
          valA = pa?.calendarSummary.streak || 0;
          valB = pb?.calendarSummary.streak || 0;
          break;
        case 'contestRating':
          valA = pa?.contestSummary?.rating || 0;
          valB = pb?.contestSummary?.rating || 0;
          break;
        case 'lastFetchedAt':
          valA = a.lastFetchedAt ? new Date(a.lastFetchedAt).getTime() : 0;
          valB = b.lastFetchedAt ? new Date(b.lastFetchedAt).getTime() : 0;
          break;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [students, profiles, searchQuery, departmentFilter, yearFilter, statusFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedStudents.map((s) => s.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkCompare = () => {
    if (selectedIds.length === 0) return;
    const usernames = students
      .filter((s) => selectedIds.includes(s.id))
      .map((s) => s.leetcodeUsername)
      .join(',');
    navigate(`/compare?students=${encodeURIComponent(usernames)}`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-card overflow-hidden">
      {/* Search and Filters Bar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by student name, @username, or roll number..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Quick Stats & Bulk Actions */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in duration-150">
                <span className="text-xs font-mono font-medium text-brand-600 dark:text-brand-400 px-2 py-1 bg-brand-50 dark:bg-brand-950/50 rounded-lg">
                  {selectedIds.length} Selected
                </span>
                <button
                  onClick={handleBulkCompare}
                  className="px-3 py-1.5 text-xs font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-1.5 shadow-sm"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>Compare Selected</span>
                </button>
                {isAdmin && onBulkRefresh && (
                  <button
                    onClick={() => onBulkRefresh(selectedIds)}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Selected</span>
                  </button>
                )}
              </div>
            )}
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Showing {filteredStudents.length} of {students.length} students
            </span>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1 text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium">Filter by:</span>
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Year Filter */}
          <select
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Collection Statuses</option>
            <option value="success">Active Profiles</option>
            <option value="pending">Pending Sync</option>
            <option value="fetching">Fetching</option>
            <option value="not_found">Profile Not Found</option>
            <option value="rate_limited">Rate Limited</option>
            <option value="failed">Collection Failed</option>
          </select>

          {/* Reset Filters */}
          {(departmentFilter !== 'all' || yearFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setDepartmentFilter('all');
                setYearFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium ml-auto"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-3 w-10 text-center">
                <button
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {selectedIds.length === paginatedStudents.length && paginatedStudents.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-brand-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3 w-12 text-center">Rank</th>
              <th className="py-3 px-4">
                <button
                  onClick={() => toggleSort('displayName')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Student</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-3">
                <button
                  onClick={() => toggleSort('problemsSolved')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Problems Solved</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-3 text-center">
                <button
                  onClick={() => toggleSort('activeDays')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Active Days</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-3 text-center">
                <button
                  onClick={() => toggleSort('streak')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Streak</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-3 text-center">
                <button
                  onClick={() => toggleSort('contestRating')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Contest Rating</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">
                <button
                  onClick={() => toggleSort('lastFetchedAt')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Last Synced</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No students match your active filters
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try refining your search terms or clearing status filters.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student, idx) => {
                const profile = profiles[student.leetcodeUsername.toLowerCase()];
                const rankNum = (currentPage - 1) * pageSize + idx + 1;
                const isSelected = selectedIds.includes(student.id);
                const isSyncing = refreshingStudentId === student.id;

                const solved = profile?.problemStatistics;
                const contest = profile?.contestSummary;
                const leetcodeUrl = getLeetCodeProfileUrl(student.leetcodeUsername);

                return (
                  <tr
                    key={student.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggleSelectOne(student.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-brand-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Rank */}
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-500">
                      {rankNum <= 3 ? (
                        <span
                          className={`inline-block w-6 h-6 rounded-full text-xs leading-6 font-bold text-white ${
                            rankNum === 1
                              ? 'bg-amber-500'
                              : rankNum === 2
                              ? 'bg-slate-400'
                              : 'bg-amber-700'
                          }`}
                        >
                          {rankNum}
                        </span>
                      ) : (
                        <span>#{rankNum}</span>
                      )}
                    </td>

                    {/* Student Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {profile?.profile.userAvatar ? (
                          <img
                            src={profile.profile.userAvatar}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 uppercase shrink-0">
                            {student.displayName.substring(0, 2)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Link
                              to={`/students/${student.id}`}
                              className="font-semibold text-slate-900 dark:text-white hover:text-brand-600 transition-colors"
                            >
                              {student.displayName}
                            </Link>
                            {student.studentId && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                {student.studentId}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                            <span>@{student.leetcodeUsername}</span>
                            {student.department && <span>• {student.department.split('&')[0]}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Problems Solved */}
                    <td className="py-3 px-3 font-mono">
                      {solved ? (
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {solved.all}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] mt-0.5">
                            <span className="text-emerald-600 font-semibold">{solved.easy}E</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-amber-600 font-semibold">{solved.medium}M</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-rose-600 font-semibold">{solved.hard}H</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Sync pending</span>
                      )}
                    </td>

                    {/* Active Days */}
                    <td className="py-3 px-3 text-center font-mono">
                      {profile ? (
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {profile.calendarSummary.totalActiveDays}d
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Current Streak */}
                    <td className="py-3 px-3 text-center font-mono">
                      {profile && profile.calendarSummary.streak > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-800">
                          <Flame className="w-3 h-3 fill-current" />
                          {profile.calendarSummary.streak}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">0</span>
                      )}
                    </td>

                    {/* Contest Rating */}
                    <td className="py-3 px-3 text-center font-mono">
                      {contest && contest.rating ? (
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {Math.round(contest.rating)}
                          </span>
                          {contest.topPercentage && (
                            <span className="text-[10px] text-brand-600 dark:text-brand-400 block">
                              Top {contest.topPercentage.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unrated</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <CollectionStatusBadge status={student.collectionStatus} />
                    </td>

                    {/* Last Synced */}
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {formatRelativeTime(student.lastFetchedAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={`/students/${student.id}`}
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-brand-600 transition-colors"
                          title="View Student Analytics"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/compare?students=${encodeURIComponent(student.leetcodeUsername)}`}
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
                          title="Compare Student"
                        >
                          <GitCompare className="w-4 h-4" />
                        </Link>
                        <a
                          href={leetcodeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-600 transition-colors"
                          title="Open Public LeetCode Profile"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        {isAdmin && onRefreshStudent && (
                          <button
                            onClick={() => onRefreshStudent(student.id)}
                            disabled={isSyncing}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-brand-600 disabled:opacity-40 transition-colors"
                            title="Simulate LeetCode Sync"
                          >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        {isAdmin && onEditStudent && (
                          <button
                            onClick={() => onEditStudent(student)}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 transition-colors"
                            title="Edit Record"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && onDeleteStudent && (
                          <button
                            onClick={() => onDeleteStudent(student.id)}
                            className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div>
          Page <strong className="font-mono text-slate-800 dark:text-slate-200">{currentPage}</strong> of{' '}
          <strong className="font-mono text-slate-800 dark:text-slate-200">{totalPages}</strong>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors font-medium"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors font-medium"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
