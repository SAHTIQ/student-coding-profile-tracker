import React, { useState, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStudentData } from '../context/StudentDataContext';
import { AppHeader } from '../components/layout/AppHeader';
import { StudentProfileHeader } from '../components/students/StudentProfileHeader';
import { MetricCard } from '../components/common/MetricCard';
import { ActivityHeatmap } from '../components/charts/ActivityHeatmap';
import { ActivityTrendChart } from '../components/charts/ActivityTrendChart';
import { DifficultyDistributionChart } from '../components/charts/DifficultyDistributionChart';
import { LanguageDistributionChart } from '../components/charts/LanguageDistributionChart';
import { ContestRatingChart } from '../components/charts/ContestRatingChart';
import { RecentSubmissionsTable } from '../components/students/RecentSubmissionsTable';
import { BehavioralInsightsCard } from '../components/students/BehavioralInsightsCard';
import { PeriodicActivityTracker } from '../components/analytics/PeriodicActivityTracker';
import { StudentGoalWidget } from '../components/analytics/StudentGoalWidget';
import { LeetCodeSkillsCard } from '../components/students/LeetCodeSkillsCard';
import { BadgeShowcase } from '../components/students/BadgeShowcase';
import { ForecastMetricsCard } from '../components/forecasting/ForecastMetricsCard';
import { ForecastService } from '../services/forecastService';
import {
  calculateAcceptanceRate,
  calculateLongestStreak,
  generateBehavioralInsights,
  extractLeetCodeUsername,
} from '../utils/metricCalculations';
import { TimeGranularity } from '../types/analytics';
import {
  Code2,
  CheckCircle2,
  Calendar,
  Flame,
  Award,
  Trophy,
  GitCompare,
  TrendingUp,
  UserPlus,
} from 'lucide-react';

