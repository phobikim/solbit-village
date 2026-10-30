// 착용 상태의 단일 출처(zustand store): 갈아입기 · 벗기 · 구매가 store에 바로 반영되고 DB에도 저장되는지.
// 메인 · 나 탭 · 꾸미기가 모두 이 store를 구독하므로, 여기가 바뀌면 앱을 다시 켜지 않아도 화면이 바뀐다.

import { STARTS_OWNED } from '../../domain/outfit';

const mockSetSlot = jest.fn((..._a: unknown[]) => Promise.resolve());
const mockPurchase = jest.fn();
const mockDb = { owned: new Set<string>(STARTS_OWNED), equipped: {} as Record<string, string> };

jest.mock('../../data/outfit', () => ({
  seedOwned: jest.fn(() => Promise.resolve()),
  getOwned: jest.fn(() => Promise.resolve(new Set(mockDb.owned))),
  getEquipped: jest.fn(() => Promise.resolve({ ...mockDb.equipped })),
  setSlot: (...a: unknown[]) => mockSetSlot(...a),
}));
jest.mock('../../data/shop', () => ({ purchaseOutfit: (...a: unknown[]) => mockPurchase(...a) }));
jest.mock('../../data/walletTx', () => ({
  PurchaseError: class PurchaseError extends Error {
    reason: string;
    lack: number;
    constructor(reason: string, lack: number) {
      super(reason);
      this.reason = reason;
      this.lack = lack;
    }
  },
}));
jest.mock('../../data/wallet', () => ({ getWallet: jest.fn(() => Promise.resolve({ coin: 0, heung: 0 })) }));

import { useOutfit } from '../outfit';
import { useWallet } from '../wallet';

beforeEach(async () => {
  mockSetSlot.mockClear();
  mockPurchase.mockReset();
  mockDb.owned = new Set(STARTS_OWNED);
  mockDb.equipped = { head: 'head-beanie' };
  useOutfit.setState({ owned: new Set(), equipped: {}, loaded: false });
  await useOutfit.getState().load();
});

describe('착용 상태 store', () => {
  it('앱을 켤 때 DB에서 입은 옷을 불러온다', () => {
    expect(useOutfit.getState().loaded).toBe(true);
    expect(useOutfit.getState().equipped).toEqual({ head: 'head-beanie' });
  });

  it('갈아입으면 store가 바로 바뀌고 그 슬롯을 DB에 저장한다 (구독하는 화면이 바로 바뀐다)', () => {
    const seen: unknown[] = [];
    const off = useOutfit.subscribe((s) => seen.push(s.equipped));
    useOutfit.getState().toggle('body-hoodie');
    off();
    expect(useOutfit.getState().equipped).toEqual({ head: 'head-beanie', body: 'body-hoodie' });
    expect(seen).toHaveLength(1);
    expect(mockSetSlot).toHaveBeenCalledWith('body', 'body-hoodie');
  });

  it('입은 옷을 다시 누르면 벗고, 벗은 것도 저장한다', () => {
    useOutfit.getState().toggle('head-beanie');
    expect(useOutfit.getState().equipped).toEqual({});
    expect(mockSetSlot).toHaveBeenCalledWith('head', null);
  });

  it('안 가진 옷은 입을 수 없다', () => {
    useOutfit.getState().toggle('head-wizard');
    expect(useOutfit.getState().equipped).toEqual({ head: 'head-beanie' });
  });

  it('구매하면 보유 · 착용이 store에 들어오고 코인도 갱신된다', async () => {
    mockPurchase.mockResolvedValue({
      wallet: { coin: 350, heung: 0 },
      owned: new Set([...STARTS_OWNED, 'head-straw']),
      equipped: { head: 'head-straw' },
    });
    const r = await useOutfit.getState().buy('head-straw');
    expect(r).toEqual({ ok: true });
    expect(useOutfit.getState().equipped).toEqual({ head: 'head-straw' });
    expect(useOutfit.getState().owned.has('head-straw')).toBe(true);
    expect(useWallet.getState().coin).toBe(350);
  });

  it('구매에 실패하면 store가 그대로다', async () => {
    mockPurchase.mockRejectedValue(new Error('boom'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const r = await useOutfit.getState().buy('head-straw');
    warn.mockRestore();
    expect(r).toMatchObject({ ok: false, reason: 'error' });
    expect(useOutfit.getState().equipped).toEqual({ head: 'head-beanie' });
  });
});
