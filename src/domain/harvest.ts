// 수확 레벨 · 농부 칭호 (SPEC 5장). 수확 레벨은 누적 수확량으로만 오르고 절대 줄지 않는다.
// (창고 수량은 교환으로 줄 수 있지만 누적 수확량은 줄지 않는다.)

/** 수확 레벨 하나당 수확 수 — SPEC 5장 [확정] 2026-10-20 */
export const HARVEST_PER_LEVEL = 15;

/** 농부 칭호와 시작 레벨 — SPEC 5장 [확정] 2026-10-20 */
export const FARMER_TITLES: readonly { minLevel: number; title: string }[] = [
  { minLevel: 1, title: '주말 농부' },
  { minLevel: 4, title: '동네 농부' },
  { minLevel: 7, title: '소문난 농부' },
  { minLevel: 10, title: '이장이 견제하는 농부' },
];

export type HarvestProgress = {
  level: number;
  title: string;
  total: number;
  /** 다음 레벨이 되는 누적 수확량 */
  nextAt: number;
};

export function harvestProgress(totalHarvested: number): HarvestProgress {
  const total = Math.max(0, Math.floor(totalHarvested));
  const level = Math.floor(total / HARVEST_PER_LEVEL) + 1;
  let title = FARMER_TITLES[0].title;
  for (const t of FARMER_TITLES) if (level >= t.minLevel) title = t.title;
  return { level, title, total, nextAt: level * HARVEST_PER_LEVEL };
}
