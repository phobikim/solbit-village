import { equip, itemMeta, OUTFIT_ITEMS, STARTS_OWNED } from '../outfit';
import { applyPurchase, checkPurchase, FOR_SALE, OUTFIT_PRICE, priceOf } from '../shop';

const START = new Set(STARTS_OWNED);

describe('옷 가격 (코인, 레벨과 무관한 고정값 [제안])', () => {
  it('모든 옷에 가격이 있고, 모르는 옷은 없다', () => {
    for (const it of OUTFIT_ITEMS) expect(priceOf(it.id)).toBeGreaterThanOrEqual(0);
    expect(priceOf('head-crown')).toBeUndefined();
    expect(Object.keys(OUTFIT_PRICE)).toHaveLength(25);
  });

  it('판매 19벌, 합계 6,100', () => {
    expect(FOR_SALE).toHaveLength(19);
    expect(FOR_SALE.reduce((sum, id) => sum + (priceOf(id) ?? 0), 0)).toBe(6100);
  });

  it('처음 가진 6벌은 가격 0이고, 판매 목록에 없다', () => {
    expect(STARTS_OWNED).toHaveLength(6);
    for (const id of STARTS_OWNED) {
      expect(priceOf(id)).toBe(0);
      expect(FOR_SALE).not.toContain(id);
    }
  });

  it('요청서 가격표와 같다', () => {
    const want: Record<string, number> = {
      'head-catears': 250,
      'head-straw': 250,
      'head-headphones': 400,
      'head-wizard': 600,
      'face-heart': 150,
      'face-star': 150,
      'body-plaid': 300,
      'body-sweater': 300,
      'body-scarf': 250,
      'body-raincoat': 350,
      'body-overall': 350,
      'back-crossbag': 300,
      'back-cape': 500,
      'back-wings': 800,
      'hand-umbrella': 200,
      'hand-book': 200,
      'hand-balloon': 150,
      'feet-sneakers': 250,
      'feet-boots': 350,
    };
    for (const [id, p] of Object.entries(want)) expect(priceOf(id)).toBe(p);
  });
});

describe('살 수 있는가', () => {
  it('코인이 충분하면 가격을 돌려준다', () => {
    expect(checkPurchase(300, START, 'body-sweater')).toEqual({ ok: true, price: 300 });
  });
  it('모자라면 모자란 만큼', () => {
    expect(checkPurchase(380, START, 'back-wings')).toEqual({ ok: false, reason: 'short', lack: 420 });
  });
  it('이미 가진 옷 · 모르는 옷은 살 수 없다', () => {
    expect(checkPurchase(9999, START, 'head-beanie')).toMatchObject({ ok: false, reason: 'owned' });
    expect(checkPurchase(9999, START, 'head-crown')).toMatchObject({ ok: false, reason: 'unknown' });
  });
});

describe('산 뒤의 상태', () => {
  it('코인 차감 + 보유 추가 + 그 슬롯에 바로 착용', () => {
    const before = { coin: 680, owned: START, equipped: equip({}, 'body-hoodie', START) };
    const after = applyPurchase(before, 'body-sweater');
    expect(after).not.toBeNull();
    expect(after!.coin).toBe(380);
    expect(after!.owned.has('body-sweater')).toBe(true);
    expect(after!.equipped.body).toBe('body-sweater');
    expect(itemMeta('body-sweater')?.slot).toBe('body');
  });

  it('다른 슬롯에 입은 옷은 그대로 둔다', () => {
    const before = { coin: 1000, owned: START, equipped: { head: 'head-beanie', body: 'body-hoodie' } };
    expect(applyPurchase(before, 'feet-boots')!.equipped).toEqual({ head: 'head-beanie', body: 'body-hoodie', feet: 'feet-boots' });
  });

  it('모자라거나 이미 가졌으면 null — 원본은 그대로', () => {
    const before = { coin: 100, owned: START, equipped: {} };
    expect(applyPurchase(before, 'back-wings')).toBeNull();
    expect(applyPurchase(before, 'head-beanie')).toBeNull();
    expect(before.coin).toBe(100);
    expect(START.size).toBe(6);
  });
});
