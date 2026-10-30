// 솔이네 옷장 규칙. 순수 TS (React/RN import 금지).
// 옷은 장식일 뿐이다 — 지수 · 레벨 · 작물 · 월급 어떤 규칙에도 영향을 주지 않는다 (CLAUDE.md 규칙 2).
// 한 슬롯에 한 개만 입는다. 지금은 기본 포즈에서만 입힌다. 옷 가게 · 가격은 shop.ts.

export type Slot = 'head' | 'face' | 'body' | 'back' | 'hand' | 'feet';

export type OutfitItemMeta = { id: string; slot: Slot };

/** 슬롯별로 입고 있는 아이템 id. 비어 있으면 벗은 것 */
export type Equipped = Partial<Record<Slot, string>>;

/** 슬롯 탭 순서 (시안 26c~f) */
export const SLOTS: readonly Slot[] = ['head', 'face', 'body', 'back', 'hand', 'feet'];

const item = (slot: Slot, name: string): OutfitItemMeta => ({ id: `${slot}-${name}`, slot });

/** 카탈로그 25개. 표시 순서는 시안(옷장 TURN 28)과 같다 (슬롯별 위에서 아래로). SVG 문자열은 ui/characters/outfits에 있다. */
export const OUTFIT_ITEMS: readonly OutfitItemMeta[] = [
  item('head', 'beanie'),
  item('head', 'catears'),
  item('head', 'wizard'),
  item('head', 'straw'),
  item('head', 'headphones'),
  item('face', 'glasses'),
  item('face', 'heart'),
  item('face', 'star'),
  item('body', 'hoodie'),
  item('body', 'plaid'),
  item('body', 'sweater'),
  item('body', 'scarf'),
  item('body', 'raincoat'),
  item('body', 'overall'),
  item('back', 'bundle'),
  item('back', 'crossbag'),
  item('back', 'cape'),
  item('back', 'wings'),
  item('hand', 'umbrella'),
  item('hand', 'coffee'),
  item('hand', 'book'),
  item('hand', 'balloon'),
  item('feet', 'slippers'),
  item('feet', 'sneakers'),
  item('feet', 'boots'),
];

const BY_ID: ReadonlyMap<string, OutfitItemMeta> = new Map(OUTFIT_ITEMS.map((i) => [i.id, i]));

export const itemMeta = (itemId: string): OutfitItemMeta | undefined => BY_ID.get(itemId);
export const isKnownItem = (itemId: string): boolean => BY_ID.has(itemId);
export const itemsOfSlot = (slot: Slot): readonly OutfitItemMeta[] => OUTFIT_ITEMS.filter((i) => i.slot === slot);

/**
 * 처음부터 가지고 있는 아이템 6벌 (비니 · 안경 · 후드티 · 보따리 · 커피 · 슬리퍼).
 * 나머지 19벌은 옷 가게에서 코인으로 산다 (src/domain/shop.ts).
 * 보유는 줄지 않는다 (CLAUDE.md 규칙 1) — 마이그레이션 · 가져오기는 이미 가진 옷을 지우지 않는다.
 * TODO([제안]): 시작 6벌은 시안 기준 가안. 확정되면 여기만 바꾼다.
 */
export const STARTS_OWNED: readonly string[] = ['head-beanie', 'face-glasses', 'body-hoodie', 'back-bundle', 'hand-coffee', 'feet-slippers'];

export function isOwned(ownedIds: ReadonlySet<string>, itemId: string): boolean {
  return ownedIds.has(itemId);
}

/**
 * 아이템을 입는다. 같은 슬롯에 입고 있던 것은 바뀐다. 모르는 id · 가지고 있지 않은 아이템이면 그대로 둔다.
 * 새 객체를 돌려준다 (원본은 바꾸지 않는다).
 */
export function equip(equipped: Equipped, itemId: string, ownedIds: ReadonlySet<string>): Equipped {
  const meta = BY_ID.get(itemId);
  if (!meta || !isOwned(ownedIds, itemId)) return { ...equipped };
  return { ...equipped, [meta.slot]: itemId };
}

/** 한 슬롯을 벗는다 */
export function unequip(equipped: Equipped, slot: Slot): Equipped {
  const next = { ...equipped };
  delete next[slot];
  return next;
}

/** 눌러서 입기/벗기: 입고 있는 옷을 다시 누르면 벗고, 아니면 그 슬롯에 입는다 (가지고 있는 옷만) */
export function toggleWear(equipped: Equipped, itemId: string, ownedIds: ReadonlySet<string>): Equipped {
  const meta = BY_ID.get(itemId);
  if (!meta || !isOwned(ownedIds, itemId)) return { ...equipped };
  return equipped[meta.slot] === itemId ? unequip(equipped, meta.slot) : equip(equipped, itemId, ownedIds);
}

/**
 * 저장된 착용 상태를 믿을 수 있는 모양으로 고친다: 모르는 id · 슬롯이 다른 id · 가지고 있지 않은 아이템은 뺀다.
 * (백업을 가져온 뒤나 카탈로그가 바뀐 뒤를 위해)
 */
export function sanitizeEquipped(raw: Readonly<Record<string, string>>, ownedIds: ReadonlySet<string>): Equipped {
  const out: Equipped = {};
  for (const slot of SLOTS) {
    const id = raw[slot];
    if (id === undefined) continue;
    const meta = BY_ID.get(id);
    if (meta && meta.slot === slot && isOwned(ownedIds, id)) out[slot] = id;
  }
  return out;
}

// ── 겹침 순서 ───────────────────────────────────────────────────────

/** 앞뒤가 갈리는 아이템 (back / front 2장). 나머지는 1장 */
export const SPLIT_ITEMS: ReadonlySet<string> = new Set(['body-hoodie', 'back-cape', 'back-crossbag']);

export type LayerPart = 'single' | 'back' | 'front';

export type OutfitLayer = { kind: 'soli' } | { kind: 'item'; id: string; part: LayerPart };

/**
 * 아래에서 위로 그리는 순서 (시안 26h):
 * 등 슬롯의 back층 → 몸 슬롯의 back층(후드티) → 솔이 몸 → 발 → 몸 → 얼굴 → 머리 → 등 슬롯의 front층 → 손.
 * 앞뒤가 안 갈리는 등 아이템(날개 · 보따리)은 첫 칸(솔이 뒤)에 놓는다.
 */
export function outfitLayers(equipped: Equipped): OutfitLayer[] {
  const out: OutfitLayer[] = [];
  const back = equipped.back && BY_ID.get(equipped.back)?.slot === 'back' ? equipped.back : undefined;
  const body = equipped.body && BY_ID.get(equipped.body)?.slot === 'body' ? equipped.body : undefined;
  const pick = (slot: Slot): string | undefined => {
    const id = equipped[slot];
    return id && BY_ID.get(id)?.slot === slot ? id : undefined;
  };

  if (back) out.push({ kind: 'item', id: back, part: SPLIT_ITEMS.has(back) ? 'back' : 'single' });
  if (body && SPLIT_ITEMS.has(body)) out.push({ kind: 'item', id: body, part: 'back' });
  out.push({ kind: 'soli' });
  for (const slot of ['feet', 'body', 'face', 'head'] as const) {
    const id = pick(slot);
    if (id) out.push({ kind: 'item', id, part: SPLIT_ITEMS.has(id) ? 'front' : 'single' });
  }
  if (back && SPLIT_ITEMS.has(back)) out.push({ kind: 'item', id: back, part: 'front' });
  const hand = pick('hand');
  if (hand) out.push({ kind: 'item', id: hand, part: 'single' });
  return out;
}
