export type PlacementRegion = 'NORTH' | 'CENTRAL' | 'SOUTH'

export interface LearnerOnboardingUser {
  hasDoneEntryTest?: boolean
  region?: string | null
}

const UI_TO_API: Record<string, PlacementRegion> = {
  BAC: 'NORTH',
  TRUNG: 'CENTRAL',
  NAM: 'SOUTH',
  NORTH: 'NORTH',
  CENTRAL: 'CENTRAL',
  SOUTH: 'SOUTH',
}

/** Map UI code (BAC/TRUNG/NAM) or API code to NORTH | CENTRAL | SOUTH */
export function mapUiRegionToApi(code: string): PlacementRegion {
  const key = code.trim().toUpperCase()
  const mapped = UI_TO_API[key]
  if (!mapped) {
    throw new Error(`Invalid region code: ${code}`)
  }
  return mapped
}

export function hasRegionValue(region?: string | null): boolean {
  return Boolean(region && String(region).trim())
}

/** Post-login / guard target path for USER role */
export function getLearnerOnboardingPath(user: LearnerOnboardingUser): string {
  if (user.hasDoneEntryTest) {
    return '/learner/roadmap'
  }
  if (!hasRegionValue(user.region)) {
    return '/learner/select-region'
  }
  return '/learner/entrytest'
}

export const LEARNER_ONBOARDING_PATHS = ['/learner/select-region', '/learner/entrytest'] as const

export function isLearnerOnboardingPath(pathname: string): boolean {
  return LEARNER_ONBOARDING_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}
