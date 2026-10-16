import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Student } from '../../types/student';
import { LeetCodeProfile } from '../../types/leetcode';
import { ExportService } from '../../services/exportService';
import { calculateAcceptanceRate, calculateConsistencyRate, getLeetCodeProfileUrl } from '../../utils/metricCalculations';
import { formatRelativeTime } from '../../utils/dateUtils';
import {
  Trophy,
  Flame,
  Calendar,
  ExternalLink,
  Eye,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Code2,
  Medal,
  CheckCircle2,
  Sparkles,
  Award,
} from 'lucide-react';

const STANDARD_LEETCODE_TOPICS = [
  { slug: 'dynamic-programming', name: 'Dynamic Programming' },
  { slug: 'array', name: 'Array' },
  { slug: 'string', name: 'String' },
  { slug: 'hash-table', name: 'Hash Table' },
  { slug: 'tree', name: 'Tree' },
  { slug: 'depth-first-search', name: 'Depth-First Search' },
  { slug: 'breadth-first-search', name: 'Breadth-First Search' },
  { slug: 'binary-search', name: 'Binary Search' },
  { slug: 'greedy', name: 'Greedy' },
  { slug: 'math', name: 'Math' },
  { slug: 'two-pointers', name: 'Two Pointers' },
  { slug: 'backtracking', name: 'Backtracking' },
  { slug: 'graph', name: 'Graph' },
  { slug: 'stack', name: 'Stack' },
  { slug: 'matrix', name: 'Matrix' },
  { slug: 'bit-manipulation', name: 'Bit Manipulation' },
  { slug: 'sliding-window', name: 'Sliding Window' },
  { slug: 'heap-priority-queue', name: 'Heap (Priority Queue)' },
  { slug: 'trie', name: 'Trie' },
  { slug: 'segment-tree', name: 'Segment Tree' },
];

interface LeaderboardTableProps {
  students: Student[];
  profiles: Record<string, LeetCodeProfile>;
}

