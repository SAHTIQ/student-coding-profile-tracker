import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Super Admin
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@bitsathy.ac.in' },
    update: {},
    create: {
      email: 'admin@bitsathy.ac.in',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
    },
  });
  console.log('✅ Super Admin created:', superAdmin.email);

  // 2. Create Faculty
  const facultyPassword = await bcrypt.hash('Faculty@123', 10);
  const facultyUser = await prisma.user.upsert({
    where: { email: 'faculty.cse@bitsathy.ac.in' },
    update: {},
    create: {
      email: 'faculty.cse@bitsathy.ac.in',
      passwordHash: facultyPassword,
      role: 'FACULTY',
      facultyProfile: {
        create: {
          facultyId: 'FAC-CSE-001',
          name: 'Dr. K. Senthil Nathan',
          department: 'CSE',
          canViewOwnDepartment: true,
          canExportReports: true,
        },
      },
    },
    include: { facultyProfile: true },
  });
  console.log('✅ Faculty created:', facultyUser.email);

  // 3. Create Sample Problems with Categories
  const problemData = [
    {
      title: 'Two Sum',
      titleSlug: 'two-sum',
      difficulty: 'EASY' as const,
      topicTags: ['Array', 'Hash Table'],
    },
    {
      title: 'Longest Substring Without Repeating Characters',
      titleSlug: 'longest-substring-without-repeating-characters',
      difficulty: 'MEDIUM' as const,
      topicTags: ['Hash Table', 'String', 'Sliding Window'],
    },
    {
      title: 'Container With Most Water',
      titleSlug: 'container-with-most-water',
      difficulty: 'MEDIUM' as const,
      topicTags: ['Array', 'Two Pointers', 'Greedy'],
    },
    {
      title: 'Trapping Rain Water',
      titleSlug: 'trapping-rain-water',
      difficulty: 'HARD' as const,
      topicTags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
    },
    {
      title: 'Coin Change',
      titleSlug: 'coin-change',
      difficulty: 'MEDIUM' as const,
      topicTags: ['Dynamic Programming', 'Breadth-First Search'],
    },
    {
      title: 'Number of Islands',
      titleSlug: 'number-of-islands',
      difficulty: 'MEDIUM' as const,
      topicTags: ['Depth-First Search', 'Breadth-First Search', 'Union Find', 'Matrix', 'Graph'],
    },
    {
      title: 'Merge Intervals',
      titleSlug: 'merge-intervals',
      difficulty: 'MEDIUM' as const,
      topicTags: ['Array', 'Sorting'],
    },
    {
      title: 'Binary Tree Level Order Traversal',
      titleSlug: 'binary-tree-level-order-traversal',
      difficulty: 'MEDIUM' as const,
      topicTags: ['Tree', 'Breadth-First Search', 'Binary Tree'],
    },
  ];

  const createdProblems = [];
  for (const p of problemData) {
    const prob = await prisma.problem.upsert({
      where: { titleSlug: p.titleSlug },
      update: {},
      create: {
        title: p.title,
        titleSlug: p.titleSlug,
        difficulty: p.difficulty,
        topicTags: JSON.stringify(p.topicTags),
        platform: 'LeetCode',
        url: `https://leetcode.com/problems/${p.titleSlug}/`,
      },
    });
    createdProblems.push(prob);
  }
  console.log(`✅ Seeded ${createdProblems.length} categorized problems.`);

  // 4. Create Sample Students with Roll Numbers and Activity History
  const studentPassword = await bcrypt.hash('Student@123', 10);
  const sampleStudents = [
    {
      rollNumber: '7376221CS101',
      name: 'Aarav Sharma',
      email: '7376221cs101@bitsathy.ac.in',
      department: 'CSE',
      yearOfStudy: '3rd Year',
      batch: '2022-2026',
      section: 'A',
      leetcodeUsername: 'aarav_algo',
    },
    {
      rollNumber: '7376221CS102',
      name: 'Priya Patel',
      email: '7376221cs102@bitsathy.ac.in',
      department: 'CSE',
      yearOfStudy: '3rd Year',
      batch: '2022-2026',
      section: 'B',
      leetcodeUsername: 'priya_codes',
    },
    {
      rollNumber: '7376221IT101',
      name: 'Rohan Iyer',
      email: '7376221it101@bitsathy.ac.in',
      department: 'IT',
      yearOfStudy: '3rd Year',
      batch: '2022-2026',
      section: 'A',
      leetcodeUsername: 'rohan_dev',
    },
    {
      rollNumber: '7376221AD105',
      name: 'Sneha Reddy',
      email: '7376221ad105@bitsathy.ac.in',
      department: 'AI&DS',
      yearOfStudy: '2nd Year',
      batch: '2023-2027',
      section: 'A',
      leetcodeUsername: 'sneha_ai',
    },
  ];

  for (const s of sampleStudents) {
    const studentUser = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        passwordHash: studentPassword,
        role: 'STUDENT',
        studentProfile: {
          create: {
            rollNumber: s.rollNumber,
            name: s.name,
            department: s.department,
            yearOfStudy: s.yearOfStudy,
            batch: s.batch,
            section: s.section,
            leetcodeUsername: s.leetcodeUsername,
            collectionStatus: 'success',
            lastSyncedAt: new Date(),
          },
        },
      },
      include: { studentProfile: true },
    });

    const stuProfile = studentUser.studentProfile!;

    // Add problem submissions across recent days for this student
    const dates = ['2026-10-18', '2026-10-17', '2026-10-16', '2026-10-15'];
    let probIdx = 0;
    for (const d of dates) {
      const selectedProbs = [
        createdProblems[probIdx % createdProblems.length],
        createdProblems[(probIdx + 1) % createdProblems.length],
      ];
      probIdx += 2;

      for (const p of selectedProbs) {
        await prisma.problemSubmission.upsert({
          where: {
            studentId_problemId_solvedDate: {
              studentId: stuProfile.id,
              problemId: p.id,
              solvedDate: d,
            },
          },
          update: {},
          create: {
            studentId: stuProfile.id,
            problemId: p.id,
            solvedDate: d,
            solvedTimestamp: new Date(`${d}T10:00:00Z`),
            language: 'cpp',
          },
        });
      }

      await prisma.dailyActivityAggregate.upsert({
        where: {
          studentId_activityDate: {
            studentId: stuProfile.id,
            activityDate: d,
          },
        },
        update: {},
        create: {
          studentId: stuProfile.id,
          activityDate: d,
          totalSolved: 2,
          easySolved: 1,
          mediumSolved: 1,
          hardSolved: 0,
        },
      });
    }
  }

  console.log('🎉 Seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
