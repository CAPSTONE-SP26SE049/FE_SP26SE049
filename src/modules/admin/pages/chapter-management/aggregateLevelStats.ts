/**
 * Gom quiz theo levelId (học phần) — khớp hướng Antigravity brain (aggregate từ danh sách quiz).
 */
export type LevelStat = {
  quizCount: number;
  learnerCount: number;
  successRate: number;
  failRate: number;
};

export type LevelEngagementRow = {
  levelId: string;
  learnerCount: number;
  successRate: number;
  failRate: number;
};

function quizLevelKey(q: { levelId?: string | null; level_id?: string | null }): string | null {
  const raw = q.levelId ?? q.level_id;
  if (raw == null || raw === '') return null;
  return String(raw);
}

export function aggregateLevelStats(
  levels: { id: string }[],
  quizzes: { levelId?: string | null; level_id?: string | null }[]
): Record<string, LevelStat> {
  const byLevel: Record<string, typeof quizzes> = {};
  for (const q of quizzes) {
    const lid = quizLevelKey(q);
    if (!lid) continue;
    if (!byLevel[lid]) byLevel[lid] = [];
    byLevel[lid].push(q);
  }
  const out: Record<string, LevelStat> = {};
  for (const level of levels) {
    const key = String(level.id);
    const list = byLevel[key] || [];
    out[key] = {
      quizCount: list.length,
      learnerCount: 0,
      successRate: 0,
      failRate: 0,
    };
  }
  return out;
}

/** Gộp thống kê từ GET /admin/content/levels/engagement-stats lên map đã có quizCount. */
export function mergeEngagementIntoLevelStats(
  base: Record<string, LevelStat>,
  engagement: LevelEngagementRow[]
): Record<string, LevelStat> {
  const out: Record<string, LevelStat> = { ...base };
  for (const row of engagement) {
    const key = String(row.levelId ?? '');
    if (!key) continue;
    const prev = out[key] ?? {
      quizCount: 0,
      learnerCount: 0,
      successRate: 0,
      failRate: 0,
    };
    out[key] = {
      ...prev,
      learnerCount: row.learnerCount,
      successRate: row.successRate,
      failRate: row.failRate,
    };
  }
  return out;
}
