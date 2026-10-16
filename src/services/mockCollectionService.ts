import { LeetCodeProfile } from '../types/leetcode';
import { MockStudentService } from './mockStudentService';
import { CollectionStatus } from '../types/student';
import { extractLeetCodeUsername } from '../utils/metricCalculations';
import { ActivityTrackingService } from './activityTrackingService';

const PROFILES_STORAGE_KEY = 'codepulse_leetcode_profiles_live';

export class MockCollectionService {
  static getStoredProfiles(): Record<string, LeetCodeProfile> {
    try {
      const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return {};
  }

  static saveProfiles(profiles: Record<string, LeetCodeProfile>): void {
    try {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    } catch {
      // Storage error
    }
  }

  static getProfileByUsername(usernameOrUrl: string): LeetCodeProfile | null {
    const clean = extractLeetCodeUsername(usernameOrUrl).toLowerCase();
    const profiles = this.getStoredProfiles();
    return profiles[clean] || null;
  }

  /**
   * Scrapes REAL live profile data directly from LeetCode's public GraphQL API
   */
  static async simulateCollect(
    studentId: string,
    usernameOrUrl: string,
    displayName?: string
  ): Promise<{ status: CollectionStatus; errorMessage?: string; profile?: LeetCodeProfile }> {
    const cleanUsername = extractLeetCodeUsername(usernameOrUrl).toLowerCase();

    // 1. Set to 'fetching'
    MockStudentService.updateCollectionStatus(studentId, 'fetching');

    try {
      const res = await fetch(`/api/scrape?username=${encodeURIComponent(cleanUsername)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error || `HTTP ${res.status}: Failed to scrape LeetCode profile.`;
        const status: CollectionStatus = res.status === 404 ? 'not_found' : 'failed';
        MockStudentService.updateCollectionStatus(studentId, status, errorMsg);
        return { status, errorMessage: errorMsg };
      }

      const profile: LeetCodeProfile = data.profile;

      // Update student's displayName with their real name from LeetCode if not specified
      if (profile.profile.realName && (!displayName || displayName === cleanUsername)) {
        MockStudentService.updateStudent(studentId, {
          displayName: profile.profile.realName,
        });
      }

      // Save real profile and preserve historical problem solving log
      const profiles = this.getStoredProfiles();
      const existingProfile = profiles[cleanUsername];

      profile.solvedProblemsLog = ActivityTrackingService.mergeSolvedProblemsLog(
        existingProfile?.solvedProblemsLog || [],
        profile.recentAcceptedSubmissions || []
      );

      profiles[cleanUsername] = profile;
      this.saveProfiles(profiles);

      MockStudentService.updateCollectionStatus(studentId, 'success');
      return { status: 'success', profile };
    } catch (err: any) {
      const errorMsg = err.message || 'Network error communicating with LeetCode.';
      MockStudentService.updateCollectionStatus(studentId, 'failed', errorMsg);
      return { status: 'failed', errorMessage: errorMsg };
    }
  }

  /**
   * Bulk refresh real data across multiple students
   */
  static async simulateBulkCollect(
    studentIds: string[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<void> {
    const students = MockStudentService.getStudents();
    let count = 0;
    for (const sid of studentIds) {
      const student = students.find((s) => s.id === sid);
      if (student) {
        await this.simulateCollect(student.id, student.leetcodeUsername, student.displayName);
      }
      count++;
      if (onProgress) onProgress(count, studentIds.length);
    }
  }
}
