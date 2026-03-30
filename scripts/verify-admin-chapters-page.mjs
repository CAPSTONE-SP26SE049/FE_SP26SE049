#!/usr/bin/env node
/**
 * Kiểm tra tĩnh toàn bộ module trang admin /admin/chapters (Học phần & Bài kiểm tra).
 * Chạy: node scripts/verify-admin-chapters-page.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const cm = path.join(root, 'src/modules/admin/pages/chapter-management');

const requiredFiles = [
  ['Trang chính', path.join(root, 'src/modules/admin/pages/ChapterManagementPage.tsx')],
  ['Views (list/quiz/detail)', path.join(cm, 'ChapterManagementViews.tsx')],
  ['Modals', path.join(cm, 'ChapterManagementModals.tsx')],
  ['Cột bảng', path.join(cm, 'chapterManagementColumns.tsx')],
  ['Hằng skill/độ khó', path.join(cm, 'constants.tsx')],
  ['Vùng miền dialect → BAC|TRUNG|NAM', path.join(cm, 'regionUtils.ts')],
  ['Gom thống kê quiz theo level', path.join(cm, 'aggregateLevelStats.ts')],
];

let failed = 0;

for (const [label, file] of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`FAIL [thiếu file ${label}]:\n  ${file}`);
    failed++;
  } else {
    console.log(`PASS [có file: ${label}]`);
  }
}

const checks = [
  {
    name: 'aggregateLevelStats',
    file: path.join(cm, 'aggregateLevelStats.ts'),
    mustInclude: [
      'export function aggregateLevelStats',
      'mergeEngagementIntoLevelStats',
      'q.levelId',
      'quizCount',
      'learnerCount',
      'successRate',
    ],
  },
  {
    name: 'ChapterManagementPage — import module + API stats',
    file: path.join(root, 'src/modules/admin/pages/ChapterManagementPage.tsx'),
    mustInclude: [
      './chapter-management/ChapterManagementModals',
      './chapter-management/ChapterManagementViews',
      './chapter-management/chapterManagementColumns',
      './chapter-management/regionUtils',
      './chapter-management/aggregateLevelStats',
      'aggregateLevelStats(levels, all)',
      'mergeEngagementIntoLevelStats',
      'getLevelEngagementStats',
      'adminService.getQuizzes()',
      'refreshLevelStats',
      'levelStats={levelStats}',
      'statsLoading={statsLoading}',
    ],
  },
  {
    name: 'ChapterManagementViews — list + stats',
    file: path.join(cm, 'ChapterManagementViews.tsx'),
    mustInclude: [
      'export function ChapterListView',
      'levelStats?:',
      'statsLoading?:',
      'levelStats[record.id]',
      'statsLoading || loadingStats',
      'groupQuizChallengesBySkill',
      'Descriptions',
      'Chưa có mô tả',
    ],
  },
  {
    name: 'chapterManagementColumns — quiz + challenge',
    file: path.join(cm, 'chapterManagementColumns.tsx'),
    mustInclude: [
      'export function createQuizColumns',
      'onEditQuiz',
      'export function createChallengeColumns',
      'export function createChallengeColumnsForSkill',
      'export function groupQuizChallengesBySkill',
      'onViewChallenge',
    ],
  },
  {
    name: 'regionUtils',
    file: path.join(cm, 'regionUtils.ts'),
    mustInclude: ['export function getRegionKeyFromDialect', 'export function getRegionLabel'],
  },
  {
    name: 'ChapterManagementModals',
    file: path.join(cm, 'ChapterManagementModals.tsx'),
    mustInclude: ['export function ChapterManagementModals', 'DIFFICULTY_CONFIG', 'SKILL_CONFIG'],
  },
  {
    name: 'constants',
    file: path.join(cm, 'constants.tsx'),
    mustInclude: ['export const SKILL_CONFIG', 'export const DIFFICULTY_CONFIG', 'ENTRY_TEST'],
  },
];

for (const c of checks) {
  let text;
  try {
    text = fs.readFileSync(c.file, 'utf8');
  } catch {
    console.error(`FAIL [${c.name}]: không đọc được:\n  ${c.file}`);
    failed++;
    continue;
  }
  const missing = c.mustInclude.filter((s) => !text.includes(s));
  if (missing.length) {
    console.error(`FAIL [${c.name}] thiếu:\n  ${missing.join('\n  ')}`);
    failed++;
  } else {
    console.log(`PASS [${c.name}]`);
  }
}

if (failed) {
  console.error(`\nTổng: ${failed} lỗi (file hoặc nội dung).`);
  process.exit(1);
}
console.log('\nTất cả kiểm tra trang /admin/chapters đều PASS.');
process.exit(0);
