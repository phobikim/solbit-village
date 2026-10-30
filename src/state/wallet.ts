// 재화(코인 · 흥) 잔액 스토어. 메인과 옷장 탭의 재화 칩이 읽는다. 저장은 src/data/wallet.ts.

import { create } from 'zustand';

import { getWallet } from '../data/wallet';
import { EMPTY_WALLET, type Wallet } from '../domain/wallet';

type WalletState = Wallet & {
  loaded: boolean;
  load: () => Promise<void>;
  /** 저장소에서 이미 바뀐 잔액을 화면에 맞춘다 */
  set: (w: Wallet) => void;
};

export const useWallet = create<WalletState>((set) => ({
  ...EMPTY_WALLET,
  loaded: false,
  async load() {
    const w = await getWallet();
    set({ ...w, loaded: true });
  },
  set: (w) => set({ ...w }),
}));
