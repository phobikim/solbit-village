// 솔이네 옷장 스토어. owned · saved는 DB 값, draft는 화면에서 고르는 중인 모습 ("이대로 가기"를 눌러야 저장).

import { create } from 'zustand';

import { getEquipped, getOwned, seedOwned, setEquipped } from '../data/outfit';
import { clearAll, equip, unequip, type Equipped, type Slot } from '../domain/outfit';

type OutfitState = {
  owned: ReadonlySet<string>;
  /** 마지막으로 저장한 착용 */
  saved: Equipped;
  /** 지금 화면에서 고르는 착용 */
  draft: Equipped;
  loaded: boolean;
  /** DB에서 불러와 draft를 저장된 모습으로 맞춘다 */
  load: () => Promise<void>;
  wear: (itemId: string) => void;
  takeOff: (slot: Slot) => void;
  stripAll: () => void;
  /** draft를 저장한다 */
  commit: () => Promise<void>;
};

export const useOutfit = create<OutfitState>((set, get) => ({
  owned: new Set(),
  saved: {},
  draft: {},
  loaded: false,
  async load() {
    await seedOwned();
    const [owned, saved] = await Promise.all([getOwned(), getEquipped()]);
    set({ owned, saved, draft: saved, loaded: true });
  },
  wear: (itemId) => set((s) => ({ draft: equip(s.draft, itemId, s.owned) })),
  takeOff: (slot) => set((s) => ({ draft: unequip(s.draft, slot) })),
  stripAll: () => set({ draft: clearAll() }),
  async commit() {
    const { draft } = get();
    await setEquipped(draft);
    set({ saved: draft });
  },
}));
