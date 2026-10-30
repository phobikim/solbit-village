import {
  OUTFIT_ITEMS,
  SLOTS,
  SPLIT_ITEMS,
  STARTS_OWNED,
  equip,
  isKnownItem,
  isOwned,
  itemMeta,
  itemsOfSlot,
  outfitLayers,
  sanitizeEquipped,
  toggleWear,
  unequip,
  type Equipped,
} from '../outfit';

const ALL = new Set(OUTFIT_ITEMS.map((i) => i.id));

describe('옷장 카탈로그', () => {
  it('아이템 25개, 슬롯별 5·3·6·4·4·3', () => {
    expect(OUTFIT_ITEMS).toHaveLength(25);
    expect(SLOTS.map((s) => itemsOfSlot(s).length)).toEqual([5, 3, 6, 4, 4, 3]);
  });

  it('id는 슬롯-이름이고 겹치지 않는다', () => {
    const ids = OUTFIT_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(25);
    for (const i of OUTFIT_ITEMS) expect(i.id.startsWith(`${i.slot}-`)).toBe(true);
  });

  it('표시 순서는 시안(옷장 TURN 28)과 같다', () => {
    expect(itemsOfSlot('head').map((i) => i.id)).toEqual(['head-beanie', 'head-catears', 'head-wizard', 'head-straw', 'head-headphones']);
    expect(itemsOfSlot('body').map((i) => i.id)).toEqual(['body-hoodie', 'body-plaid', 'body-sweater', 'body-scarf', 'body-raincoat', 'body-overall']);
    expect(itemsOfSlot('feet').map((i) => i.id)).toEqual(['feet-slippers', 'feet-sneakers', 'feet-boots']);
  });

  it('앞뒤가 갈리는 것은 후드티 · 망토 · 크로스백', () => {
    expect([...SPLIT_ITEMS].sort()).toEqual(['back-cape', 'back-crossbag', 'body-hoodie']);
  });

  it('처음부터 가진 옷은 6벌 (비니 · 안경 · 후드티 · 보따리 · 커피 · 슬리퍼), 슬롯마다 한 벌', () => {
    expect([...STARTS_OWNED].sort()).toEqual(['back-bundle', 'body-hoodie', 'face-glasses', 'feet-slippers', 'hand-coffee', 'head-beanie']);
    expect(new Set(STARTS_OWNED.map((id) => itemMeta(id)?.slot)).size).toBe(6);
  });
});

describe('입기 · 벗기', () => {
  it('같은 슬롯은 바뀐다', () => {
    const a = equip({}, 'head-straw', ALL);
    expect(equip(a, 'head-beanie', ALL)).toEqual({ head: 'head-beanie' });
  });

  it('다른 슬롯은 함께 입는다', () => {
    let e: Equipped = {};
    e = equip(e, 'head-straw', ALL);
    e = equip(e, 'body-scarf', ALL);
    e = equip(e, 'feet-boots', ALL);
    expect(e).toEqual({ head: 'head-straw', body: 'body-scarf', feet: 'feet-boots' });
  });

  it('원본을 바꾸지 않는다', () => {
    const before: Equipped = { head: 'head-straw' };
    equip(before, 'head-beanie', ALL);
    unequip(before, 'head');
    expect(before).toEqual({ head: 'head-straw' });
  });

  it('한 슬롯만 벗는다', () => {
    expect(unequip({ head: 'head-straw', body: 'body-scarf' }, 'head')).toEqual({ body: 'body-scarf' });
  });

  it('벗은 슬롯을 또 벗어도 그대로', () => {
    expect(unequip({ body: 'body-scarf' }, 'head')).toEqual({ body: 'body-scarf' });
  });

  it('눌러서 입기/벗기: 입은 옷을 다시 누르면 벗고, 같은 슬롯의 다른 옷을 누르면 바뀐다', () => {
    const a = toggleWear({}, 'head-beanie', ALL);
    expect(a).toEqual({ head: 'head-beanie' });
    expect(toggleWear(a, 'head-straw', ALL)).toEqual({ head: 'head-straw' });
    expect(toggleWear(a, 'head-beanie', ALL)).toEqual({});
  });

  it('가지고 있지 않은 옷은 눌러도 입혀지지 않는다', () => {
    expect(toggleWear({}, 'head-wizard', new Set(STARTS_OWNED))).toEqual({});
  });

  it('모르는 id는 무시한다', () => {
    const before: Equipped = { head: 'head-straw' };
    expect(equip(before, 'head-nope', ALL)).toEqual(before);
    expect(equip(before, '', ALL)).toEqual(before);
    expect(isKnownItem('head-nope')).toBe(false);
  });

  it('가지고 있지 않은 아이템은 입지 못한다', () => {
    const owned = new Set(['head-straw']);
    expect(isOwned(owned, 'head-beanie')).toBe(false);
    expect(equip({ head: 'head-straw' }, 'head-beanie', owned)).toEqual({ head: 'head-straw' });
    expect(equip({}, 'body-scarf', owned)).toEqual({});
  });
});

describe('저장된 상태 고치기', () => {
  it('모르는 id · 슬롯이 다른 id · 없는 아이템은 뺀다', () => {
    const owned = new Set(['head-straw', 'body-scarf']);
    expect(
      sanitizeEquipped({ head: 'head-straw', body: 'head-beanie', face: 'face-star', back: 'zzz', hand: 'hand-book' }, owned),
    ).toEqual({ head: 'head-straw' });
  });

  it('모르는 슬롯 이름은 무시한다', () => {
    expect(sanitizeEquipped({ tail: 'head-straw' }, ALL)).toEqual({});
  });
});

describe('겹침 순서', () => {
  const kinds = (e: Equipped) => outfitLayers(e).map((l) => (l.kind === 'soli' ? 'soli' : `${l.id}:${l.part}`));

  it('아무것도 안 입으면 솔이뿐', () => {
    expect(kinds({})).toEqual(['soli']);
  });

  it('전부 입으면 시안 순서: 등 back → 후드 back → 솔이 → 발 → 몸 → 얼굴 → 머리 → 등 front → 손', () => {
    expect(
      kinds({ head: 'head-wizard', face: 'face-heart', body: 'body-hoodie', back: 'back-cape', hand: 'hand-book', feet: 'feet-boots' }),
    ).toEqual([
      'back-cape:back',
      'body-hoodie:back',
      'soli',
      'feet-boots:single',
      'body-hoodie:front',
      'face-heart:single',
      'head-wizard:single',
      'back-cape:front',
      'hand-book:single',
    ]);
  });

  it('앞뒤가 안 갈리는 등 아이템(날개 · 보따리)은 솔이 뒤에 깔린다', () => {
    expect(kinds({ back: 'back-wings', head: 'head-straw' })).toEqual(['back-wings:single', 'soli', 'head-straw:single']);
    expect(kinds({ back: 'back-bundle' })).toEqual(['back-bundle:single', 'soli']);
  });

  it('앞뒤가 안 갈리는 몸 아이템은 솔이 위(발 다음)에 한 장', () => {
    expect(kinds({ body: 'body-scarf', feet: 'feet-boots' })).toEqual(['soli', 'feet-boots:single', 'body-scarf:single']);
  });

  it('슬롯과 다른 id가 들어 있어도 그리지 않는다', () => {
    expect(kinds({ head: 'body-scarf', hand: 'zzz' })).toEqual(['soli']);
  });
});
