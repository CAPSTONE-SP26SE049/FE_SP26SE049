/**
 * Điểm danh / thử thách hằng ngày + chuỗi ngày hoàn thành thử thách (quiz đạt).
 * Lưu cục bộ theo userId — có thể đồng bộ server sau.
 */

export const DAILY_CHECKIN_BONUS_XP = 25

export interface GamificationSnapshot {
  learningStreakDays: number
  lastLearningDate: string | null
  /** Đã hoàn thành ít nhất một bài quiz đạt trong ngày hôm nay */
  todayQuizPassed: boolean
  /** Thưởng điểm danh lần gọi vừa rồi (0 nếu không) */
  dailyBonusXp: number
  /** Vừa nhận thưởng điểm danh hôm nay (lần đầu trong ngày) */
  justEarnedDailyBonus: boolean
  /** Tổng XP thưởng điểm danh đã cộng dồn (chỉ local, hiển thị) */
  totalDailyBonusXpAccumulated: number
}

interface StoredState {
  learningStreakDays: number
  lastLearningDate: string | null
  totalDailyBonusXpAccumulated: number
}

function localDateString(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function yesterdayLocal(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return localDateString(d)
}

function storageKey(userId: string) {
  return `speakvn_learner_gamification_${userId}`
}

function readStored(userId: string): StoredState {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    const p = raw ? JSON.parse(raw) : {}
    return {
      learningStreakDays: typeof p.learningStreakDays === 'number' ? p.learningStreakDays : 0,
      lastLearningDate: typeof p.lastLearningDate === 'string' ? p.lastLearningDate : null,
      totalDailyBonusXpAccumulated:
        typeof p.totalDailyBonusXpAccumulated === 'number' ? p.totalDailyBonusXpAccumulated : 0,
    }
  } catch {
    return { learningStreakDays: 0, lastLearningDate: null, totalDailyBonusXpAccumulated: 0 }
  }
}

function writeStored(userId: string, s: StoredState) {
  localStorage.setItem(storageKey(userId), JSON.stringify(s))
}

/**
 * Gọi khi học viên **đạt** một bài quiz (đủ %). Cộng thưởng điểm danh lần đầu trong ngày.
 */
export function recordQuizPassedForGamification(userId: string): GamificationSnapshot {
  const raw = readStored(userId)
  const today = localDateString()
  const last = raw.lastLearningDate

  if (last === today) {
    return {
      learningStreakDays: raw.learningStreakDays,
      lastLearningDate: today,
      todayQuizPassed: true,
      dailyBonusXp: 0,
      justEarnedDailyBonus: false,
      totalDailyBonusXpAccumulated: raw.totalDailyBonusXpAccumulated,
    }
  }

  let streak = raw.learningStreakDays
  if (last === yesterdayLocal()) {
    streak = Math.max(1, streak + 1)
  } else if (last != null) {
    streak = 1
  } else {
    streak = 1
  }

  const totalBonus = raw.totalDailyBonusXpAccumulated + DAILY_CHECKIN_BONUS_XP
  writeStored(userId, {
    learningStreakDays: streak,
    lastLearningDate: today,
    totalDailyBonusXpAccumulated: totalBonus,
  })

  return {
    learningStreakDays: streak,
    lastLearningDate: today,
    todayQuizPassed: true,
    dailyBonusXp: DAILY_CHECKIN_BONUS_XP,
    justEarnedDailyBonus: true,
    totalDailyBonusXpAccumulated: totalBonus,
  }
}

export function getGamificationSnapshot(userId: string): GamificationSnapshot {
  const raw = readStored(userId)
  const today = localDateString()
  const last = raw.lastLearningDate
  return {
    learningStreakDays: raw.learningStreakDays,
    lastLearningDate: last,
    todayQuizPassed: last === today,
    dailyBonusXp: 0,
    justEarnedDailyBonus: false,
    totalDailyBonusXpAccumulated: raw.totalDailyBonusXpAccumulated,
  }
}

/** Cấp 1–50 từ XP máy chủ (mỗi cấp ~1000 XP). */
export function getLevelFromXp(xp: number): {
  level: number
  xpIntoLevel: number
  xpToNextLevel: number
} {
  const x = Math.max(0, Math.floor(xp))
  const level = Math.min(50, Math.floor(x / 1000) + 1)
  const xpIntoLevel = x % 1000
  return {
    level,
    xpIntoLevel,
    xpToNextLevel: 1000,
  }
}
