// 마을 경험치 · 레벨 · 해금 (SPEC 6장). 마을 레벨은 절대 떨어지지 않는다.

import type { DayRecord } from './types';

// 경험치 — SPEC 6장 [확정] 2026-10-20
/** 기록 1회 */
export const XP_RECORD = 10;
/**
 * 영역 입력마다 (건강 · 일 · 관계 · 여가).
 * 컨디션(건강)과 일 강도(일)는 기록 시트 필수라 매일 +10, 관계·여가는 입력한 날만 +5씩.
 * → 하루 20 ~ 30 (보통 25 안팎).
 */
export const XP_PER_AREA = 5;

/**
 * 레벨 곡선 — SPEC 6장 [확정] 2026-10-20
 * 레벨 L → L+1에 필요한 경험치 = XP_LEVEL_BASE + XP_LEVEL_STEP × (L − 1)  → 30, 50, 70, 90 …
 * Lv.7 도달 누적 480: 하루 25면 약 19일, 20이면 24일, 30이면 16일 → 2~3주 사용.
 * (Lv.10 누적 990 ≈ 40일, Lv.20 누적 3,990 ≈ 160일)
 */
export const XP_LEVEL_BASE = 30;
export const XP_LEVEL_STEP = 20;

export function xpToNext(level: number): number {
  return XP_LEVEL_BASE + XP_LEVEL_STEP * (level - 1);
}

/**
 * 해금 레벨 — SPEC 6장 [확정] 2026-10-20.
 * '발견한 패턴'만 마을 Lv.10에 열린다. 나머지 기능은 처음부터 열려 있다.
 */
export const UNLOCK_LEVEL = {
  patterns: 10,
} as const;

/** 그날 기록에서 입력한 영역 수 (건강 · 일은 필수) */
export function areasEntered(r: DayRecord): number {
  return 2 + (r.contacts.length > 0 ? 1 : 0) + (r.leisure.length > 0 ? 1 : 0);
}

/** 그날 기록이 주는 경험치 */
export function xpForRecord(r: DayRecord): number {
  return XP_RECORD + XP_PER_AREA * areasEntered(r);
}

/**
 * 기록을 고쳤을 때 더 줄 경험치. 이미 받은 것보다 많아질 때만 차이를 준다 (줄이지 않는다).
 */
export function xpDelta(alreadyGranted: number, computed: number): number {
  return Math.max(0, computed - alreadyGranted);
}

export type LevelProgress = {
  level: number;
  /** 이번 레벨에서 쌓은 경험치 */
  into: number;
  /** 이번 레벨에서 다음 레벨까지 필요한 경험치 */
  needed: number;
  total: number;
};

export function levelFromXp(totalXp: number): LevelProgress {
  const total = Math.max(0, Math.floor(totalXp));
  let level = 1;
  let rest = total;
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level);
    level++;
  }
  return { level, into: rest, needed: xpToNext(level), total };
}

export function isUnlocked(feature: keyof typeof UNLOCK_LEVEL, level: number): boolean {
  return level >= UNLOCK_LEVEL[feature];
}
