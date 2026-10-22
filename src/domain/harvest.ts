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
// 스킨은 작물 수량만으로 교환한다 (확률 없음). 교환하면 창고 수량은 줄지만 누적 수확량·수확 레벨은 그대로.

export type SkinCategory = 'soli' | 'building' | 'ijang';

/** 가격: 지정 작물 + '아무 작물' 수량 */
export type SkinCost = { crops: Partial<Record<CropKind, number>>; any: number };
/** unlockLevel: 이 수확 레벨부터 교환할 수 있다 (없으면 처음부터) */
export type Skin = { id: string; name: string; category: SkinCategory; cost: SkinCost; unlockLevel?: number };

const c = (crops: SkinCost['crops']): SkinCost => ({ crops, any: 0 });

/**
 * 스킨 목록 · 가격 · 해금 레벨 — SPEC 5장 [확정] 2026-10-22 (디자인 v5 교환소 개정).
 * 커피콩·버섯도 재료로 쓴다 (2026-10-22 사용자 결정으로 제한 규칙 삭제).
 * 목록에서 빠진 스킨은 보유분도 마이그레이션 v7에서 정리한다.
 */
export const SKINS: readonly Skin[] = [
  // 솔이
  { id: 'hat', name: '밀짚모자', category: 'soli', cost: c({ potato: 10, sunflower: 3 }) },
  { id: 'band', name: '머리띠', category: 'soli', cost: c({ strawberry: 8 }) },
  { id: 'glasses', name: '동글이', category: 'soli', cost: c({ sunflower: 3, strawberry: 2 }) },
  { id: 'ice', name: '하드', category: 'soli', cost: c({ strawberry: 4, potato: 3 }) },
  { id: 'net', name: '잠자리채', category: 'soli', cost: c({ coffee: 4, sunflower: 2 }) },
  { id: 'pj', name: '꿀잠', category: 'soli', cost: c({ coffee: 3, potato: 4 }) },
  { id: 'rain', name: '비오는날', category: 'soli', cost: c({ sunflower: 5, potato: 6 }) },
  { id: 'pack', name: '배낭', category: 'soli', cost: c({ potato: 8, strawberry: 3 }) },
  { id: 'phones', name: '헤드셋', category: 'soli', cost: c({ coffee: 6, mushroom: 2 }), unlockLevel: 6 },
  // 마을 건물
  { id: 'roof', name: '민트지붕', category: 'building', cost: c({ strawberry: 4 }) },
  { id: 'post', name: '우체통', category: 'building', cost: c({ strawberry: 3, sunflower: 2 }) },
  { id: 'scarecrow', name: '허수아비', category: 'building', cost: c({ potato: 6, sunflower: 2 }) },
  { id: 'barn', name: '씨앗창고', category: 'building', cost: c({ potato: 10, coffee: 3 }) },
  { id: 'store', name: '편의점', category: 'building', cost: c({ coffee: 8, potato: 12 }), unlockLevel: 8 },
  // 이장 소품
  { id: 'shades', name: '선글라스', category: 'ijang', cost: c({ sunflower: 2, potato: 3 }) },
  { id: 'fan', name: '부채', category: 'ijang', cost: c({ sunflower: 3 }) },
  { id: 'rod', name: '낚싯대', category: 'ijang', cost: c({ potato: 6, coffee: 2 }) },
  { id: 'cap', name: '새마을', category: 'ijang', cost: c({ potato: 5, strawberry: 2 }) },
  { id: 'mic', name: '트로트', category: 'ijang', cost: c({ strawberry: 6, mushroom: 1 }) },
  { id: 'tractor', name: '트랙터', category: 'ijang', cost: c({ potato: 20, sunflower: 8, mushroom: 3 }), unlockLevel: 10 },
];

/** 수확 레벨이 모자라 아직 잠긴 스킨인가 */
export function isSkinLocked(skin: Skin, harvestLevel: number): boolean {
  return (skin.unlockLevel ?? 1) > harvestLevel;
}

export type Inventory = Partial<Record<CropKind, number>>;

/** '아무 작물' 차감에서 수량이 같을 때 먼저 쓰는 순서 */
const TIE_ORDER: readonly CropKind[] = ['potato', 'sunflower', 'strawberry', 'coffee', 'mushroom'];

