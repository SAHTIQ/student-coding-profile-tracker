import cron from 'node-cron';
import { prisma } from '../db/prisma';
import { ScraperService } from './scraper.service';

export class CronService {
  private static isSyncRunning = false;

  /**
   * Initializes nightly scheduled sync at 2:00 AM every day
   */
  static init() {
    // Schedule: Runs at 02:00 AM every night
    cron.schedule('0 2 * * *', async () => {
      console.log('⏰ [Cron] Starting nightly institutional student sync at 02:00 AM...');
      await CronService.syncAllStudents();
    });

    console.log('✅ CronService initialized: Nightly student sync scheduled at 02:00 AM');
  }

  /**
   * Syncs all registered students with polite rate-limiting delay
   */
  static async syncAllStudents(): Promise<{ total: number; succeeded: number; failed: number }> {
    if (CronService.isSyncRunning) {
      console.log('⚠️ [Cron] Institutional sync is already in progress. Skipping duplicate run.');
      return { total: 0, succeeded: 0, failed: 0 };
    }

    CronService.isSyncRunning = true;
    let succeeded = 0;
    let failed = 0;

    try {
      const students = await prisma.studentProfile.findMany({
        select: { id: true, rollNumber: true, leetcodeUsername: true },
      });

      console.log(`🚀 [Cron] Starting batch sync for ${students.length} students...`);

      for (const student of students) {
        try {
          const res = await ScraperService.syncStudentLeetCode(student.id);
          if (res.success) {
            succeeded += 1;
          } else {
            failed += 1;
          }
        } catch (err) {
          failed += 1;
        }

        // Polite delay (1.2s) between requests to protect against LeetCode IP rate-limiting
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      console.log(`🎉 [Cron] Institutional sync complete. Succeeded: ${succeeded}, Failed: ${failed}`);
      return { total: students.length, succeeded, failed };
    } finally {
      CronService.isSyncRunning = false;
    }
  }

  static getStatus() {
    return {
      isSyncRunning: CronService.isSyncRunning,
      schedule: '0 2 * * * (Daily at 02:00 AM IST)',
    };
  }
}
