// 작물 결정 · 성장 단계 · 밭 5칸 · 자동 수확 (SPEC 5장).
// 희귀 작물·확률 없음. 모든 작물은 같은 등급. 시들지 않는다.
// 수확은 자동이다 [확정 2026-10-21]: 심은 날 새싹 → 다음 날 자라는 중 → 이틀 뒤 다 익음(하루 동안 반짝임)
// → 사흘째 하루 경계(04:00)에 자동 수확. 날짜는 모두 day.ts의 하루 기준.

import { addDays, daysBetween, type DayKey } from './day';
import type { CropKind, CropStage, DayRecord, PlotSlot } from './types';

export const FIELD_SIZE = 5;

/** 자라는 시간: 1일차 새싹 → 2일차 자라는 중 → 3일차 다 익음 */
export const GROW_DAYS = 3;

/** 심은 날로부터 며칠째 하루가 시작될 때(04:00) 자동 수확하는지. 다 익은 모습은 그 전 하루 동안만 보인다. */
export const AUTO_HARVEST_AFTER_DAYS = 3;

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

/** 다 익어서 밭에서 반짝이는 날인가 (내일 새벽 자동 수확) */
export function isRipe(p: Planting, today: DayKey): boolean {
  return stageOf(p.plantedDate, today) === GROW_DAYS;
}

/** 자동 수확되는 날 (그날 하루가 시작될 때) */
export function autoHarvestDay(plantedDate: DayKey): DayKey {
  return addDays(plantedDate, AUTO_HARVEST_AFTER_DAYS);
}

/**
 * 오늘까지 자동 수확됐어야 할 작물 (오래된 순).
 * 앱을 며칠 안 열었어도 열었을 때 이것으로 밀린 수확을 한 번에 정산한다.
 */
export function dueForAutoHarvest(active: readonly Planting[], today: DayKey): Planting[] {
  return active.filter((p) => daysBetween(autoHarvestDay(p.plantedDate), today) >= 0).sort(byAge);
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