export type Payment = {
  /** 작물별 차감 수량 (교환 전 확인 화면에 보여준다) */
  deduct: Partial<Record<CropKind, number>>;
  /** 모자란 지정 작물 */
  lacking: { crop: CropKind; n: number }[];
  /** 모자란 '아무 작물' 수 */
  lackingAny: number;
};

/**
 * 차감 계획. 지정 작물을 먼저 빼고, '아무 작물'은 남은 것 중 보유량이 가장 많은 작물부터
 * 그 작물이 다 떨어질 때까지 빼고, 다음으로 많은 작물로 넘어간다.
 */
export function planPayment(cost: SkinCost, inv: Inventory): Payment {
  const deduct: Partial<Record<CropKind, number>> = {};
  const left: Inventory = { ...inv };
  const lacking: { crop: CropKind; n: number }[] = [];
  for (const [crop, need] of Object.entries(cost.crops) as [CropKind, number][]) {
    const have = left[crop] ?? 0;
    if (have < need) lacking.push({ crop, n: need - have });
    const take = Math.min(have, need);
    if (take) deduct[crop] = take;
    left[crop] = have - take;
  }
  let rest = cost.any;
  const piles = TIE_ORDER.filter((c) => (left[c] ?? 0) > 0).sort((a, b) => (left[b] ?? 0) - (left[a] ?? 0));
  for (const crop of piles) {
    if (rest <= 0) break;
    const take = Math.min(left[crop] ?? 0, rest);
    deduct[crop] = (deduct[crop] ?? 0) + take;
    rest -= take;
  }
  return { deduct, lacking, lackingAny: Math.max(0, rest) };
}

export function canAfford(cost: SkinCost, inv: Inventory): boolean {
  const p = planPayment(cost, inv);
  return p.lacking.length === 0 && p.lackingAny === 0;
}

/** 교환 후 창고 수량 (모자라면 null) */
export function payFor(cost: SkinCost, inv: Inventory): Inventory | null {
  const p = planPayment(cost, inv);
  if (p.lacking.length || p.lackingAny) return null;
  const next: Inventory = { ...inv };
  for (const [crop, n] of Object.entries(p.deduct) as [CropKind, number][]) next[crop] = (next[crop] ?? 0) - n;
  return next;
}

/** 아직 갖고 있지 않은데 지금 바꿀 수 있는 스킨 (나 탭 분홍 점 · 방송). 잠긴 스킨은 빼고. */
export function exchangeableSkins(inv: Inventory, owned: ReadonlySet<string>, harvestLevel: number): Skin[] {
  return SKINS.filter((s) => !owned.has(s.id) && !isSkinLocked(s, harvestLevel) && canAfford(s.cost, inv));
}

/**
 * 방송용: 지정 작물이 있으면 가장 많이 드는 지정 작물과 지금 수량,
 * '아무 작물'만이면 crop = null, count = 전체 보유량.
 */
export function exchangeHint(skin: Skin, inv: Inventory): { crop: CropKind | null; count: number; skin: string } {
  const named = (Object.entries(skin.cost.crops) as [CropKind, number][]).sort((a, b) => b[1] - a[1])[0];
  if (named) return { crop: named[0], count: inv[named[0]] ?? 0, skin: skin.name };
  const total = Object.values(inv).reduce((a: number, n) => a + (n ?? 0), 0);
  return { crop: null, count: total, skin: skin.name };
}

/** 분류별로 하나만 쓴다: 그 분류에서 쓰고 있는 스킨 id */
export function equippedSkin(category: SkinCategory, equipped: ReadonlySet<string>): string | null {
  return SKINS.find((s) => s.category === category && equipped.has(s.id))?.id ?? null;
}

/**
 * 스킨을 쓰면 같은 분류(부위)에 쓰던 스킨은 벗는다. 쓴 뒤의 착용 목록.
 * 교환 직후에도 이 규칙으로 바로 쓴다.
 */
export function equipSkin(equipped: ReadonlySet<string>, skinId: string): Set<string> {
  const skin = SKINS.find((s) => s.id === skinId);
  if (!skin) return new Set(equipped);
  const next = new Set([...equipped].filter((id) => SKINS.find((s) => s.id === id)?.category !== skin.category));
  next.add(skinId);
  return next;
}