export const MyAnalyticsPage: React.FC = () => {
  const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
  const { user, loginAsStudent } = useAuth();
  const {
    students,
    profiles,
    refreshStudentData,
    refreshingStudentId,
    createStudent,
    editStudent,
  } = useStudentData();

  const [granularity, setGranularity] = useState<TimeGranularity>('daily');
  const [selectedRange, setSelectedRange] = useState('30d');
  const [linkInput, setLinkInput] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState('');

  // Match active logged in student
  const student =
    students.find((s) => s.leetcodeUsername.toLowerCase() === user?.username.toLowerCase()) ||
    students[0];

  const handleLinkAccount = async () => {
    const cleanUser = extractLeetCodeUsername(linkInput);
    if (!cleanUser) {
      setLinkError('Please enter a valid LeetCode username or profile URL.');
      return;
    }

    setIsLinking(true);
    setLinkError('');
    try {
      const newStudent = await createStudent({
        leetcodeUsername: cleanUser,
        displayName: cleanUser,
        role: 'student',
      });
      loginAsStudent(newStudent.id, newStudent.leetcodeUsername, newStudent.displayName);
      setIsLinking(false);
    } catch (err: any) {
      setLinkError(err.message || 'Failed to connect LeetCode profile.');
      setIsLinking(false);
    }
  };

  const handleUpdateGoal = (newGoal: number) => {
    if (student) {
      editStudent(student.id, { targetWeeklyGoal: newGoal });
    }
  };

  if (!student) {
    return (
      <div className="space-y-6">
        <AppHeader
          onToggleSidebar={toggleSidebar}
          breadcrumbs={[{ label: 'Student Workspace' }, { label: 'My Analytics' }]}
          pageTitle="My LeetCode Productivity Analytics"
        />
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-10 text-center shadow-card max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Connect Your LeetCode Profile
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
            No profile is linked yet. Enter your real LeetCode username or paste your profile link to scrape your live statistics.
          </p>
          <div className="max-w-sm mx-auto mt-5 flex gap-2">
            <input
              type="text"
              value={linkInput}
              onChange={(e) => {
                setLinkInput(e.target.value);
                setLinkError('');
              }}
              placeholder="e.g. lee215 or https://leetcode.com/u/neal_wu/"
              className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={handleLinkAccount}
              disabled={isLinking}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {isLinking ? 'Scraping...' : 'Link'}
            </button>
          </div>
          {linkError && <p className="text-xs text-rose-600 mt-2">{linkError}</p>}
        </div>
      </div>
    );
  }

  const profile = profiles[student.leetcodeUsername.toLowerCase()] || null;
  const isRefreshing = refreshingStudentId === student.id;

  const lookback = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : 90;
  const rawTimeline = profile?.dailyActivityTimeline.slice(-lookback) || [];
  const trendData = rawTimeline.map((item) => ({
    period: item.date.substring(5),
    date: item.date,
    submissions: item.submissions,
  }));

  const solved = profile?.problemStatistics;
  const totalSolved = solved?.all || 0;
  const acceptanceRate = calculateAcceptanceRate(
    profile?.allSubmissionStatistics.all || 0,
    (profile?.allSubmissionStatistics.all || 0) * 1.5
  );
  const longestStreak = profile
    ? calculateLongestStreak(profile.dailyActivityTimeline)
    : 0;

  const behavioralInsights = profile ? generateBehavioralInsights(profile) : [];

  // Pacing & trajectory forecast model
  const forecastSummary = useMemo(() => {
    if (!profile) return null;
    return ForecastService.generateStudentForecast(
      student.id,
      student.leetcodeUsername,
      profile.dailyActivityTimeline,
      14
    );
  }, [student, profile]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <AppHeader
        onToggleSidebar={toggleSidebar}
        breadcrumbs={[
          { label: 'Student Workspace' },
          { label: 'My Analytics' },
        ]}
        pageTitle="My LeetCode Productivity Analytics"
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
      />

      {/* Profile Header Block */}
      <StudentProfileHeader
        profile={profile}
        username={student.leetcodeUsername}
        displayName={student.displayName}
        collectionStatus={student.collectionStatus}
        lastFetchedAt={student.lastFetchedAt}
        isRefreshing={isRefreshing}
        onRefresh={() => refreshStudentData(student.id)}
        department={student.department}
        yearOfStudy={student.yearOfStudy}
      />

      {/* Quick Peer Comparison / Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 px-4 shadow-card text-xs">
        <span className="text-slate-500 font-mono">
          Roll No: <strong className="text-slate-800 dark:text-slate-200">{student.studentId || 'N/A'}</strong> • {student.department || 'Computer Science'} • Cohort: <strong className="text-brand-600 dark:text-brand-400">{student.cohort || 'General'}</strong>
        </span>

        <div className="flex items-center gap-2">
          <Link
            to={`/compare?students=${encodeURIComponent(student.leetcodeUsername)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-medium transition-colors"
          >
            <GitCompare className="w-3.5 h-3.5 text-brand-600" />
            <span>Class Leaderboard & Compare</span>
          </Link>
        </div>
      </div>

      {/* Weekly Goal Progress Widget */}
      <StudentGoalWidget
        timeline={profile?.dailyActivityTimeline || []}
        targetGoal={student.targetWeeklyGoal || 10}
        onUpdateGoal={handleUpdateGoal}
      />

      {/* 6 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total Solved"
          value={totalSolved}
          subtitle="All difficulties"
          icon={Code2}
          iconColor="text-brand-600"
        />
        <MetricCard
          title="Acceptance Rate"
          value={`${acceptanceRate}%`}
          subtitle="Estimated"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
        />
        <MetricCard
          title="Active Days"
          value={`${profile?.calendarSummary.totalActiveDays || 0}d`}
          subtitle="Practice sessions"
          icon={Calendar}
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Current Streak"
          value={`${profile?.calendarSummary.streak || 0}d`}
          subtitle={`Best: ${longestStreak}d`}
          icon={Flame}
          iconColor="text-amber-500"
        />
        <MetricCard
          title="Contest Rating"
          value={
            profile?.contestSummary?.rating
              ? Math.round(profile.contestSummary.rating)
              : 'Unrated'
          }
          subtitle={
            profile?.contestSummary?.topPercentage
              ? `Top ${profile.contestSummary.topPercentage.toFixed(1)}%`
              : '0 Contests'
          }
          icon={Trophy}
          iconColor="text-amber-600"
        />
        <MetricCard
          title="Contests"
          value={profile?.contestSummary?.attendedContestsCount || 0}
          subtitle="Rounds joined"
          icon={Award}
          iconColor="text-purple-600"
        />
      </div>

      {/* Daily, Weekly, and Monthly Coding Activity Tracker with Solved Problems Log */}
      <PeriodicActivityTracker
        profile={profile}
      />

      {/* LeetCode Profile Skills (Fundamental, Intermediate, Advanced) */}
      <LeetCodeSkillsCard
        skills={profile?.tagProblemCounts}
      />

      {/* Pacing Momentum & Trajectory (Forecast Integration) */}
      {forecastSummary && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Practice Momentum & Trajectory Analytics
            </h3>
          </div>
          <ForecastMetricsCard summary={forecastSummary} />
        </div>
      )}

      {/* Heatmap */}
      <ActivityHeatmap
        timeline={profile?.dailyActivityTimeline || []}
        streak={profile?.calendarSummary.streak || 0}
        totalActiveDays={profile?.calendarSummary.totalActiveDays || 0}
        title="Personal Coding Activity Calendar"
      />

      {/* Trend & Difficulty */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityTrendChart
            data={trendData}
            granularity={granularity}
            onGranularityChange={setGranularity}
            title="My Submission Activity Frequency"
            subtitle={`Daily and periodic submission volume across ${selectedRange}`}
          />
        </div>

        <div>
          {solved && <DifficultyDistributionChart stats={solved} />}
        </div>
      </div>

      {/* Badges Shelf & Language Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BadgeShowcase
          badges={profile?.badges || []}
          contestBadge={profile?.contestBadge}
        />
        <LanguageDistributionChart
          languages={profile?.languageStatistics || []}
        />
      </div>

      {/* Contest History Chart */}
      <ContestRatingChart
        summary={profile?.contestSummary || null}
        history={profile?.contestHistory || []}
      />

      {/* Recent Accepted Submissions */}
      <RecentSubmissionsTable
        submissions={profile?.recentAcceptedSubmissions || []}
      />

      {/* Behavioral Insights & Diagnostics */}
      <BehavioralInsightsCard insights={behavioralInsights} />
    </div>
  );
};
