export interface UserProfileInfo {
  ranking: number | null;
  userAvatar: string | null;
  realName: string | null;
  aboutMe: string | null;
  school: string | null;
  countryName: string | null;
  skillTags: string[];
  reputation: number | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
}

export interface ProblemStatsByDifficulty {
  all: number;
  easy: number;
  medium: number;
  hard: number;
}

export interface LanguageStat {
  languageName: string;
  problemsSolved: number;
}

export interface LeetCodeBadge {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  creationDate?: string;
}

export interface ContestBadge {
  name: string;
  icon: string;
}

export interface UserCalendarSummary {
  activeYears: number[];
  streak: number;
  totalActiveDays: number;
  submissionCalendar: Record<string, number>; // epoch seconds -> count
}

export interface DailyActivityRecord {
  date: string; // 'YYYY-MM-DD'
  submissions: number;
}

export interface ContestSummary {
  attendedContestsCount: number;
  rating: number | null;
  globalRanking: number | null;
  totalParticipants: number | null;
  topPercentage: number | null;
}

export interface ContestHistoryRecord {
  contestTitle: string;
  contestStartTime: number; // epoch seconds
  attended: boolean;
  trendDirection: 'UP' | 'DOWN' | 'NONE';
  problemsSolved: number;
  totalProblems: number;
  rating: number;
  ranking: number;
}

export interface RecentAcceptedSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: number; // epoch seconds
}

export interface TagProblemCount {
  tagName: string;
  tagSlug: string;
  problemsSolved: number;
}

export interface TagProblemCountsSummary {
  advanced: TagProblemCount[];
  intermediate: TagProblemCount[];
  fundamental: TagProblemCount[];
}

export interface SolvedProblemRecord {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: number; // epoch seconds
  dateISO: string; // YYYY-MM-DD
}

export interface LeetCodeProfile {
  username: string;
  profile: UserProfileInfo;
  contestBadge: ContestBadge | null;
  problemStatistics: ProblemStatsByDifficulty;
  allSubmissionStatistics: ProblemStatsByDifficulty;
  languageStatistics: LanguageStat[];
  badges: LeetCodeBadge[];
  calendarSummary: UserCalendarSummary;
  heatmapByYear: Record<number, Record<string, number>>; // Year -> YYYY-MM-DD -> count
  dailyActivityTimeline: DailyActivityRecord[]; // chronological records
  contestSummary: ContestSummary | null;
  contestHistory: ContestHistoryRecord[];
  recentAcceptedSubmissions: RecentAcceptedSubmission[];
  tagProblemCounts?: TagProblemCountsSummary;
  solvedProblemsLog?: SolvedProblemRecord[];
  fetchedAtUtc: string;
}
