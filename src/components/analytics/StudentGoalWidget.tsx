import React, { useState } from 'react';
import { DailyActivityRecord } from '../../types/leetcode';
import { ActivityTrackingService } from '../../services/activityTrackingService';
import { Target, CheckCircle2, Flame, Edit2, Sparkles, TrendingUp } from 'lucide-react';

interface StudentGoalWidgetProps {
  timeline: DailyActivityRecord[];
  targetGoal?: number;
  onUpdateGoal?: (newGoal: number) => void;
}

export const StudentGoalWidget: React.FC<StudentGoalWidgetProps> = ({
  timeline,
  targetGoal = 10,
  onUpdateGoal,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [goalInput, setGoalInput] = useState(targetGoal);

  const goalStatus = ActivityTrackingService.getWeeklyGoalStatus(targetGoal, timeline);

  const handleSave = () => {
    if (goalInput > 0 && onUpdateGoal) {
      onUpdateGoal(goalInput);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Weekly Practice Goal
            </h3>
            <p className="text-[11px] text-slate-500">
              Monday through Sunday problem-solving pacing target
            </p>
          </div>
        </div>

        <div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 dark:bg-brand-950/40 px-2.5 py-1 rounded-md transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              <span>Set Goal</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={100}
                value={goalInput}
                onChange={(e) => setGoalInput(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 px-2 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold"
              />
              <button
                onClick={handleSave}
                className="px-2 py-0.5 text-[11px] bg-brand-600 text-white rounded font-bold"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Metric */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-xs font-mono">
          <div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {goalStatus.currentCount}
            </span>
            <span className="text-slate-400 font-normal"> / {goalStatus.targetGoal} problems</span>
          </div>
          <span
            className={`font-bold ${
              goalStatus.isAchieved
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-brand-600 dark:text-brand-400'
            }`}
          >
            {goalStatus.percentage}% achieved
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              goalStatus.isAchieved
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-brand-600 to-indigo-500'
            }`}
            style={{ width: `${goalStatus.percentage}%` }}
          />
        </div>
      </div>

      {/* Status banner */}
      <div
        className={`p-2.5 rounded-lg text-xs flex items-center justify-between ${
          goalStatus.isAchieved
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
            : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800'
        }`}
      >
        <span className="flex items-center gap-1.5">
          {goalStatus.isAchieved ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">Weekly Target Achieved! Fantastic consistency.</span>
            </>
          ) : (
            <>
              <Flame className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>{goalStatus.remaining} more problem{goalStatus.remaining === 1 ? '' : 's'}</strong> to reach this week's target.
              </span>
            </>
          )}
        </span>
      </div>
    </div>
  );
};
