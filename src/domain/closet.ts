// 옷장 탭의 규칙: 하단 액션 버튼 상태 · 미리보기. 화면은 이 결과를 그리기만 한다 (CLAUDE.md 규칙 9).
// 옷은 장식일 뿐이다 — 코인이 모자라도 벌은 없고, 미리보기는 저장하지 않는다.

import { itemMeta, itemsOfSlot, STARTS_OWNED, type Equipped, type OutfitItemMeta, type Slot } from './outfit';
import { priceOf } from './shop';
import { shortBy } from './wallet';

export type ActionState =
  /** 안 가진 옷, 코인 충분: "구매하기 · 가격" → 바로 사고 입는다 */
  | { kind: 'buy'; price: number }
  /** 안 가진 옷, 코인 모자람: "코인이 모자라요 · -N" (비활성) */
  | { kind: 'short'; price: number; lack: number }
  /** 가진 옷, 안 입는 중: "갈아입기" */
  | { kind: 'equip' }
  /** 지금 입는 중: "착용 중 ✓" (비활성) + 벗기 */
  | { kind: 'equipped' };

type ActionCtx = { owned: ReadonlySet<string>; equipped: Equipped; coins: number };

/** 선택한 옷에 맞는 하단 버튼 상태. 모르는 옷이면 null */
export function getActionState(item: Pick<OutfitItemMeta, 'id' | 'slot'>, ctx: ActionCtx): ActionState | null {
  const price = priceOf(item.id);
  if (price === undefined || !itemMeta(item.id)) return null;
  if (!ctx.owned.has(item.id)) {
    const lack = shortBy(ctx.coins, price);
    return lack > 0 ? { kind: 'short', price, lack } : { kind: 'buy', price };
  }
  return ctx.equipped[item.slot] === item.id ? { kind: 'equipped' } : { kind: 'equip' };
}

/** 슬롯별 미리보기: 입고 있는 것과 다른 옷만 들어 있다 */
export type PreviewBySlot = Partial<Record<Slot, string>>;

export type ClosetPick = { selected: string | null; preview: PreviewBySlot };

export const EMPTY_PICK: ClosetPick = { selected: null, preview: {} };

function withSlot(preview: PreviewBySlot, slot: Slot, id: string | null, equipped: Equipped): PreviewBySlot {
  const next = { ...preview };
  if (id === null || equipped[slot] === id) delete next[slot];
  else next[slot] = id;
  return next;
}

/** 칸을 눌렀다: 선택하고 그 슬롯 미리보기에 입힌다. 이미 선택한 칸이면 선택 해제 + 그 슬롯 미리보기 복원 */
export function pickItem(state: ClosetPick, itemId: string, equipped: Equipped): ClosetPick {
  const meta = itemMeta(itemId);
  if (!meta) return state;
  if (state.selected === itemId) return { selected: null, preview: withSlot(state.preview, meta.slot, null, equipped) };
  return { selected: itemId, preview: withSlot(state.preview, meta.slot, itemId, equipped) };
}

/** 슬롯 탭을 바꿨다: 선택은 풀고, 다른 슬롯 미리보기는 그대로 둔다 */
export function changeSlot(state: ClosetPick): ClosetPick {
  return state.selected === null ? state : { ...state, selected: null };
}

/** 실제 착용(저장된 값)이 바뀐 뒤 미리보기를 맞춘다: 착용과 같아진 칸은 미리보기에서 뺀다 */
export function syncPreview(preview: PreviewBySlot, equipped: Equipped): PreviewBySlot {
  const next: PreviewBySlot = {};
  for (const [slot, id] of Object.entries(preview) as [Slot, string][]) if (equipped[slot] !== id) next[slot] = id;
  return next;
}

/** 미리보기 카드에 입힐 모습: 입고 있는 옷 위에 미리보기를 얹는다 (원본은 건드리지 않는다) */
export function composePreview(equipped: Equipped, preview: PreviewBySlot): Equipped {
  return { ...equipped, ...preview };
}

/** "원래대로" 칩을 보일지 — 미리보기가 실제 착용과 다를 때 */
export function isPreviewDirty(equipped: Equipped, preview: PreviewBySlot): boolean {
  return (Object.entries(preview) as [Slot, string][]).some(([slot, id]) => equipped[slot] !== id);
}

/** 그리드에 보일 옷: 슬롯의 모든 옷. 순서는 고정 — 처음 가진 옷 먼저, 그다음 가격 낮은 순 (구매해도 바뀌지 않는다) */
export function gridItems(slot: Slot): OutfitItemMeta[] {
  const start = new Set(STARTS_OWNED);
  const rank = (id: string) => (start.has(id) ? -1 : priceOf(id) ?? Number.MAX_SAFE_INTEGER);
  return itemsOfSlot(slot)
    .map((it, i) => ({ it, i }))
    .sort((a, b) => rank(a.it.id) - rank(b.it.id) || a.i - b.i)
    .map((x) => x.it);
}
