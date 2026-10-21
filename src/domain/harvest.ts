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
export type Skin = { id: string; name: string; category: SkinCategory; cost: SkinCost };

/**
 * 스킨 재료로 지정하지 않는 작물 — CLAUDE.md 규칙 3.
 * 커피콩(일 강도 3)·버섯(지침)을 재료로 요구하면 그런 기록을 유도하게 된다. '아무 작물'로만 쓰인다.
 */
export const NON_INGREDIENT_CROPS: readonly CropKind[] = ['coffee', 'mushroom'];

/** 규칙 3 예외: 잠자리채 = 커피콩 4 + 해바라기 2 (2026-10-21 사용자 결정, 시안 그대로) */
export const NON_INGREDIENT_EXCEPTIONS: readonly string[] = ['net'];

/**
 * 스킨 목록과 가격 — SPEC 5장 [확정] 2026-10-21 (솔이 스킨은 디자인 v5 개정 반영).
 * 커피 앞치마 · 버섯 우산은 목록에서 빠졌다 (보유분도 마이그레이션 v5에서 정리).
 */
export const SKINS: readonly Skin[] = [
  // 솔이
  { id: 'hat', name: '밀짚모자', category: 'soli', cost: { crops: { potato: 10, sunflower: 3 }, any: 0 } },
  { id: 'band', name: '딸기 머리띠', category: 'soli', cost: { crops: { strawberry: 8 }, any: 0 } },
  { id: 'glasses', name: '동글이 안경', category: 'soli', cost: { crops: { sunflower: 3, strawberry: 2 }, any: 0 } },
  { id: 'ice', name: '하드', category: 'soli', cost: { crops: { strawberry: 4, potato: 3 }, any: 0 } },
  { id: 'net', name: '잠자리채', category: 'soli', cost: { crops: { coffee: 4, sunflower: 2 }, any: 0 } },
  // 마을 건물
  { id: 'scarecrow', name: '허수아비', category: 'building', cost: { crops: { potato: 12 }, any: 0 } },
  { id: 'mailbox', name: '빨간 우체통', category: 'building', cost: { crops: { strawberry: 6 }, any: 6 } },
  { id: 'jars', name: '장독대', category: 'building', cost: { crops: {}, any: 20 } },
  // 이장 소품
  { id: 'goldMega', name: '금색 확성기', category: 'ijang', cost: { crops: {}, any: 15 } },
  { id: 'sunglasses', name: '선글라스', category: 'ijang', cost: { crops: { sunflower: 5 }, any: 5 } },
  { id: 'knitHat', name: '털모자', category: 'ijang', cost: { crops: {}, any: 12 } },
];

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

/** 아직 갖고 있지 않은데 지금 바꿀 수 있는 스킨 (나 탭 분홍 점 · 방송) */
export function exchangeableSkins(inv: Inventory, owned: ReadonlySet<string>): Skin[] {
  return SKINS.filter((s) => !owned.has(s.id) && canAfford(s.cost, inv));
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
