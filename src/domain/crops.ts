// 작물 결정 · 성장 단계 · 밭 5칸 · 자동 수확 (SPEC 5장).
// 희귀 작물·확률 없음. 모든 작물은 같은 등급. 시들지 않는다.

import { daysBetween, type DayKey } from './day';
import type { CropKind, CropStage, DayRecord, PlotSlot } from './types';

export const FIELD_SIZE = 5;

/** 자라는 시간: 1일차 새싹 → 2일차 자라는 중 → 3일차 다 익음 */
export const GROW_DAYS = 3;

/**
 * 조건이 겹칠 때 우선순위 (앞일수록 먼저). 감자는 해당 없을 때.
 * SPEC 5장 [확정] 2026-10-20: 버섯 > 커피콩 > 딸기 > 해바라기 > 감자 (힘든 날을 먼저 반영).
 */
export const CROP_PRIORITY: readonly Exclude<CropKind, 'potato'>[] = ['mushroom', 'coffee', 'strawberry', 'sunflower'];

const MATCHES: Record<Exclude<CropKind, 'potato'>, (r: DayRecord) => boolean> = {
  mushroom: (r) => r.condition === 1,
  coffee: (r) => r.work === 3,
  strawberry: (r) => r.contacts.length > 0,
  sunflower: (r) => r.condition === 3 && r.leisure.length > 0,
};

/** 그날 기록 → 작물. 같은 기록이면 항상 같은 작물. */
export function cropFor(r: DayRecord): CropKind {
  return CROP_PRIORITY.find((k) => MATCHES[k](r)) ?? 'potato';
}

export type Planting = {
  id: number;
  crop: CropKind;
  plantedDate: DayKey;
  slot: number;
};

export function stageOf(plantedDate: DayKey, today: DayKey): CropStage {
  const day = daysBetween(plantedDate, today) + 1;
  return Math.min(GROW_DAYS, Math.max(1, day)) as CropStage;
}

export function isRipe(p: Planting, today: DayKey): boolean {
  return stageOf(p.plantedDate, today) === GROW_DAYS;
}

/** 오래 심은 순 */
const byAge = (a: Planting, b: Planting) => a.plantedDate.localeCompare(b.plantedDate) || a.id - b.id;

export type SeedPlan = {
  slot: number;
  /** 밭이 꽉 차서 대신 딴 가장 오래된 작물 */
  autoHarvest: Planting | null;
};

/**
 * 새 씨앗을 어디에 심을지. 빈 칸이 있으면 가장 앞 빈 칸,
 * 꽉 찼으면 가장 먼저 심은 작물을 자동 수확하고 그 칸에 심는다.
 */
export function planSeed(active: readonly Planting[]): SeedPlan {
  const used = new Set(active.map((p) => p.slot));
  for (let s = 0; s < FIELD_SIZE; s++) if (!used.has(s)) return { slot: s, autoHarvest: null };
  const oldest = [...active].sort(byAge)[0];
  return { slot: oldest.slot, autoHarvest: oldest };
}

/** 밭 5칸 그림용 */
export function fieldSlots(active: readonly Planting[], today: DayKey): PlotSlot[] {
  const slots: PlotSlot[] = Array(FIELD_SIZE).fill(null);
  for (const p of active) {
    if (p.slot >= 0 && p.slot < FIELD_SIZE) slots[p.slot] = { crop: p.crop, stage: stageOf(p.plantedDate, today) };
  }
  return slots;
}

export function ripePlantings(active: readonly Planting[], today: DayKey): Planting[] {
  return active.filter((p) => isRipe(p, today)).sort(byAge);
}
