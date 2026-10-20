// 밭 · 창고 · 경험치 스토어

import { create } from 'zustand';

import { countRecordDays, harvestRipe, loadFarm, type FarmSnapshot, type HarvestResult } from '../data/farm';
import { today as getToday } from '../domain/day';

type State = FarmSnapshot & {
  loaded: boolean;
  recordDays: number;
  load: () => Promise<void>;
  /** 익은 작물 전부 수확 */
  harvest: () => Promise<HarvestResult>;
};

export const useFarm = create<State>((set, get) => ({
  active: [],
  inventory: {},
  totalHarvested: 0,
  autoHarvestedToday: null,
  totalXp: 0,
  xpGainedToday: 0,
  loaded: false,
  recordDays: 0,
  async load() {
    const [snap, recordDays] = await Promise.all([loadFarm(getToday()), countRecordDays()]);
    set({ ...snap, recordDays, loaded: true });
  },
  async harvest() {
    const result = await harvestRipe(getToday());
    await get().load();
    return result;
  },
}));
