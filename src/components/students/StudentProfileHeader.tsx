import React from 'react';
import { LeetCodeProfile } from '../../types/leetcode';
import { CollectionStatus } from '../../types/student';
import { CollectionStatusBadge } from '../common/CollectionStatusBadge';
import { formatRelativeTime } from '../../utils/dateUtils';
import { getLeetCodeProfileUrl } from '../../utils/metricCalculations';
import {
  ExternalLink,
  RefreshCw,
  Globe,
  Award,
  Sparkles,
  School,
} from 'lucide-react';

interface StudentProfileHeaderProps {
  profile: LeetCodeProfile | null;
  username: string;
  displayName?: string;
  collectionStatus: CollectionStatus;
  lastFetchedAt: string | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  department?: string;
  yearOfStudy?: string;
}

export const StudentProfileHeader: React.FC<StudentProfileHeaderProps> = ({
  profile,
  username,
  displayName,
  collectionStatus,
  lastFetchedAt,
  isRefreshing = false,
  onRefresh,
  department,
  yearOfStudy,
}) => {
  const p = profile?.profile;
  const leetcodeUrl = getLeetCodeProfileUrl(username);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-card">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left: Avatar & Identity */}
        <div className="flex items-start gap-4">
          <div className="relative">
            {p?.userAvatar ? (
              <img
                src={p.userAvatar}
                alt={username}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold uppercase shadow">
                {username.substring(0, 2)}
              </div>
            )}
            {profile?.contestBadge && (
              <div
                className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow"
                title={`Badge: ${profile.contestBadge.name}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {displayName || p?.realName || username}
              </h1>
              <a
                href={leetcodeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-mono text-slate-500 hover:text-brand-600 transition-colors"
                title="Open public profile on LeetCode"
              >
                <span>@{username}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <CollectionStatusBadge status={collectionStatus} />
            </div>

            {/* University & Academic Info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-2">
              {(department || yearOfStudy) && (
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                  <School className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {[department, yearOfStudy].filter(Boolean).join(' • ')}
                  </span>
                </div>
              )}
              {p?.school && !department && (
                <div className="flex items-center gap-1">
                  <School className="w-3.5 h-3.5 text-slate-400" />
                  <span>{p.school}</span>
                </div>
              )}
              {p?.countryName && (
                <div className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>{p.countryName}</span>
                </div>
              )}
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3 mt-3">
              {p?.githubUrl && (
                <a
                  href={p.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title="GitHub Profile"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              )}
              {p?.linkedinUrl && (
                <a
                  href={p.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-blue-600 transition-colors"
                  title="LinkedIn Profile"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              )}
              {p?.skillTags && p.skillTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.skillTags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Key LeetCode Global Indicators & Refresh Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end md:items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-6 text-right">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Global Ranking
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                {p?.ranking !== null && p?.ranking !== undefined
                  ? `~#${p.ranking.toLocaleString()}`
                  : 'Unavailable'}
              </span>
            </div>

            {p?.reputation !== null && p?.reputation !== undefined && (
              <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Reputation
                </span>
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-white flex items-center gap-1 justify-end">
                  <Award className="w-4 h-4 text-amber-500" />
                  {p.reputation}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1.5">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Syncing...' : 'Sync LeetCode'}</span>
              </button>
            )}
            <span className="text-[11px] text-slate-400">
              Last synced: <strong>{formatRelativeTime(lastFetchedAt)}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
