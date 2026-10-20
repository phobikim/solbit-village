// 밭 · 창고 · 경험치 스토어

import { create } from 'zustand';

import { loadFarm, type FarmSnapshot } from '../data/farm';
import { today as getToday } from '../domain/day';

type State = FarmSnapshot & {
  loaded: boolean;
  load: () => Promise<void>;
};

export const useFarm = create<State>((set) => ({
  active: [],
  inventory: {},
  totalHarvested: 0,
  autoHarvestedToday: null,
  totalXp: 0,
  xpGainedToday: 0,
  loaded: false,
  async load() {
    const snap = await loadFarm(getToday());
    set({ ...snap, loaded: true });
  },
}));
