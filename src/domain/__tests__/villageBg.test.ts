import {
  applyBgPurchase,
  BG_BASE,
  BG_ITEMS,
  BG_PRICE,
  BG_PRICE_PAID,
  bgItemsOf,
  checkBgPurchase,
  EMPTY_BG_PICK,
  getBgActionState,
  isBgPreviewDirty,
  pickBg,
  sanitizeBgEquipped,
  sanitizeBgOwned,
  shownBg,
  syncBgPreview,
  VILLAGE_CATEGORIES,
} from '../villageBg';

const owned = (...ids: string[]) => new Set([BG_BASE, ...ids]);

describe('마을 배경 목록 · 가격', () => {
  it('시안 순서의 7종, 기본이 맨 앞', () => {
    expect(BG_ITEMS.map((b) => b.id)).toEqual(['base', 'spring', 'autumn', 'winter', 'sunset', 'night', 'summer']);
    expect(BG_ITEMS.map((b) => b.name)).toEqual(['기본', '벚꽃 봄', '단풍 가을', '눈 겨울', '노을 정원', '별밤', '푸른 여름']);
  });
  it('기본은 무료, 나머지 6종은 같은 가격 상수 (BG_PRICE_PAID [제안] 1,500)', () => {
    expect(BG_PRICE.base).toBe(0);
    expect(BG_PRICE_PAID).toBe(1500);
    for (const b of BG_ITEMS.filter((x) => x.id !== 'base')) expect(BG_PRICE[b.id]).toBe(BG_PRICE_PAID);
  });
  it('카테고리는 배경 하나, 목록 구조로 되어 있다', () => {
    expect(VILLAGE_CATEGORIES).toEqual(['bg']);
    expect(bgItemsOf('bg')).toHaveLength(7);
  });
});

describe('보유 · 적용 정리', () => {
  it('시작 보유는 기본뿐이고, 모르는 id는 뺀다', () => {
    expect([...sanitizeBgOwned([])]).toEqual(['base']);
    expect([...sanitizeBgOwned(['spring', 'volcano'])].sort()).toEqual(['base', 'spring']);
  });
  it('적용 중인 배경이 없거나 모르거나 안 가졌으면 기본', () => {
    expect(sanitizeBgEquipped(null, owned())).toBe('base');
    expect(sanitizeBgEquipped('volcano', owned('volcano'))).toBe('base');
    expect(sanitizeBgEquipped('spring', owned())).toBe('base');
    expect(sanitizeBgEquipped('spring', owned('spring'))).toBe('spring');
  });
});

describe('구매', () => {
  it('코인이 충분하면 살 수 있다 (가격 그대로)', () => {
    expect(checkBgPurchase(1500, owned(), 'spring')).toEqual({ ok: true, price: 1500 });
  });
  it('코인이 모자라면 모자란 만큼을 알려 준다 (벌 없음)', () => {
    expect(checkBgPurchase(1400, owned(), 'spring')).toEqual({ ok: false, reason: 'short', lack: 100 });
  });
  it('이미 가졌거나 모르는 배경은 살 수 없다', () => {
    expect(checkBgPurchase(9999, owned('spring'), 'spring')).toMatchObject({ ok: false, reason: 'owned' });
    expect(checkBgPurchase(9999, owned(), 'base')).toMatchObject({ ok: false, reason: 'owned' });
    expect(checkBgPurchase(9999, owned(), 'volcano')).toMatchObject({ ok: false, reason: 'unknown' });
  });
  it('산 뒤: 코인 차감 + 보유 추가 + 바로 적용, 원본은 그대로', () => {
    const before = { coin: 2000, owned: owned(), equipped: 'base' };
    const after = applyBgPurchase(before, 'autumn')!;
    expect(after.coin).toBe(500);
    expect(after.equipped).toBe('autumn');
    expect(after.owned.has('autumn')).toBe(true);
    expect(before.owned.has('autumn')).toBe(false);
    expect(applyBgPurchase({ ...before, coin: 10 }, 'autumn')).toBeNull();
  });
});

describe('하단 버튼 상태 (옷과 같은 규칙, 벗기 없음)', () => {
  const ctx = (coins: number, have: string[], equipped = 'base') => ({ owned: owned(...have), equipped, coins });
  it('미보유 + 충분: 구매하기', () => expect(getBgActionState('spring', ctx(1500, []))).toEqual({ kind: 'buy', price: 1500 }));
  it('미보유 + 부족: 코인이 모자라요', () => expect(getBgActionState('spring', ctx(1000, []))).toEqual({ kind: 'short', price: 1500, lack: 500 }));
  it('보유 + 미적용: 갈아입기', () => expect(getBgActionState('spring', ctx(0, ['spring']))).toEqual({ kind: 'equip' }));
  it('적용 중: 착용 중 (기본도 마찬가지 — 벗는 길은 없고 기본을 고르면 된다)', () => {
    expect(getBgActionState('spring', ctx(0, ['spring'], 'spring'))).toEqual({ kind: 'equipped' });
    expect(getBgActionState('base', ctx(0, []))).toEqual({ kind: 'equipped' });
    expect(getBgActionState('base', ctx(0, ['spring'], 'spring'))).toEqual({ kind: 'equip' });
  });
  it('모르는 배경이면 null', () => expect(getBgActionState('volcano', ctx(0, []))).toBeNull());
});

describe('미리보기 (저장하지 않는다)', () => {
  it('칸을 누르면 미리보기에 반영, 다시 누르면 해제', () => {
    const a = pickBg(EMPTY_BG_PICK, 'spring', 'base');
    expect(a).toEqual({ selected: 'spring', preview: 'spring' });
    expect(shownBg('base', a.preview)).toBe('spring');
    expect(isBgPreviewDirty('base', a.preview)).toBe(true);
    expect(pickBg(a, 'spring', 'base')).toEqual(EMPTY_BG_PICK);
  });
  it('지금 적용 중인 배경을 누르면 선택만 되고 미리보기는 비어 있다', () => {
    const a = pickBg(EMPTY_BG_PICK, 'base', 'base');
    expect(a).toEqual({ selected: 'base', preview: null });
    expect(isBgPreviewDirty('base', a.preview)).toBe(false);
  });
  it('적용이 바뀌면 같아진 미리보기를 뺀다', () => {
    expect(syncBgPreview('spring', 'spring')).toBeNull();
    expect(syncBgPreview('spring', 'base')).toBe('spring');
  });
});
