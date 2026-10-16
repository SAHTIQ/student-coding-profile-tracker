<<<<<<< HEAD
# CodePulse — LeetCode Productivity Analytics Platform

A modern, dashboard-focused developer analytics web application designed to track, benchmark, diagnose, and forecast coding activity using public LeetCode profile data.

---

## 🚀 Live Demo & Local Development

The project is built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, **Recharts**, and **Lucide Icons**. It runs entirely locally in the browser with deterministic mock data and localStorage persistence.

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build production bundle
npm run build
```

Open your browser at `http://localhost:5173/`.

---

## 👥 Role-Based Authentication & Workspaces

The platform provides an interactive role selection portal supporting two distinct personas:

### 1. Super Admin Persona
- **Cohort Intelligence Dashboard:** 6 platform-wide KPI metric cards with period-over-period delta benchmarks.
- **Cohort Coding Activity Overview:** Multi-granularity time-series charts (Daily, Weekly, Monthly) with area shading.
- **Problem-Solving Progression:** Stacked difficulty bars (Easy, Medium, Hard) across top performers.
- **Cohort Cumulative Heatmap:** 20-week GitHub-style contribution calendar with intensity mapping and interactive date tooltips.
- **Competitive Standing Distribution:** Rating tiers (<1500 Novice up to 2100+ Guardian).
- **Student Roster Management:** Complete CRUD interface with search, multi-field filtering (department, study year, collection status), sorting by any metric, and pagination.
- **Simulated LeetCode Sync:** Trigger GraphQL collection simulations (with realistic states: `pending`, `fetching`, `success`, `not_found`, `rate_limited`, `failed`).
- **Student Management:** Add student dialog with inline validation and duplicate prevention; edit metadata dialog; delete confirmation dialog.

### 2. Student Persona
- **Personalized Analytics Workspace:** Direct access to individual coding consistency, streaks, acceptance rates, and contest standings.
- **Coding Behavior Insights:** Evidence-based behavioral pattern diagnostics (accelerating vs decelerating momentum, weekend sprint vs weekday routine, difficulty balance, contest participation).
- **Activity Forecasting Engine:** 7, 14, and 30-day projected submission trajectories with uncertainty bounds and model reliability scoring.
- **Read-Only Peer Comparisons:** Compare performance head-to-head with eligible classmates without exposing private administrative or contact details.

---

## 📊 Core Pages & Features

| Route | Page | Description |
|---|---|---|
| `/login` | **Role Selection** | Minimal authentication screen for instant switching between Super Admin and Student personas. |
| `/admin-overview` | **Super Admin Dashboard** | Platform-wide KPI cards, activity volume, problem progress, cohort heatmap, and leaderboard. |
| `/students` | **Student Management** | Search, filter, add/edit/delete students, bulk sync simulation, and collection status monitoring. |
| `/my-analytics` | **Student Workspace** | Individual student's personalized metrics, streak counters, heatmap, and insights. |
| `/students/:id` | **Student Detail** | Detailed profile page for any student (ranking, badges, languages, contest history, recent solutions). |
| `/compare` | **Compare Students** | Interactive comparison matrix (2 to 5 students) with grouped bar charts and comparative 30-day trend lines. |
| `/forecast` | **Activity Forecast** | Time-series projection of future submissions with 7/14/30-day horizons, uncertainty bounds, and reliability diagnostics. |
| `/reports` | **Reports & Export** | Structured audit tables across categories (Cohort, Problem Solving, Contests, Consistency) with one-click CSV export. |
| `/settings` | **System Settings** | Theme toggle, lookback window preferences, simulated alert toggles, sync intervals, and demo reset. |

---

## 📈 Forecasting Baseline Methodology

The activity forecasting module (`src/services/forecastService.ts`) implements a deterministic baseline algorithm:
1. **Recency-Weighted Moving Average (14d WMA):** Recent days are weighted exponentially higher to reflect active practice momentum.
2. **Day-of-Week (DOW) Seasonality:** Calculates 7 daily coefficients from the last 28 days to capture weekend bursts or weekday routines.
3. **Dynamic Uncertainty Bounds:** Variance bands expand proportionally with projection distance across 7, 14, and 30-day horizons.
4. **Reliability Indicator:** Evaluates data density and recent consistency (>70% = High, <25% = Low, <14 days = Insufficient).

---

## 🛡️ LeetCode GraphQL Scraper Data Contract

The data architecture directly mirrors the fields provided by the reference Python scraper:
- `matchedUser.profile`: ranking, userAvatar, realName, aboutMe, school, countryName, skillTags, reputation, githubUrl, linkedinUrl.
- `submitStats`: accepted problem counts & total submissions by difficulty (Easy, Medium, Hard, All).
- `languageProblemCount`: languageName and problemsSolved.
- `userCalendar`: streak, totalActiveDays, submissionCalendar (epoch -> count), and daily activity timeline.
- `userContestRanking`: rating, globalRanking, attendedContestsCount, topPercentage.
- `userContestRankingHistory`: contestTitle, problemsSolved, totalProblems, rating, ranking, trendDirection.
- `recentAcSubmissionList`: title, titleSlug, timestamp.
- Collection Metadata: `lastFetchedAt`, `collectionStatus`, `errorMessage`.

---

## 🧪 Demo Test Scenarios

To test error handling and simulated states in the **Add Student** dialog:
- Enter any regular username (e.g. `alex_dev`) -> **Successful Sync** (`success`).
- Enter a username containing `notfound` (e.g. `ghost_notfound`) -> **Profile Not Found** (`not_found`).
- Enter a username containing `ratelimit` (e.g. `burst_ratelimit`) -> **HTTP 429 Simulated Rate Limit** (`rate_limited`).
- Enter a username containing `error` or `fail` -> **Connection Reset Simulation** (`failed`).
- Enter an existing username (e.g. `aarav_algo`) -> **Duplicate Username Prevention Error**.
=======
# student-coding-profile-tracker
Track student's coding profiles such as leetcode , hackerRank , codeChef , Github , codeForce , etc
>>>>>>> e67806d7d6269b6e5f5c1f315a0eee47c34ca4bd
