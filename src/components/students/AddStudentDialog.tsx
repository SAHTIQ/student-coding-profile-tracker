import React, { useState } from 'react';
import { useStudentData } from '../../context/StudentDataContext';
import { extractLeetCodeUsername } from '../../utils/metricCalculations';
import { X, UserPlus, AlertCircle, HelpCircle, Link as LinkIcon, Check } from 'lucide-react';

interface AddStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (studentId: string) => void;
}

export const AddStudentDialog: React.FC<AddStudentDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createStudent, students } = useStudentData();

  const [usernameInput, setUsernameInput] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [yearOfStudy, setYearOfStudy] = useState('3rd Year');
  const [email, setEmail] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Active Coder']);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const parsedHandle = extractLeetCodeUsername(usernameInput);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const cleanUser = extractLeetCodeUsername(usernameInput).toLowerCase();

    if (!cleanUser) {
      errs.username = 'Please enter a valid LeetCode username or profile link.';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(cleanUser)) {
      errs.username = 'Username can only contain letters, numbers, underscores, and dashes.';
    } else if (students.some((s) => s.leetcodeUsername.toLowerCase() === cleanUser)) {
      errs.username = `A student with LeetCode handle "@${cleanUser}" is already added.`;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please provide a valid email address.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const cleanUser = extractLeetCodeUsername(usernameInput).toLowerCase();

    setIsSubmitting(true);
    try {
      const newStudent = await createStudent({
        leetcodeUsername: cleanUser,
        displayName: displayName.trim() || cleanUser,
        studentId: studentId.trim() || undefined,
        department,
        yearOfStudy,
        email: email.trim() || undefined,
        tags,
        role: 'student',
      });

      setIsSubmitting(false);
      onClose();
      if (onSuccess) onSuccess(newStudent.id);
    } catch (err) {
      setIsSubmitting(false);
      setErrors({
        submit: err instanceof Error ? err.message : 'Failed to register and scrape LeetCode student.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Add Real LeetCode Profile
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect and live scrape public LeetCode statistics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errors.submit && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* LeetCode Username or Profile Link (Required) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              LeetCode Username or Profile URL <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400">
                <LinkIcon className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                required
                autoFocus
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  if (errors.username) setErrors({ ...errors, username: '' });
                }}
                placeholder="e.g. lee215 or https://leetcode.com/u/neal_wu/"
                className={`w-full pl-9 pr-3 py-2 text-xs font-mono rounded-lg border bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none focus:ring-2 ${
                  errors.username
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-brand-500'
                }`}
              />
            </div>

            {/* Extracted Username Indicator */}
            {parsedHandle && !errors.username && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-brand-600 dark:text-brand-400 mt-1">
                <Check className="w-3.5 h-3.5" />
                <span>Detected handle: <strong>@{parsedHandle}</strong></span>
              </div>
            )}

            {errors.username ? (
              <p className="text-xs text-rose-600 mt-1">{errors.username}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Fetches real solved problems, contest ranking, and activity history live from LeetCode.
              </p>
            )}
          </div>

          {/* Student Display Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Student Display Name (Optional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Leave blank to use real name from LeetCode"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Student ID / Roll No */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student ID / Roll No (Optional)
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. CS2024-001"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Year of Study */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Year of Study
              </label>
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Academic Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Artificial Intelligence & DS">Artificial Intelligence & DS</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Electronics & Communication">Electronics & Communication</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Campus Email (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              placeholder="student@campus.edu"
              className={`w-full px-3 py-2 text-xs rounded-lg border bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-brand-500'
              }`}
            />
            {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tags & Cohorts
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag (e.g. Competitive, Python)..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-600 text-slate-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scraping LeetCode...</span>
                </>
              ) : (
                <span>Fetch & Add Real Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
