// 밭 · 창고 · 경험치 스토어

import { create } from 'zustand';

import { countRecordDays, loadFarm, type FarmSnapshot } from '../data/farm';
import { today as getToday } from '../domain/day';

type State = FarmSnapshot & {
  loaded: boolean;
  recordDays: number;
  /** 밀린 자동 수확을 정산하고 읽는다 */
  load: () => Promise<void>;
};

export const useFarm = create<State>((set) => ({
  active: [],
  inventory: {},
  totalHarvested: 0,
  autoHarvestedToday: null,
  harvestedToday: [],
  totalXp: 0,
  xpGainedToday: 0,
  loaded: false,
  recordDays: 0,
  async load() {
    const [snap, recordDays] = await Promise.all([loadFarm(getToday()), countRecordDays()]);
    set({ ...snap, recordDays, loaded: true });
  },
}));