type SortField =
  | 'solved'
  | 'rating'
  | 'streak'
  | 'activeDays'
  | 'hard'
  | 'medium'
  | 'easy'
  | 'acceptance'
  | 'topic'
  | 'name';

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  students,
  profiles,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [cohortFilter, setCohortFilter] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('solved');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set);
  }, [students]);

  // Unique cohort / batch tags
  const cohorts = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.cohort) set.add(s.cohort);
      if (s.tags) s.tags.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [students]);

  // Available topics: Standard DSA topics + any tags scraped from profiles
  const availableTopics = useMemo(() => {
    const topicMap = new Map<string, string>(); // slug -> name
    // Pre-populate so "Dynamic Programming", "Tree", etc. are guaranteed to be present
    STANDARD_LEETCODE_TOPICS.forEach((t) => topicMap.set(t.slug, t.name));

    students.forEach((s) => {
      const p = profiles[s.leetcodeUsername.toLowerCase()];
      if (p?.tagProblemCounts) {
        const allTags = [
          ...(p.tagProblemCounts.advanced || []),
          ...(p.tagProblemCounts.intermediate || []),
          ...(p.tagProblemCounts.fundamental || []),
        ];
        allTags.forEach((t) => {
          if (t.tagSlug && t.tagName) {
            topicMap.set(t.tagSlug, t.tagName);
          }
        });
      }
    });

    return Array.from(topicMap.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, profiles]);

  const selectedTopicName = useMemo(() => {
    if (selectedTopic === 'all') return '';
    return availableTopics.find((t) => t.slug === selectedTopic)?.name || selectedTopic;
  }, [selectedTopic, availableTopics]);

  const getTopicSolved = (p?: LeetCodeProfile, slug?: string): number => {
    if (!p || !slug || slug === 'all') return 0;
    if (p.tagProblemCounts) {
      const allTags = [
        ...(p.tagProblemCounts.advanced || []),
        ...(p.tagProblemCounts.intermediate || []),
        ...(p.tagProblemCounts.fundamental || []),
      ];
      // Normalize both target and candidate to avoid string mismatch
      const target = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
      const found = allTags.find((t) => {
        const s = (t.tagSlug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const n = (t.tagName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return s === target || n === target;
      });
      if (found) return found.problemsSolved;
    }
    return 0;
  };

  // Max solved across cohort to render proportional progress bars
  const maxSolved = useMemo(() => {
    let max = 1;
    students.forEach((s) => {
      const p = profiles[s.leetcodeUsername.toLowerCase()];
      const solved = p?.problemStatistics.all || 0;
      if (solved > max) max = solved;
    });
    return max;
  }, [students, profiles]);

  // Max solved in the selected topic across cohort
  const maxTopicSolved = useMemo(() => {
    if (selectedTopic === 'all') return 1;
    let max = 1;
    students.forEach((s) => {
      const p = profiles[s.leetcodeUsername.toLowerCase()];
      const cnt = getTopicSolved(p, selectedTopic);
      if (cnt > max) max = cnt;
    });
    return max;
  }, [students, profiles, selectedTopic]);

  // Filtered and Sorted list
  const rankedStudents = useMemo(() => {
    let list = students.filter((s) => s.collectionStatus === 'success');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.displayName.toLowerCase().includes(q) ||
          s.leetcodeUsername.toLowerCase().includes(q) ||
          (s.studentId && s.studentId.toLowerCase().includes(q)) ||
          (s.department && s.department.toLowerCase().includes(q)) ||
          (s.cohort && s.cohort.toLowerCase().includes(q))
      );
    }

    if (departmentFilter !== 'all') {
      list = list.filter((s) => s.department === departmentFilter);
    }

    if (cohortFilter !== 'all') {
      list = list.filter((s) => s.cohort === cohortFilter || (s.tags && s.tags.includes(cohortFilter)));
    }

    // Sort
    list.sort((a, b) => {
      const pA = profiles[a.leetcodeUsername.toLowerCase()];
      const pB = profiles[b.leetcodeUsername.toLowerCase()];

      let valA = 0;
      let valB = 0;

      switch (sortBy) {
        case 'topic':
          valA = getTopicSolved(pA, selectedTopic);
          valB = getTopicSolved(pB, selectedTopic);
          if (valA === valB) {
            const totA = pA?.problemStatistics.all || 0;
            const totB = pB?.problemStatistics.all || 0;
            return sortOrder === 'asc' ? totA - totB : totB - totA;
          }
          break;
        case 'solved':
          valA = pA?.problemStatistics.all || 0;
          valB = pB?.problemStatistics.all || 0;
          break;
        case 'rating':
          valA = pA?.contestSummary?.rating || 0;
          valB = pB?.contestSummary?.rating || 0;
          break;
        case 'streak':
          valA = pA?.calendarSummary.streak || 0;
          valB = pB?.calendarSummary.streak || 0;
          break;
        case 'activeDays':
          valA = pA?.calendarSummary.totalActiveDays || 0;
          valB = pB?.calendarSummary.totalActiveDays || 0;
          break;
        case 'hard':
          valA = pA?.problemStatistics.hard || 0;
          valB = pB?.problemStatistics.hard || 0;
          break;
        case 'medium':
          valA = pA?.problemStatistics.medium || 0;
          valB = pB?.problemStatistics.medium || 0;
          break;
        case 'easy':
          valA = pA?.problemStatistics.easy || 0;
          valB = pB?.problemStatistics.easy || 0;
          break;
        case 'acceptance':
          valA = pA ? calculateAcceptanceRate(pA.problemStatistics.all, pA.allSubmissionStatistics.all || pA.problemStatistics.all * 1.5) : 0;
          valB = pB ? calculateAcceptanceRate(pB.problemStatistics.all, pB.allSubmissionStatistics.all || pB.problemStatistics.all * 1.5) : 0;
          break;
        case 'name':
          return sortOrder === 'asc'
            ? a.displayName.localeCompare(b.displayName)
            : b.displayName.localeCompare(a.displayName);
      }

      if (sortOrder === 'asc') {
        return valA - valB;
      }
      return valB - valA;
    });

    return list;
  }, [students, profiles, searchQuery, departmentFilter, cohortFilter, selectedTopic, sortBy, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Rank',
      'Student Name',
      'LeetCode Username',
      'Student ID',
      'Department',
      'Year',
      'Total Solved',
      'Easy Solved',
      'Medium Solved',
      'Hard Solved',
      'Contest Rating',
      'Global Contest Rank',
      'Contests Attended',
      'Contest Badge',
      'Active Days',
      'Current Streak',
      '30-Day Consistency (%)',
      'Acceptance Rate (%)',
      'Total Submissions',
      'Primary Language',
      'LeetCode Profile URL',
      'Last Scraped',
    ];

    const rows = rankedStudents.map((s, index) => {
      const p = profiles[s.leetcodeUsername.toLowerCase()];
      const easy = p?.problemStatistics.easy || 0;
      const med = p?.problemStatistics.medium || 0;
      const hard = p?.problemStatistics.hard || 0;
      const all = p?.problemStatistics.all || 0;
      const totalSubs = p?.allSubmissionStatistics.all || all;
      const accRate = p ? calculateAcceptanceRate(all, totalSubs) : 0;
      const consistency = p ? calculateConsistencyRate(p.dailyActivityTimeline, 30) : 0;
      const topLang = p?.languageStatistics?.[0]?.languageName || 'N/A';

      return [
        index + 1,
        s.displayName,
        `@${s.leetcodeUsername}`,
        s.studentId || 'N/A',
        s.department || 'N/A',
        s.yearOfStudy || 'N/A',
        all,
        easy,
        med,
        hard,
        p?.contestSummary?.rating ? Math.round(p.contestSummary.rating) : 'Unrated',
        p?.contestSummary?.globalRanking ? `#${p.contestSummary.globalRanking.toLocaleString()}` : 'N/A',
        p?.contestSummary?.attendedContestsCount || 0,
        p?.contestBadge?.name || 'None',
        p?.calendarSummary.totalActiveDays || 0,
        p?.calendarSummary.streak || 0,
        consistency,
        accRate,
        totalSubs,
        topLang,
        getLeetCodeProfileUrl(s.leetcodeUsername),
        s.lastFetchedAt || 'N/A',
      ];
    });

    ExportService.downloadCSV(
      `codepulse_leaderboard_${new Date().toISOString().substring(0, 10)}.csv`,
      headers,
      rows
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-card overflow-hidden">
      {/* Table Header / Action Toolbar */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              All-Students Performance Leaderboard
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                {rankedStudents.length} Active Students
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Side-by-side benchmark matrix displaying complete problem stats, contest standing, streaks, and practice momentum without missing data.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
              title="Download entire cohort standings as CSV"
            >
              <Download className="w-3.5 h-3.5 text-brand-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, @username, roll number, or department..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Topic Filter */}
            {availableTopics.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">DSA Topic:</span>
                <select
                  value={selectedTopic}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTopic(val);
                    if (val !== 'all') {
                      setSortBy('topic');
                      setSortOrder('desc');
                    } else {
                      setSortBy('solved');
                    }
                  }}
                  className="px-3 py-2 text-xs rounded-lg border-2 border-brand-500/80 bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold shadow-xs"
                >
                  <option value="all">Concept: All Topics ({availableTopics.length})</option>
                  {availableTopics.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.slug === 'dynamic-programming' ? '⚡ ' : ''}{t.name} Leaderboard
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Department Filter */}
            {departments.length > 0 && (
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
              >
                <option value="all">All Departments ({students.length})</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    Dept: {dept}
                  </option>
                ))}
              </select>
            )}

            {/* Cohort Filter */}
            {cohorts.length > 0 && (
              <select
                value={cohortFilter}
                onChange={(e) => setCohortFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
              >
                <option value="all">All Batches / Cohorts</option>
                {cohorts.map((c) => (
                  <option key={c} value={c}>
                    Cohort: {c}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
              <span className="text-slate-400 px-2 font-medium">Sort:</span>
              <button
                onClick={() => handleSort('solved')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  sortBy === 'solved'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Overall
              </button>
              {selectedTopic !== 'all' && (
                <button
                  onClick={() => handleSort('topic')}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    sortBy === 'topic'
                      ? 'bg-brand-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Topic
                </button>
              )}
              <button
                onClick={() => handleSort('rating')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  sortBy === 'rating'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Rating
              </button>
              <button
                onClick={() => handleSort('streak')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  sortBy === 'streak'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Streak
              </button>
            </div>
          </div>
        </div>

        {/* 1-Click Quick Topic Leaderboard Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 font-semibold mr-1">Quick Topic Leaderboards:</span>
          {[
            { slug: 'dynamic-programming', label: '⚡ Dynamic Programming' },
            { slug: 'tree', label: 'Trees' },
            { slug: 'graph', label: 'Graphs' },
            { slug: 'binary-search', label: 'Binary Search' },
            { slug: 'greedy', label: 'Greedy' },
            { slug: 'array', label: 'Arrays' },
          ].map(({ slug, label }) => {
            const isActive = selectedTopic === slug;
            return (
              <button
                key={slug}
                onClick={() => {
                  if (isActive) {
                    setSelectedTopic('all');
                    setSortBy('solved');
                    setSortOrder('desc');
                  } else {
                    setSelectedTopic(slug);
                    setSortBy('topic');
                    setSortOrder('desc');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-300 dark:ring-brand-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Topic Leaderboard Active Announcement Banner */}
        {selectedTopic !== 'all' && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 px-4 rounded-xl bg-brand-50/90 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 text-xs text-brand-900 dark:text-brand-200 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
              <span>
                <strong>Topic Leaderboard Active:</strong> Cohort is ranked by{' '}
                <strong className="text-brand-700 dark:text-brand-300 underline decoration-brand-500 decoration-2">
                  {selectedTopicName}
                </strong>{' '}
                problem counts in descending order.
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedTopic('all');
                setSortBy('solved');
                setSortOrder('desc');
              }}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 font-semibold hover:bg-brand-100 transition-colors shadow-xs"
            >
              Reset to Overall Leaderboard
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th
                onClick={() => handleSort('solved')}
                className="py-3 px-4 w-14 text-center cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
              >
                Rank
              </th>
              <th
                onClick={() => handleSort('name')}
                className="py-3 px-4 min-w-[200px] cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
              >
                Student & Profile
              </th>
              <th
                onClick={() => handleSort('solved')}
                className="py-3 px-4 min-w-[150px] cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1">
                  <span>Problems Solved</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              {selectedTopic !== 'all' && (
                <th
                  onClick={() => handleSort('topic')}
                  className="py-3 px-4 min-w-[150px] cursor-pointer bg-brand-50/70 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold border-x border-brand-200/50 dark:border-brand-800/50"
                >
                  <div className="flex items-center gap-1">
                    <span>{selectedTopicName} Solved</span>
                    <ArrowUpDown className="w-3 h-3 text-brand-500" />
                  </div>
                </th>
              )}
              <th className="py-3 px-4 min-w-[190px]">Difficulty Breakdown (E / M / H)</th>
              <th
                onClick={() => handleSort('rating')}
                className="py-3 px-4 min-w-[150px] cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1">
                  <span>Contest Standing</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('streak')}
                className="py-3 px-4 min-w-[140px] cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1">
                  <span>Streak & Active</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('acceptance')}
                className="py-3 px-4 min-w-[130px] cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1">
                  <span>Acceptance</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 min-w-[110px]">Top Language</th>
              <th className="py-3 px-4 min-w-[130px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rankedStudents.length === 0 ? (
              <tr>
                <td colSpan={selectedTopic !== 'all' ? 10 : 9} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-medium">No students match your active filters</p>
                    <p className="text-xs text-slate-500">
                      Try clearing your search query or department selection
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              rankedStudents.map((student, idx) => {
                const rank = idx + 1;
                const p = profiles[student.leetcodeUsername.toLowerCase()];
                const totalSolved = p?.problemStatistics.all || 0;
                const easySolved = p?.problemStatistics.easy || 0;
                const medSolved = p?.problemStatistics.medium || 0;
                const hardSolved = p?.problemStatistics.hard || 0;
                const streak = p?.calendarSummary.streak || 0;
                const activeDays = p?.calendarSummary.totalActiveDays || 0;
                const contestRating = Math.round(p?.contestSummary?.rating || 0);
                const globalRank = p?.contestSummary?.globalRanking;
                const badge = p?.contestBadge?.name;
                const totalSubs = p?.allSubmissionStatistics.all || totalSolved;
                const accRate = p ? calculateAcceptanceRate(totalSolved, totalSubs) : 0;
                const consistency30 = p ? calculateConsistencyRate(p.dailyActivityTimeline, 30) : 0;
                const topLang = p?.languageStatistics?.[0]?.languageName || 'N/A';

                // Percentage relative to cohort leader
                const solvedPct = maxSolved > 0 ? Math.round((totalSolved / maxSolved) * 100) : 0;

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center font-bold">
                      {rank === 1 ? (
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700 shadow-xs">
                          🥇
                        </div>
                      ) : rank === 2 ? (
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border border-slate-300 dark:border-slate-600 shadow-xs">
                          🥈
                        </div>
                      ) : rank === 3 ? (
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800 shadow-xs">
                          🥉
                        </div>
                      ) : (
                        <span className="font-mono text-slate-500 dark:text-slate-400 text-xs">
                          #{rank}
                        </span>
                      )}
                    </td>

                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {p?.profile.userAvatar ? (
                          <img
                            src={p.profile.userAvatar}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {student.displayName.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              to={`/student-analytics?id=${student.id}`}
                              className="font-semibold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 truncate transition-colors"
                            >
                              {student.displayName}
                            </Link>
                            {rank <= 3 && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                Top {rank}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <a
                              href={getLeetCodeProfileUrl(student.leetcodeUsername)}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-slate-500 hover:text-brand-600 inline-flex items-center gap-0.5"
                            >
                              @{student.leetcodeUsername}
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                            {student.department && (
                              <>
                                <span>•</span>
                                <span>{student.department}</span>
                              </>
                            )}
                            {student.studentId && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[10px]">{student.studentId}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Problems Solved */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                            {totalSolved}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            solved
                          </span>
                        </div>
                        <div className="w-28 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div
                            className="bg-brand-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(solvedPct, 4)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Topic Mastery Cell */}
                    {selectedTopic !== 'all' && (
                      <td className="py-3.5 px-4 bg-brand-50/40 dark:bg-brand-950/20 border-x border-brand-200/40 dark:border-brand-800/40">
                        <div>
                          <div className="flex items-baseline gap-1 font-mono font-bold text-brand-600 dark:text-brand-400">
                            <span className="text-base">{getTopicSolved(p, selectedTopic)}</span>
                            <span className="text-[10px] text-slate-400 font-normal">solved</span>
                          </div>
                          <div className="w-24 bg-brand-200/60 dark:bg-brand-900/60 rounded-full h-1 mt-1 overflow-hidden">
                            <div
                              className="bg-brand-600 h-1 rounded-full transition-all duration-300"
                              style={{
                                width: `${maxTopicSolved > 0 ? Math.round((getTopicSolved(p, selectedTopic) / maxTopicSolved) * 100) : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Difficulty Breakdown */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                            E: {easySolved}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-800">
                            M: {medSolved}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-semibold border border-rose-200 dark:border-rose-800">
                            H: {hardSolved}
                          </span>
                        </div>
                        {/* Micro stacked bar */}
                        {totalSolved > 0 && (
                          <div className="flex h-1 w-32 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <div
                              style={{ width: `${(easySolved / totalSolved) * 100}%` }}
                              className="bg-emerald-500"
                              title={`Easy: ${easySolved}`}
                            />
                            <div
                              style={{ width: `${(medSolved / totalSolved) * 100}%` }}
                              className="bg-amber-500"
                              title={`Medium: ${medSolved}`}
                            />
                            <div
                              style={{ width: `${(hardSolved / totalSolved) * 100}%` }}
                              className="bg-rose-500"
                              title={`Hard: ${hardSolved}`}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Contest Standing */}
                    <td className="py-3.5 px-4">
                      {contestRating > 0 ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                              {contestRating}
                            </span>
                            {badge && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                {badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {globalRank ? `Rank #${globalRank.toLocaleString()}` : `${p?.contestSummary?.attendedContestsCount || 0} contests`}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-[11px]">
                          Unrated
                        </div>
                      )}
                    </td>

                    {/* Streak & Consistency */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="flex items-center gap-1 font-mono font-bold text-amber-600 dark:text-amber-400">
                          <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
                          <span>{streak} days</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {activeDays} total active ({consistency30}% 30d)
                        </div>
                      </div>
                    </td>

                    {/* Acceptance */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">
                          {accRate}%
                        </span>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {totalSubs} submissions
                        </div>
                      </div>
                    </td>

                    {/* Top Language */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium text-[11px] border border-slate-200 dark:border-slate-700">
                        <Code2 className="w-3 h-3 text-brand-600" />
                        {topLang}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={`/student-analytics?id=${student.id}`}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition-colors"
                          title="View detailed student analytics"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <a
                          href={getLeetCodeProfileUrl(student.leetcodeUsername)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Open official LeetCode profile"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div>
          Showing <strong className="text-slate-800 dark:text-slate-200">{rankedStudents.length}</strong> of{' '}
          <strong className="text-slate-800 dark:text-slate-200">{students.length}</strong> registered students
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Easy
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Hard
          </span>
        </div>
      </div>
    </div>
  );
};
