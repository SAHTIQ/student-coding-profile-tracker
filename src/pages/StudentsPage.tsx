import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useStudentData } from '../context/StudentDataContext';
import { AppHeader } from '../components/layout/AppHeader';
import { StudentTable } from '../components/students/StudentTable';
import { AddStudentDialog } from '../components/students/AddStudentDialog';
import { BulkAddStudentDialog } from '../components/students/BulkAddStudentDialog';
import { BatchSyncModal } from '../components/students/BatchSyncModal';
import { EditStudentDialog } from '../components/students/EditStudentDialog';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { Student } from '../types/student';
import { UserPlus, RefreshCw, Users, ShieldAlert, CheckCircle2, UploadCloud } from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
  const {
    students,
    profiles,
    refreshStudentData,
    bulkRefreshStudents,
    removeStudent,
    refreshingStudentId,
    isLoading,
  } = useStudentData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [isBatchSyncOpen, setIsBatchSyncOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  const activeProfilesCount = students.filter((s) => s.collectionStatus === 'success').length;
  const issuesCount = students.filter((s) => ['not_found', 'rate_limited', 'failed'].includes(s.collectionStatus)).length;

  const handleBulkRefreshAll = () => {
    const allIds = students.map((s) => s.id);
    bulkRefreshStudents(allIds);
  };

  const handleDeleteConfirm = () => {
    if (deletingStudentId) {
      removeStudent(deletingStudentId);
      setDeletingStudentId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AppHeader
        onToggleSidebar={toggleSidebar}
        breadcrumbs={[
          { label: 'Admin', path: '/admin-overview' },
          { label: 'Students' },
        ]}
        pageTitle="Student Profile Management"
      />

      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Registered Roster
            </span>
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {students.length}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Active LeetCode Profiles
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {activeProfilesCount}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Collection Flags / Issues
            </span>
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {issuesCount}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-card">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Cohort Student Records
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage academic tags, roll numbers, and simulated LeetCode synchronization
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
            disabled={isLoading || students.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync All (Live Scraper)</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Single Student</span>
          </button>
        </div>
      </div>

      {/* Main Student Directory Table */}
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

      {/* Modals */}
      <AddStudentDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <BulkAddStudentDialog
        isOpen={isBulkAddOpen}
        onClose={() => setIsBulkAddOpen(false)}
      />

      <BatchSyncModal
        isOpen={isBatchSyncOpen}
        onClose={() => setIsBatchSyncOpen(false)}
      />

      <EditStudentDialog
        isOpen={!!editingStudent}
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
      />

      <ConfirmationDialog
        isOpen={!!deletingStudentId}
        title="Remove Student Record"
        message="Are you sure you want to permanently remove this student record from the demo workspace? This action will unlink their LeetCode statistics from cohort analytics."
        confirmLabel="Confirm Deletion"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingStudentId(null)}
      />
    </div>
  );
};
