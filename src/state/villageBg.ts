// 마을 배경 스토어. owned(가진 배경) · equipped(적용 중인 배경)는 DB 값이고, 메인 장면이 이 값을 구독한다.
// 꾸미기에서 사거나 갈아입으면 DB와 이 스토어를 바로 바꾼다 → 앱을 다시 켜지 않아도 메인이 바뀐다.
// 미리보기(칸을 눌러 본 모습)는 화면 상태이고 여기에 두지 않는다 (저장 안 함).

import { create } from 'zustand';

import { getBgEquipped, getBgOwned, purchaseVillageBg, PurchaseError, setBgEquipped } from '../data/villageBg';
import type { BgPurchaseFail } from '../domain/villageBg';
import { BG_BASE } from '../domain/villageBg';
import { useWallet } from './wallet';

export type BgBuyResult = { ok: true } | { ok: false; reason: BgPurchaseFail | 'error'; lack: number };

type VillageBgState = {
  owned: ReadonlySet<string>;
  equipped: string;
  loaded: boolean;
  load: () => Promise<void>;
  /** 가진 배경을 적용. 바로 저장 */
  equip: (id: string) => void;
  /** 배경 사기: 한 트랜잭션 (코인 차감 + 보유 + 적용). 실패하면 아무것도 바뀌지 않는다 */
  buy: (id: string) => Promise<BgBuyResult>;
};

export const useVillageBg = create<VillageBgState>((set, get) => ({
  owned: new Set([BG_BASE]),
  equipped: BG_BASE,
  loaded: false,
  async load() {
    const owned = await getBgOwned();
    const equipped = await getBgEquipped(owned);
    set({ owned, equipped, loaded: true });
  },
  equip(id) {
    if (!get().owned.has(id)) return;
    set({ equipped: id });
    setBgEquipped(id).catch((e) => {
      console.warn('[villageBg] save failed', e);
      getBgEquipped().then((saved) => set({ equipped: saved })).catch(() => {});
    });
  },
  async buy(id) {
    try {
      const r = await purchaseVillageBg(id);
      useWallet.getState().set(r.wallet);
      set({ owned: r.owned, equipped: r.equipped });
      return { ok: true };
    } catch (e) {
      if (e instanceof PurchaseError) return { ok: false, reason: e.reason as BgPurchaseFail, lack: e.lack };
      console.warn('[villageBg] buy failed', e);
      return { ok: false, reason: 'error', lack: 0 };
    }
  },
}));
