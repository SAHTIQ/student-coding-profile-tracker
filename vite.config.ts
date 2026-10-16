import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function leetcodeScraperPlugin(): Plugin {
  return {
    name: 'leetcode-live-scraper',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/scrape')) {
          return next();
        }

        const urlObj = new URL(req.url, 'http://localhost:5173');
        const rawUsername = urlObj.searchParams.get('username') || '';
        const cleanUsername = rawUsername
          .replace(/^https?:\/\//i, '')
          .replace(/^www\./i, '')
          .replace(/^leetcode\.com\//i, '')
          .replace(/^u\//i, '')
          .replace(/^@/, '')
          .split('?')[0]
          .split('#')[0]
          .replace(/\/+$/, '')
          .trim();

        if (!cleanUsername) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Username or profile link is required.' }));
          return;
        }

        const query = `
          query getUserFullProfile($username: String!) {
            matchedUser(username: $username) {
              username
              githubUrl
              twitterUrl
              linkedinUrl
              profile {
                ranking
                userAvatar
                realName
                aboutMe
                school
                countryName
                skillTags
                reputation
              }
              submitStats {
                acSubmissionNum {
                  difficulty
                  count
                  submissions
                }
                totalSubmissionNum {
                  difficulty
                  count
                  submissions
                }
              }
              languageProblemCount {
                languageName
                problemsSolved
              }
              badges {
                id
                name
                displayName
                icon
                creationDate
              }
              userCalendar {
                activeYears
                streak
                totalActiveDays
                submissionCalendar
              }
              tagProblemCounts {
                advanced {
                  tagName
                  tagSlug
                  problemsSolved
                }
                intermediate {
                  tagName
                  tagSlug
                  problemsSolved
                }
                fundamental {
                  tagName
                  tagSlug
                  problemsSolved
                }
              }
            }
            userContestRanking(username: $username) {
              attendedContestsCount
              rating
              globalRanking
              totalParticipants
              topPercentage
              badge {
                name
                icon
              }
            }
            userContestRankingHistory(username: $username) {
              attended
              trendDirection
              problemsSolved
              totalProblems
              rating
              ranking
              contest {
                title
                startTime
              }
            }
            recentAcSubmissionList(username: $username, limit: 20) {
              id
              title
              titleSlug
              timestamp
            }
          }
        `;

        try {
          const apiRes = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Referer: `https://leetcode.com/${cleanUsername}/`,
              Origin: 'https://leetcode.com',
            },
            body: JSON.stringify({
              query,
              variables: { username: cleanUsername },
            }),
          });

          if (!apiRes.ok) {
            res.statusCode = apiRes.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: `LeetCode API responded with status ${apiRes.status}: ${apiRes.statusText}`,
              })
            );
            return;
          }

          const rawData = await apiRes.json();
          const matched = rawData?.data?.matchedUser;

          if (!matched) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: `LeetCode user profile "${cleanUsername}" was not found. Please verify the username or URL.`,
              })
            );
            return;
          }

          // Parse Difficulty Counts
          const acList = matched.submitStats?.acSubmissionNum || [];
          const totalList = matched.submitStats?.totalSubmissionNum || [];

          const getCount = (list: any[], diff: string) => {
            const found = list.find(
              (item: any) => item.difficulty?.toLowerCase() === diff.toLowerCase()
            );
            return found ? found.count : 0;
          };

          const getSubs = (list: any[], diff: string) => {
            const found = list.find(
              (item: any) => item.difficulty?.toLowerCase() === diff.toLowerCase()
            );
            return found ? (found.submissions ?? found.count) : 0;
          };

          const problemStatistics = {
            all: getCount(acList, 'All'),
            easy: getCount(acList, 'Easy'),
            medium: getCount(acList, 'Medium'),
            hard: getCount(acList, 'Hard'),
          };

          const allSubmissionStatistics = {
            all: getSubs(totalList, 'All') || problemStatistics.all,
            easy: getSubs(totalList, 'Easy') || problemStatistics.easy,
            medium: getSubs(totalList, 'Medium') || problemStatistics.medium,
            hard: getSubs(totalList, 'Hard') || problemStatistics.hard,
          };

          // Parse Calendar & Daily Activity
          let subCalendarMap: Record<string, number> = {};
          try {
            subCalendarMap = JSON.parse(
              matched.userCalendar?.submissionCalendar || '{}'
            );
          } catch {
            subCalendarMap = {};
          }

          // Build chronological daily timeline from calendar entries
          const dailyMap = new Map<string, number>();
          const heatmapByYear: Record<number, Record<string, number>> = {};

          // First populate with all entries from submissionCalendar
          Object.entries(subCalendarMap).forEach(([epochSec, count]) => {
            const dateObj = new Date(parseInt(epochSec, 10) * 1000);
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const iso = `${yyyy}-${mm}-${dd}`;

            dailyMap.set(iso, (dailyMap.get(iso) || 0) + Number(count));

            if (!heatmapByYear[yyyy]) heatmapByYear[yyyy] = {};
            heatmapByYear[yyyy][iso] = (heatmapByYear[yyyy][iso] || 0) + Number(count);
          });

          // Also ensure the last 90 continuous days are represented in daily timeline (with 0s if inactive)
          // so time-series charts and forecasts have consecutive dates
          const today = new Date();
          for (let i = 120; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const iso = `${yyyy}-${mm}-${dd}`;
            if (!dailyMap.has(iso)) {
              dailyMap.set(iso, 0);
            }
          }

          const dailyActivityTimeline = Array.from(dailyMap.entries())
            .map(([date, submissions]) => ({ date, submissions }))
            .sort((a, b) => a.date.localeCompare(b.date));

          // Parse Contest Summary
          const contestData = rawData.data?.userContestRanking;
          const contestSummary = contestData
            ? {
                attendedContestsCount: contestData.attendedContestsCount || 0,
                rating: contestData.rating || null,
                globalRanking: contestData.globalRanking || null,
                totalParticipants: contestData.totalParticipants || null,
                topPercentage: contestData.topPercentage || null,
              }
            : null;

          // Parse Contest History
          const rawHistory = rawData.data?.userContestRankingHistory || [];
          const contestHistory = rawHistory
            .filter((item: any) => item.attended)
            .map((item: any) => ({
              contestTitle: item.contest?.title || 'Contest',
              contestStartTime: item.contest?.startTime || 0,
              attended: true,
              trendDirection: item.trendDirection || 'NONE',
              problemsSolved: item.problemsSolved || 0,
              totalProblems: item.totalProblems || 4,
              rating: item.rating || 0,
              ranking: item.ranking || 0,
            }));

          // Parse Recent Submissions
          const rawRecent = rawData.data?.recentAcSubmissionList || [];
          const recentAcceptedSubmissions = rawRecent.map((item: any) => ({
            id: String(item.id || item.timestamp),
            title: item.title,
            titleSlug: item.titleSlug,
            timestamp: parseInt(item.timestamp, 10),
          }));

          const profileData = {
            username: matched.username,
            profile: {
              ranking: matched.profile?.ranking ?? null,
              userAvatar: matched.profile?.userAvatar ?? null,
              realName: matched.profile?.realName ?? null,
              aboutMe: matched.profile?.aboutMe ?? null,
              school: matched.profile?.school ?? null,
              countryName: matched.profile?.countryName ?? null,
              skillTags: matched.profile?.skillTags || [],
              reputation: matched.profile?.reputation ?? null,
              githubUrl: matched.githubUrl ?? null,
              twitterUrl: matched.twitterUrl ?? null,
              linkedinUrl: matched.linkedinUrl ?? null,
            },
            contestBadge: contestData?.badge
              ? { name: contestData.badge.name, icon: contestData.badge.icon || '' }
              : null,
            problemStatistics,
            allSubmissionStatistics,
            languageStatistics: matched.languageProblemCount || [],
            badges: matched.badges || [],
            calendarSummary: {
              activeYears: matched.userCalendar?.activeYears || [],
              streak: matched.userCalendar?.streak || 0,
              totalActiveDays:
                matched.userCalendar?.totalActiveDays || Object.keys(subCalendarMap).length,
              submissionCalendar: subCalendarMap,
            },
            heatmapByYear,
            dailyActivityTimeline,
            contestSummary,
            contestHistory,
            recentAcceptedSubmissions,
            tagProblemCounts: matched.tagProblemCounts || {
              advanced: [],
              intermediate: [],
              fundamental: [],
            },
            fetchedAtUtc: new Date().toISOString(),
          };

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, profile: profileData }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: `Scraping error: ${err.message || 'Unknown network error'}`,
            })
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), leetcodeScraperPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
