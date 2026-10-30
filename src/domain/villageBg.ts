// 마을 배경(꾸미기 · 마을). 순수 TS (React/RN import 금지).
// 배경은 메인 장면의 테마다 (ui/scene/theme.ts). 장식일 뿐이다 — 지수 · 레벨 · 작물 어떤 규칙에도 영향을 주지 않는다 (CLAUDE.md 규칙 1·4).
// 규칙은 솔이 옷과 같다: 칸을 누르면 미리보기만 하고(저장 안 함), 사면 바로 적용하고, 보유는 줄지 않는다.
// 옷과 다른 점 하나: 배경에는 "벗기"가 없다. 하나는 늘 적용 중이고, 되돌리려면 "기본"을 고른다.

import type { ActionState } from './closet';
import { shortBy } from './wallet';

/** 꾸미기 · 마을의 카테고리. 지금은 배경 하나뿐이다. 소품 · 이장은 나중에 다시 붙일 수 있게 목록 구조로 둔다 (범위 밖) */
export type VillageCategory = 'bg';
export const VILLAGE_CATEGORIES: readonly VillageCategory[] = ['bg'];

export type VillageBgMeta = { id: string; category: 'bg'; name: string };

/** 시작 보유이자 처음 적용되는 배경. 지금의 낮 · 밤 자동 전환 장면 */
export const BG_BASE = 'base';

/** 배경 7종 (시안 순서) */
export const BG_ITEMS: readonly VillageBgMeta[] = [
  { id: 'base', category: 'bg', name: '기본' },
  { id: 'spring', category: 'bg', name: '벚꽃 봄' },
  { id: 'autumn', category: 'bg', name: '단풍 가을' },
  { id: 'winter', category: 'bg', name: '눈 겨울' },
  { id: 'sunset', category: 'bg', name: '노을 정원' },
  { id: 'night', category: 'bg', name: '별밤' },
  { id: 'summer', category: 'bg', name: '푸른 여름' },
];

/**
 * 배경 한 장 가격(코인). 기본은 무료.
 * TODO([제안]): 시안 샘플 1,500코인 — 월급 Lv1 100 기준 15일 치. 코인 경제(월급 · 가격)가 정해지면 여기만 바꾼다.
 */
export const BG_PRICE_PAID = 1500;
export const BG_PRICE: Readonly<Record<string, number>> = Object.fromEntries(
  BG_ITEMS.map((b) => [b.id, b.id === BG_BASE ? 0 : BG_PRICE_PAID]),
);

const BY_ID: ReadonlyMap<string, VillageBgMeta> = new Map(BG_ITEMS.map((b) => [b.id, b]));

export const bgMeta = (id: string): VillageBgMeta | undefined => BY_ID.get(id);
export const isKnownBg = (id: string): boolean => BY_ID.has(id);
export const priceOfBg = (id: string): number | undefined => BG_PRICE[id];
export const bgName = (id: string): string => BY_ID.get(id)?.name ?? id;

/** 카테고리의 배경 목록 (그리드 순서 = 시안 순서. 구매해도 바뀌지 않는다) */
export const bgItemsOf = (category: VillageCategory): readonly VillageBgMeta[] => BG_ITEMS.filter((b) => b.category === category);

/** 저장소에서 읽은 보유 id → 보유 집합. 모르는 id는 뺀다. 기본은 늘 가진다 (시작 보유) */
export function sanitizeBgOwned(ids: Iterable<string>): Set<string> {
  const out = new Set<string>([BG_BASE]);
  for (const id of ids) if (isKnownBg(id)) out.add(id);
  return out;
}

/** 저장소에서 읽은 적용 중 id. 모르거나 안 가진 배경이면 기본 */
export function sanitizeBgEquipped(id: string | null | undefined, owned: ReadonlySet<string>): string {
  return id && isKnownBg(id) && owned.has(id) ? id : BG_BASE;
}

export type BgPurchaseFail = 'unknown' | 'owned' | 'short';
export type BgPurchaseCheck = { ok: true; price: number } | { ok: false; reason: BgPurchaseFail; lack: number };

/** 이 배경을 지금 살 수 있는가 */
export function checkBgPurchase(coin: number, owned: ReadonlySet<string>, id: string): BgPurchaseCheck {
  const price = BG_PRICE[id];
  if (price === undefined || !isKnownBg(id)) return { ok: false, reason: 'unknown', lack: 0 };
  if (owned.has(id)) return { ok: false, reason: 'owned', lack: 0 };
  const lack = shortBy(coin, price);
  return lack > 0 ? { ok: false, reason: 'short', lack } : { ok: true, price };
}

export type BgState = { coin: number; owned: ReadonlySet<string>; equipped: string };

/** 산 뒤의 상태: 코인 차감 + 보유 추가 + 바로 적용. 살 수 없으면 null. 새 객체를 돌려준다 */
export function applyBgPurchase(state: BgState, id: string): BgState | null {
  const check = checkBgPurchase(state.coin, state.owned, id);
  if (!check.ok) return null;
  return { coin: state.coin - check.price, owned: new Set(state.owned).add(id), equipped: id };
}

/** 선택한 배경에 맞는 하단 버튼 상태. 옷과 같은 모양이고 "벗기"만 없다 (equipped는 비활성 "착용 중"). 모르는 배경이면 null */
export function getBgActionState(id: string, ctx: { owned: ReadonlySet<string>; equipped: string; coins: number }): ActionState | null {
  const price = priceOfBg(id);
  if (price === undefined || !isKnownBg(id)) return null;
  if (!ctx.owned.has(id)) {
    const lack = shortBy(ctx.coins, price);
    return lack > 0 ? { kind: 'short', price, lack } : { kind: 'buy', price };
  }
  return ctx.equipped === id ? { kind: 'equipped' } : { kind: 'equip' };
}

/** 마을 모드의 선택 · 미리보기. 미리보기는 지금 적용 중인 배경과 다를 때만 들어 있다 (저장하지 않는다) */
export type BgPick = { selected: string | null; preview: string | null };

export const EMPTY_BG_PICK: BgPick = { selected: null, preview: null };

/** 칸을 눌렀다: 선택하고 미리보기에 반영. 이미 선택한 칸이면 해제 */
export function pickBg(state: BgPick, id: string, equipped: string): BgPick {
  if (!isKnownBg(id)) return state;
  if (state.selected === id) return EMPTY_BG_PICK;
  return { selected: id, preview: id === equipped ? null : id };
}

/** 실제 적용이 바뀐 뒤 미리보기를 맞춘다: 적용과 같아졌으면 미리보기를 뺀다 */
export function syncBgPreview(preview: string | null, equipped: string): string | null {
  return preview === equipped ? null : preview;
}

/** 미리보기 카드 · 썸네일에 그릴 배경: 미리보기가 있으면 그것, 없으면 적용 중인 것 */
export const shownBg = (equipped: string, preview: string | null): string => preview ?? equipped;

/** "원래대로" 칩을 보일지 */
export const isBgPreviewDirty = (equipped: string, preview: string | null): boolean => preview !== null && preview !== equipped;
