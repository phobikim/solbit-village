// 솔이네 옷장 스토어. owned(가진 옷) · equipped(입고 있는 옷)는 DB 값이고, 입고 벗기는 누르는 즉시 저장한다.
// 옷 가게에서 "입어 보기"는 화면에서만 입혀 보는 것이라 여기에 두지 않는다 (저장 안 함).

import { create } from 'zustand';

import { getEquipped, getOwned, seedOwned, setSlot } from '../data/outfit';
import { purchaseOutfit } from '../data/shop';
import { PurchaseError } from '../data/walletTx';
import { itemMeta, toggleWear, type Equipped } from '../domain/outfit';
import type { PurchaseFail } from '../domain/shop';
import { useWallet } from './wallet';

export type BuyResult = { ok: true } | { ok: false; reason: PurchaseFail | 'error'; lack: number };

type OutfitState = {
  owned: ReadonlySet<string>;
  equipped: Equipped;
  loaded: boolean;
  /** DB에서 불러온다 (처음 가진 옷은 한 번 넣는다) */
  load: () => Promise<void>;
  /** 칸을 눌렀다: 입고 있으면 벗고, 아니면 입는다. 바로 저장 */
  toggle: (itemId: string) => void;
  /** 옷 사기: 한 트랜잭션 (코인 차감 + 보유 + 그 슬롯에 착용). 실패하면 아무것도 바뀌지 않는다 */
  buy: (itemId: string) => Promise<BuyResult>;
};

export const useOutfit = create<OutfitState>((set, get) => ({
  owned: new Set(),
  equipped: {},
  loaded: false,
  async load() {
    await seedOwned();
    const [owned, equipped] = await Promise.all([getOwned(), getEquipped()]);
    set({ owned, equipped, loaded: true });
  },
  toggle(itemId) {
    const meta = itemMeta(itemId);
    const { owned, equipped } = get();
    if (!meta) return;
    const next = toggleWear(equipped, itemId, owned);
    set({ equipped: next });
    setSlot(meta.slot, next[meta.slot] ?? null).catch((e) => {
      console.warn('[outfit] save failed', e);
      getEquipped().then((saved) => set({ equipped: saved })).catch(() => {});
    });
  },
  async buy(itemId) {
    try {
      const r = await purchaseOutfit(itemId);
      useWallet.getState().set(r.wallet);
      set({ owned: r.owned, equipped: r.equipped });
      return { ok: true };
    } catch (e) {
      if (e instanceof PurchaseError) return { ok: false, reason: e.reason, lack: e.lack };
      console.warn('[outfit] buy failed', e);
      return { ok: false, reason: 'error', lack: 0 };
    }
  },
}));
