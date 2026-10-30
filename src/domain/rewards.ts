// 아침 "오늘 하루 고르기"와 마을 보상표에 보여 줄 예정 보상. 순수 함수 — 지급(저장)은 하지 않는다.
// 마을 레벨 계산은 src/domain/village.ts 에 있고 여기서는 읽지도 바꾸지도 않는다 (레벨 숫자를 받아서 계산만 한다).

import { unlockForLevel, type UnlockInfo } from './villageUnlocks';

// TODO([미정]): 마을 레벨 곡선 확정 후 재검토. 아래 숫자는 임시 가안이다 ([제안] — 사용자 확정 전).
/** 월급: Lv.1 기준 금액 */
export const SALARY_BASE = 100;
/** 월급: 레벨이 하나 오를 때마다 늘어나는 금액 */
export const SALARY_PER_LEVEL = 10;
/** 놀기 흥: Lv.1 기준 */
export const PLAY_HEUNG_BASE = 10;
/** 놀기 흥: 레벨 PLAY_HEUNG_STEP_EVERY 마다 늘어나는 양 */
export const PLAY_HEUNG_STEP = 2;
export const PLAY_HEUNG_STEP_EVERY = 5;

// TODO([미정]): 지급은 저녁 기록 저장 시. 흥과 장작 상한 관계 확정 후 구현
// (지급 시점, 흥 = 쉼 지수 연결, 놀기 흥과 장작 상한(35)의 관계가 아직 정해지지 않았다. 잔액 저장소는 있다: src/data/wallet.ts)

/** 특별 보상으로 크게 보여 주는 레벨 */
export const MILESTONE_LEVELS: readonly number[] = [5, 10];

/** 1 미만이거나 소수 · NaN 이면 1 이상의 정수로 보정 */
function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.max(1, Math.floor(level));
}

/** 일하는 날 월급 = BASE + (레벨 − 1) × PER_LEVEL. 상한 없음. */
export function salaryForLevel(level: number): number {
  return SALARY_BASE + (clampLevel(level) - 1) * SALARY_PER_LEVEL;
}

/** 노는 날 흥 = BASE + floor(레벨 / EVERY) × STEP. 상한 없음. (Lv1~4 10, Lv5~9 12, Lv10~14 14) */
export function playHeungForLevel(level: number): number {
  return PLAY_HEUNG_BASE + Math.floor(clampLevel(level) / PLAY_HEUNG_STEP_EVERY) * PLAY_HEUNG_STEP;
}

export type RewardRow = {
  level: number;
  salary: number;
  heung: number;
  unlock: UnlockInfo | null;
  milestone: boolean;
};

export function rewardRow(level: number): RewardRow {
  const lv = clampLevel(level);
  return {
    level: lv,
    salary: salaryForLevel(lv),
    heung: playHeungForLevel(lv),
    unlock: unlockForLevel(lv),
    milestone: MILESTONE_LEVELS.includes(lv),
  };
}

/** 보상표에 그리는 마지막 레벨: 12 또는 현재 레벨 + 3 중 큰 쪽 */
export const REWARD_TABLE_MIN_LAST = 12;
export const REWARD_TABLE_AHEAD = 3;

export function rewardTableLevels(currentLevel: number): number[] {
  const last = Math.max(REWARD_TABLE_MIN_LAST, clampLevel(currentLevel) + REWARD_TABLE_AHEAD);
  return Array.from({ length: last }, (_, i) => i + 1);
}

export type RewardStatus = 'past' | 'current' | 'future';

export function rewardStatus(level: number, currentLevel: number): RewardStatus {
  const cur = clampLevel(currentLevel);
  return level < cur ? 'past' : level === cur ? 'current' : 'future';
}

/** 다음 레벨까지 진행률 0~1. 보상표 진행 바에 쓴다 (경험치 수치는 화면에 보이지 않는다). */
export function progressRatio(into: number, needed: number): number {
  if (!(needed > 0)) return 0;
  return Math.min(1, Math.max(0, into / needed));
}
