import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { useStudentData } from '../context/StudentDataContext';
import { useAuth } from '../context/AuthContext';
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
import { LeetCodeSkillsCard } from '../components/students/LeetCodeSkillsCard';
import { BadgeShowcase } from '../components/students/BadgeShowcase';
import { ForecastMetricsCard } from '../components/forecasting/ForecastMetricsCard';
import { ForecastService } from '../services/forecastService';
import { EmptyState } from '../components/common/EmptyState';
import {
  calculateAcceptanceRate,
  calculateLongestStreak,
  generateBehavioralInsights,
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
  UserX,
} from 'lucide-react';

export const StudentAnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
  const { students, profiles, refreshStudentData, refreshingStudentId } = useStudentData();
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [granularity, setGranularity] = useState<TimeGranularity>('daily');
  const [selectedRange, setSelectedRange] = useState('30d');

  // Find student by id or username
  const student = students.find(
    (s) => s.id === id || s.leetcodeUsername.toLowerCase() === id?.toLowerCase()
  );

  if (!student) {
    return (
      <div className="space-y-6">
        <AppHeader onToggleSidebar={toggleSidebar} pageTitle="Student Not Found" />
        <EmptyState
          icon={UserX}
          title="Student Record Not Found"
          description={`No student registered with identifier "${id}". Check the username or student roster.`}
          actionLabel="Return to Overview"
          onAction={() => navigate(isAdmin ? '/admin-overview' : '/my-analytics')}
        />
      </div>
    );
  }

  const profile = profiles[student.leetcodeUsername.toLowerCase()] || null;
  const isRefreshing = refreshingStudentId === student.id;

  // Prepare Activity Trend Data
  const lookback = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : 90;
  const rawTimeline = profile?.dailyActivityTimeline.slice(-lookback) || [];
  const trendData = rawTimeline.map((item) => ({
    period: item.date.substring(5),
    date: item.date,
    submissions: item.submissions,
  }));

  // Derive metrics
  const solved = profile?.problemStatistics;
  const totalSolved = solved?.all || 0;
  const acceptanceRate = calculateAcceptanceRate(
    profile?.allSubmissionStatistics.all || 0,
    (profile?.allSubmissionStatistics.all || 0) * 1.5
  );
  const longestStreak = profile
    ? calculateLongestStreak(profile.dailyActivityTimeline)
    : 0;

  // Generate dynamic behavioral insights
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
          { label: isAdmin ? 'Students' : 'My Account', path: isAdmin ? '/students' : '/my-analytics' },
          { label: student.displayName },
        ]}
        pageTitle={`${student.displayName} — Profile Intelligence`}
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

      {/* Quick Nav Bar for Student context */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 px-4 shadow-card text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-mono">
          <span>Student ID: <strong className="text-slate-800 dark:text-slate-200">{student.studentId || 'N/A'}</strong></span>
          <span>•</span>
          <span>Cohort: <strong className="text-brand-600 dark:text-brand-400">{student.cohort || student.yearOfStudy || 'General'}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/compare?students=${encodeURIComponent(student.leetcodeUsername)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-medium transition-colors"
          >
            <GitCompare className="w-3.5 h-3.5 text-brand-600" />
            <span>Compare in Leaderboard</span>
          </Link>
        </div>
      </div>

      {/* Core Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Problems Solved"
          value={totalSolved}
          subtitle="Accepted solutions"
          icon={Code2}
          iconColor="text-brand-600"
          tooltip="Total unique problems solved on LeetCode across all difficulties."
        />
        <MetricCard
          title="Acceptance Rate"
          value={`${acceptanceRate}%`}
          subtitle="Estimated rate"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          tooltip="Ratio of accepted submissions to total submissions."
        />
        <MetricCard
          title="Total Active Days"
          value={`${profile?.calendarSummary.totalActiveDays || 0}d`}
          subtitle="Coding sessions"
          icon={Calendar}
          iconColor="text-blue-600"
          tooltip="Days with recorded submissions in the profile calendar timeline."
        />
        <MetricCard
          title="Current Streak"
          value={`${profile?.calendarSummary.streak || 0}d`}
          subtitle={`Best: ${longestStreak}d`}
          icon={Flame}
          iconColor="text-amber-500"
          tooltip="Continuous sequence of active daily coding days."
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
          tooltip="Official LeetCode Elo-derived contest rating."
        />
        <MetricCard
          title="Contests Attended"
          value={profile?.contestSummary?.attendedContestsCount || 0}
          subtitle="Weekly / Biweekly"
          icon={Award}
          iconColor="text-purple-600"
          tooltip="Total number of competitive rounds officially participated in."
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

      {/* Pacing Momentum & Trajectory Analytics */}
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

      {/* Coding Activity Heatmap */}
      <ActivityHeatmap
        timeline={profile?.dailyActivityTimeline || []}
        streak={profile?.calendarSummary.streak || 0}
        totalActiveDays={profile?.calendarSummary.totalActiveDays || 0}
        title="Student Activity Heatmap"
      />

      {/* Submission Activity Trends & Problem Difficulty Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityTrendChart
            data={trendData}
            granularity={granularity}
            onGranularityChange={setGranularity}
            title="Submission Activity Frequency"
            subtitle={`Daily and periodic submission volume across selected ${selectedRange}`}
          />
        </div>

        <div>
          {solved ? (
            <DifficultyDistributionChart stats={solved} />
          ) : (
            <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 text-center text-xs text-slate-400">
              Difficulty statistics pending synchronization.
            </div>
          )}
        </div>
      </div>

      {/* Badges Shelf & Language Preferences */}
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

      {/* Recent Accepted Submissions Table */}
      <RecentSubmissionsTable
        submissions={profile?.recentAcceptedSubmissions || []}
      />

      {/* Behavioral Analytics and Insights */}
      <BehavioralInsightsCard
        insights={behavioralInsights}
        title="Coding Behavior Insights & Practice Patterns"
      />
    </div>
  );
};
