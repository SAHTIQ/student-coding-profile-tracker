import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useStudentData } from '../context/StudentDataContext';
import { AnalyticsService } from '../services/analyticsService';
import { MetricCard } from '../components/common/MetricCard';
import { AppHeader } from '../components/layout/AppHeader';
import { ActivityTrendChart } from '../components/charts/ActivityTrendChart';
import { ActivityHeatmap } from '../components/charts/ActivityHeatmap';
import { StudentTable } from '../components/students/StudentTable';
import { AddStudentDialog } from '../components/students/AddStudentDialog';
import { BulkAddStudentDialog } from '../components/students/BulkAddStudentDialog';
import { BatchSyncModal } from '../components/students/BatchSyncModal';
import { EditStudentDialog } from '../components/students/EditStudentDialog';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { Student } from '../types/student';
import { TimeGranularity } from '../types/analytics';
import {
  Users,
  CheckCircle2,
  Code2,
  Calendar,
  Award,
  Zap,
  UserPlus,
  Trophy,
  UploadCloud,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

export const AdminOverviewPage: React.FC = () => {
  const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
  const navigate = useNavigate();

  const {
    students,
    profiles,
    refreshStudentData,
    bulkRefreshStudents,
    removeStudent,
    refreshingStudentId,
  } = useStudentData();

  // Filters & State
  const [selectedRange, setSelectedRange] = useState('30d');
  const [granularity, setGranularity] = useState<TimeGranularity>('daily');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [isBatchSyncOpen, setIsBatchSyncOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  // Compute platform KPIs
  const lookbackDays = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : 90;
  const kpis = AnalyticsService.getCohortKPIs(students, lookbackDays);
  const activityData = AnalyticsService.getCohortActivityTimeline(students, granularity, lookbackDays);
  const topProgress = AnalyticsService.getTopStudentsProblemProgress(students, 6);
  const contestDist = AnalyticsService.getContestRatingDistribution(students);

  // Cohort combined activity timeline for heatmap
  const cohortTimeline = activityData.map((d) => ({
    date: d.date,
    submissions: d.submissions,
  }));

  const handleDeleteConfirm = () => {
    if (deletingStudentId) {
      removeStudent(deletingStudentId);
      setDeletingStudentId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <AppHeader
        onToggleSidebar={toggleSidebar}
        breadcrumbs={[{ label: 'Admin Dashboard', path: '/admin-overview' }]}
        pageTitle="Platform Overview & Cohort Intelligence"
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
      />

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-card">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Engineering Cohort Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking across registered student LeetCode profiles
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsBulkAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg shadow-sm transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5 text-brand-600" />
            <span>Bulk / CSV Import</span>
          </button>

          <button
            onClick={() => setIsBatchSyncOpen(true)}
            disabled={students.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sync All Profiles</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Single Profile</span>
          </button>
        </div>
      </div>

      {/* Empty State Banner when 0 students */}
      {students.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center shadow-card">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Roster is Clean & Ready for Real Profiles
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            All fake demo accounts and mock data have been cleared. Add real students by username, profile link, or import a batch via CSV / paste.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Single LeetCode Profile</span>
            </button>
            <button
              onClick={() => setIsBulkAddOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-brand-600" />
              <span>Bulk / CSV Import</span>
            </button>
          </div>
        </div>
      )}

      {/* 6 Core KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Students"
          value={kpis.totalStudents}
          subtitle="Registered in platform"
          delta={kpis.totalStudentsDelta}
          icon={Users}
          iconColor="text-brand-600"
          tooltip="Total number of students tracked in the current demo roster."
        />
        <MetricCard
          title="Profiles Active"
          value={kpis.profilesCollected}
          subtitle="Successfully synced"
          delta={kpis.profilesCollectedDelta}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          tooltip="Profiles with verified public LeetCode statistics collected."
        />
        <MetricCard
          title="Avg Problems Solved"
          value={kpis.averageProblemsSolved.toLocaleString()}
          subtitle={`Per student (Total: ${kpis.totalProblemsSolved.toLocaleString()})`}
          delta={kpis.avgProblemsDelta}
          icon={Code2}
          iconColor="text-indigo-600"
          tooltip="Average problems solved per verified student. Total cohort solutions indicated in subtitle."
        />
        <MetricCard
          title="Avg Active Days"
          value={`${kpis.averageActiveDays}d`}
          subtitle={`Per student (Total: ${kpis.totalActiveDays.toLocaleString()}d)`}
          delta={kpis.avgActiveDaysDelta}
          icon={Calendar}
          iconColor="text-amber-600"
          tooltip="Average active coding days per student. Cumulative cohort active days indicated in subtitle."
        />
        <MetricCard
          title="Total Solved"
          value={kpis.totalProblemsSolved.toLocaleString()}
          subtitle="Cumulative accepted"
          delta={kpis.problemsSolvedDelta}
          icon={Award}
          iconColor="text-purple-600"
          tooltip="Total aggregate problems solved across all verified students in the cohort."
        />
        <MetricCard
          title="Period Active"
          value={kpis.activeStudentsInPeriod}
          subtitle={`Active in last ${selectedRange}`}
          delta={kpis.activeStudentsDelta}
          icon={Zap}
          iconColor="text-emerald-500"
          tooltip="Students with at least one recorded submission within selected timeframe."
        />
      </div>

      {/* Main Charts: Activity Overview & Stacked Problem Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityTrendChart
            data={activityData}
            granularity={granularity}
            onGranularityChange={setGranularity}
            title="Cohort Coding Activity Overview"
            subtitle={`Aggregated submission frequency across ${kpis.profilesCollected} active students`}
          />
        </div>

        {/* Stacked Bar Chart: Top Students Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Problem-Solving Progression
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Difficulty distribution of top problem solvers
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProgress} layout="vertical" margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.6} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px', paddingBottom: '6px' }} />
                  <Bar dataKey="easy" name="Easy" stackId="a" fill="#10B981" />
                  <Bar dataKey="medium" name="Medium" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="hard" name="Hard" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            * Top 6 students ranked by cumulative solved problem count
          </div>
        </div>
      </div>

      {/* Cohort Heatmap & Contest Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityHeatmap
            timeline={cohortTimeline}
            totalActiveDays={kpis.totalActiveDays}
            title="Cohort Cumulative Activity Heatmap"
          />
        </div>

        {/* Contest Performance Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                Contest Standing Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution across competitive rating brackets
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {contestDist.map((item) => {
              const pct =
                kpis.profilesCollected > 0
                  ? Math.round((item.count / kpis.profilesCollected) * 100)
                  : 0;

              return (
                <div key={item.bracket} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {item.bracket}
                    </span>
                    <span className="font-mono text-slate-500">
                      <strong>{item.count}</strong> ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${pct}%`,
                        backgroundColor: item.color,
                      }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
            Ratings derived from official LeetCode Weekly and Biweekly contests.
          </p>
        </div>
      </div>

      {/* Student Leaderboard & Management Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Student Leaderboard & Cohort Directory
            </h3>
            <p className="text-xs text-slate-500">
              Sort by problems solved, streak, active days, or contest rating
            </p>
          </div>
        </div>

        <StudentTable
          students={students}
          profiles={profiles}
          isAdmin={true}
          onRefreshStudent={refreshStudentData}
          onBulkRefresh={bulkRefreshStudents}
          onEditStudent={setEditingStudent}
          onDeleteStudent={(id) => setDeletingStudentId(id)}
          refreshingStudentId={refreshingStudentId}
        />
      </div>

      {/* Add Student Dialog */}
      <AddStudentDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(newId) => {
          navigate(`/students/${newId}`);
        }}
      />

      {/* Bulk / CSV Import Dialog */}
      <BulkAddStudentDialog
        isOpen={isBulkAddOpen}
        onClose={() => setIsBulkAddOpen(false)}
      />

      {/* Batch Sync Modal */}
      <BatchSyncModal
        isOpen={isBatchSyncOpen}
        onClose={() => setIsBatchSyncOpen(false)}
      />

      {/* Edit Student Dialog */}
      <EditStudentDialog
        isOpen={!!editingStudent}
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingStudentId}
        title="Remove Student Profile"
        message="Are you sure you want to remove this student from the cohort? Historical analytics for this profile will be unlinked from the overview."
        confirmLabel="Remove Profile"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingStudentId(null)}
      />
    </div>
  );
};
