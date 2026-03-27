#!/usr/bin/env node
/**
 * Xác minh nhanh: log BE + FE gọi challenge-bank với skillType, region, levelId.
 * Chạy: node scripts/verify-challenge-bank-wiring.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const beRoot = path.join(root, '..', 'com.company.FSA_Captone_2026');

const checks = [
  {
    name: 'AdminController log + getAllChallengeBank',
    file: path.join(
      beRoot,
      'src/main/java/org/fsa_2026/company_fsa_captone_2026/controller/AdminController.java'
    ),
    mustInclude: [
      'Admin retrieving challenge bank items with filters: skillType={}, region={}, levelId={}',
      'getAllChallengeBank',
      'challengeBankService.getAllChallenges(skillType, region, levelId)',
    ],
  },
  {
    name: 'ChallengeBankService filter 3 tham số → findFiltered',
    file: path.join(
      beRoot,
      'src/main/java/org/fsa_2026/company_fsa_captone_2026/service/ChallengeBankService.java'
    ),
    mustInclude: [
      'public List<ChallengeBank> getAllChallenges(String skillType, String region, UUID levelId)',
      'findFiltered(st, region, levelId)',
    ],
  },
  {
    name: 'adminService.getChallengeBank (params)',
    file: path.join(root, 'src/modules/admin/services/adminService.ts'),
    mustInclude: [
      'getChallengeBank: async (skillType?: string, region?: string, levelId?: string)',
      "/admin/content/challenge-bank'",
      'params.levelId',
    ],
  },
];

function checkFilteredBankConsumer() {
  const adminChapter = path.join(
    root,
    'src/modules/admin/pages/ChapterManagementPage.tsx'
  );
  const eduQuiz = path.join(
    root,
    'src/modules/educator/pages/QuizManagementPage.tsx'
  );
  let a = '';
  let e = '';
  try {
    a = fs.readFileSync(adminChapter, 'utf8');
  } catch {
    /* ignore */
  }
  try {
    e = fs.readFileSync(eduQuiz, 'utf8');
  } catch {
    /* ignore */
  }
  const adminOk = a.includes('adminService.getChallengeBank(skillType, region, levelId)');
  const eduOk =
    e.includes('educatorService.getChallengeBank(skillType, region') ||
    e.includes('educatorService.getChallengeBank(skillType, region,');
  if (adminOk || eduOk) {
    const where = [adminOk && 'admin ChapterManagement', eduOk && 'educator QuizManagement']
      .filter(Boolean)
      .join(' + ');
    console.log(`PASS [FE gọi bank có filter: ${where}]`);
    return true;
  }
  console.error(
    'FAIL [FE gọi bank có filter] cần ít nhất một trong hai:\n' +
      '  - admin ChapterManagementPage: adminService.getChallengeBank(skillType, region, levelId)\n' +
      '  - educator QuizManagementPage: educatorService.getChallengeBank(skillType, region, ...)'
  );
  return false;
}

let failed = 0;
for (const c of checks) {
  let text;
  try {
    text = fs.readFileSync(c.file, 'utf8');
  } catch (e) {
    console.error(`FAIL [${c.name}]: không đọc được file:\n  ${c.file}`);
    failed++;
    continue;
  }
  const missing = c.mustInclude.filter((s) => !text.includes(s));
  if (missing.length) {
    console.error(`FAIL [${c.name}] thiếu chuỗi:\n  ${missing.join('\n  ')}`);
    failed++;
  } else {
    console.log(`PASS [${c.name}]`);
  }
}

if (!checkFilteredBankConsumer()) {
  failed++;
}

if (failed) {
  console.error(`\nTổng: ${failed} nhóm kiểm tra thất bại.`);
  process.exit(1);
}
console.log('\nTất cả kiểm tra tĩnh đều PASS.');
process.exit(0);
