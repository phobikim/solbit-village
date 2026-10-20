// 수확 레벨 · 농부 칭호 (SPEC 5장). 수확 레벨은 누적 수확량으로만 오르고 절대 줄지 않는다.
// (창고 수량은 교환으로 줄 수 있지만 누적 수확량은 줄지 않는다.)

import type { CropKind } from './types';

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

// ── 스킨 교환 (SPEC 5장) ────────────────────────────────────────────────
// 스킨은 작물 수량만으로 교환한다. 교환하면 창고 수량은 줄지만 누적 수확량·수확 레벨은 그대로.


export type SkinCategory = 'soli' | 'building' | 'ijang';
export type SkinCost = Partial<Record<CropKind, number>>;
export type Skin = { id: string; name: string; category: SkinCategory; cost: SkinCost };

/**
 * 스킨 목록과 가격.
 * TODO: SPEC 5장 [미정] — 스킨 목록과 가격. 지금은 시안(9e)의 솔이 스킨 4종만 임시로 둔다.
 * 마을 건물 · 이장 소품은 시안이 없어 비어 있다.
 */
export const SKINS: readonly Skin[] = [
  { id: 'hat', name: '밀짚모자', category: 'soli', cost: { potato: 10, sunflower: 3 } },
  { id: 'band', name: '딸기 머리띠', category: 'soli', cost: { strawberry: 8 } },
  { id: 'apron', name: '커피 앞치마', category: 'soli', cost: { coffee: 6, potato: 4 } },
  { id: 'mush', name: '버섯 우산', category: 'soli', cost: { mushroom: 5, sunflower: 2 } },
];

export type Inventory = Partial<Record<CropKind, number>>;

/** 모자란 작물과 개수 (다 있으면 빈 배열) */
export function lackingFor(cost: SkinCost, inv: Inventory): { crop: CropKind; n: number }[] {
  return (Object.entries(cost) as [CropKind, number][])
    .map(([crop, need]) => ({ crop, n: need - (inv[crop] ?? 0) }))
    .filter((x) => x.n > 0);
}

export function canAfford(cost: SkinCost, inv: Inventory): boolean {
  return lackingFor(cost, inv).length === 0;
}

/** 교환 후 창고 수량 (모자라면 null) */
export function payFor(cost: SkinCost, inv: Inventory): Inventory | null {
  if (!canAfford(cost, inv)) return null;
  const next: Inventory = { ...inv };
  for (const [crop, need] of Object.entries(cost) as [CropKind, number][]) next[crop] = (next[crop] ?? 0) - need;
  return next;
}

/** 아직 갖고 있지 않은데 지금 바꿀 수 있는 스킨 (나 탭 분홍 점 · 방송) */
export function exchangeableSkins(inv: Inventory, owned: ReadonlySet<string>): Skin[] {
  return SKINS.filter((s) => !owned.has(s.id) && canAfford(s.cost, inv));
}

/** 방송용: 스킨 가격 중 가장 많이 드는 작물과 지금 가진 수량 */
export function exchangeHint(skin: Skin, inv: Inventory): { crop: CropKind; count: number; skin: string } {
  const [crop] = (Object.entries(skin.cost) as [CropKind, number][]).sort((a, b) => b[1] - a[1])[0];
  return { crop, count: inv[crop] ?? 0, skin: skin.name };
}
