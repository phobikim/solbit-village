// 솔이 옷 가게 규칙. 순수 TS. 옷은 장식일 뿐이다 — 지수 · 레벨 · 작물 어떤 규칙에도 영향을 주지 않는다.
// 사는 일은 코인을 내고 옷을 얻는 것뿐이고, 사고 나서도 잃거나 시드는 것은 없다 (보유는 줄지 않는다).

import { equip, isKnownItem, isOwned, itemMeta, OUTFIT_ITEMS, type Equipped } from './outfit';
import { shortBy } from './wallet';

/**
 * 옷 가격 (코인). 레벨이 올라도 고정. 0 = 처음부터 가진 옷.
 * TODO([제안]): 아래 가격은 시안(옷장 TURN 28) 기준 가안이다. 마을 레벨 곡선 · 월급 확정 후 재검토.
 */
export const OUTFIT_PRICE: Readonly<Record<string, number>> = {
  'head-beanie': 0,
  'head-catears': 250,
  'head-wizard': 600,
  'head-straw': 250,
  'head-headphones': 400,
  'face-glasses': 0,
  'face-heart': 150,
  'face-star': 150,
  'body-hoodie': 0,
  'body-plaid': 300,
  'body-sweater': 300,
  'body-scarf': 250,
  'body-raincoat': 350,
  'body-overall': 350,
  'back-bundle': 0,
  'back-crossbag': 300,
  'back-cape': 500,
  'back-wings': 800,
  'hand-umbrella': 200,
  'hand-coffee': 0,
  'hand-book': 200,
  'hand-balloon': 150,
  'feet-slippers': 0,
  'feet-sneakers': 250,
  'feet-boots': 350,
};

/** 가격. 모르는 옷이면 undefined */
export const priceOf = (itemId: string): number | undefined => OUTFIT_PRICE[itemId];

/** 가게에서 파는 옷 (가격이 0보다 큰 것) — 19벌 */
export const FOR_SALE: readonly string[] = OUTFIT_ITEMS.filter((i) => (OUTFIT_PRICE[i.id] ?? 0) > 0).map((i) => i.id);

export type PurchaseFail = 'unknown' | 'owned' | 'short';
export type PurchaseCheck = { ok: true; price: number } | { ok: false; reason: PurchaseFail; lack: number };

/** 이 옷을 지금 살 수 있는가 */
export function checkPurchase(coin: number, owned: ReadonlySet<string>, itemId: string): PurchaseCheck {
  const price = OUTFIT_PRICE[itemId];
  if (price === undefined || !isKnownItem(itemId)) return { ok: false, reason: 'unknown', lack: 0 };
  if (isOwned(owned, itemId)) return { ok: false, reason: 'owned', lack: 0 };
  const lack = shortBy(coin, price);
  return lack > 0 ? { ok: false, reason: 'short', lack } : { ok: true, price };
}

export type ShopState = { coin: number; owned: ReadonlySet<string>; equipped: Equipped };

/**
 * 산 뒤의 상태: 코인 차감 + 보유 추가 + 그 슬롯에 바로 착용. 살 수 없으면 null.
 * 새 객체를 돌려준다 (원본은 바꾸지 않는다).
 */
export function applyPurchase(state: ShopState, itemId: string): ShopState | null {
  const check = checkPurchase(state.coin, state.owned, itemId);
  if (!check.ok || !itemMeta(itemId)) return null;
  const owned = new Set(state.owned).add(itemId);
  return { coin: state.coin - check.price, owned, equipped: equip(state.equipped, itemId, owned) };
}
