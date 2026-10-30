// 마을 배경 store: 적용 · 구매가 store에 바로 반영되는지 (메인 장면이 이 store를 구독한다).

const mockSetBg = jest.fn((..._a: unknown[]) => Promise.resolve());
const mockPurchase = jest.fn();
const mockDb = { owned: new Set<string>(['base']), equipped: 'base' };

jest.mock('../../data/villageBg', () => ({
  getBgOwned: jest.fn(() => Promise.resolve(new Set(mockDb.owned))),
  getBgEquipped: jest.fn(() => Promise.resolve(mockDb.equipped)),
  setBgEquipped: (...a: unknown[]) => mockSetBg(...a),
  purchaseVillageBg: (...a: unknown[]) => mockPurchase(...a),
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

import { PurchaseError } from '../../data/villageBg';
import { useVillageBg } from '../villageBg';
import { useWallet } from '../wallet';

beforeEach(async () => {
  mockSetBg.mockClear();
  mockPurchase.mockReset();
  mockDb.owned = new Set(['base', 'spring']);
  mockDb.equipped = 'base';
  useVillageBg.setState({ owned: new Set(['base']), equipped: 'base', loaded: false });
  await useVillageBg.getState().load();
});

describe('마을 배경 store', () => {
  it('앱을 켤 때 가진 배경 · 적용 중인 배경을 불러온다 (처음엔 기본)', () => {
    expect(useVillageBg.getState().loaded).toBe(true);
    expect(useVillageBg.getState().equipped).toBe('base');
    expect(useVillageBg.getState().owned.has('spring')).toBe(true);
  });

  it('가진 배경을 적용하면 store가 바로 바뀌고 저장한다', () => {
    useVillageBg.getState().equip('spring');
    expect(useVillageBg.getState().equipped).toBe('spring');
    expect(mockSetBg).toHaveBeenCalledWith('spring');
  });

  it('안 가진 배경은 적용되지 않는다', () => {
    useVillageBg.getState().equip('winter');
    expect(useVillageBg.getState().equipped).toBe('base');
    expect(mockSetBg).not.toHaveBeenCalled();
  });

  it('구매하면 보유 · 적용이 store에 들어오고 코인도 갱신된다', async () => {
    mockPurchase.mockResolvedValue({ wallet: { coin: 500, heung: 3 }, owned: new Set(['base', 'spring', 'winter']), equipped: 'winter' });
    expect(await useVillageBg.getState().buy('winter')).toEqual({ ok: true });
    expect(useVillageBg.getState().equipped).toBe('winter');
    expect(useVillageBg.getState().owned.has('winter')).toBe(true);
    expect(useWallet.getState()).toMatchObject({ coin: 500, heung: 3 });
  });

  it('코인이 모자라면 모자란 만큼을 돌려주고 store는 그대로다 (벌 없음)', async () => {
    mockPurchase.mockRejectedValue(new PurchaseError('short', 120));
    expect(await useVillageBg.getState().buy('winter')).toEqual({ ok: false, reason: 'short', lack: 120 });
    expect(useVillageBg.getState().equipped).toBe('base');
    expect(useVillageBg.getState().owned.has('winter')).toBe(false);
  });
});
