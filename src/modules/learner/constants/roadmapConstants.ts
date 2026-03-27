export const ROADMAP_FALLBACK_ACCOUNT_ID =
  "84ae7dea-fee1-4b02-887a-870f08da8398";

export const ROADMAP_STATUS = {
  COMPLETED: "completed",
  IN_PROGRESS: "in_progress",
  UPCOMING: "upcoming",
} as const;

export const STATUS_LABEL: Record<string, string> = {
  [ROADMAP_STATUS.COMPLETED]: "Đã hoàn thành",
  [ROADMAP_STATUS.IN_PROGRESS]: "Đang học",
  [ROADMAP_STATUS.UPCOMING]: "Sắp tới",
};

export const WEEKDAY_LABELS: Record<number, string> = {
  0: "CN",
  1: "T2",
  2: "T3",
  3: "T4",
  4: "T5",
  5: "T6",
  6: "T7",
};
