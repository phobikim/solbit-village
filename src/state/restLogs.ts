// 쉼 기록(장작) 스토어. 쉼 지수 · 쉼터 · 이웃 만남이 여기서 읽는다.

import { create } from 'zustand';

import { deleteRestLog, listRestLogs, throwFirewood } from '../data/restLogs';
import type { RestLog } from '../domain/fire';
import type { Place } from '../domain/rest';
import { usePlaces } from './places';

type State = {
  logs: RestLog[];
  loaded: boolean;
  load: () => Promise<void>;
  /** 장작 던지기: 쉼 기록 + (발자국을 찍기로 한) 장소를 같이 저장한다 */
  throwLog: (log: RestLog, places: readonly Place[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useRestLogs = create<State>((set, get) => ({
  logs: [],
  loaded: false,
  async load() {
    set({ logs: await listRestLogs(), loaded: true });
  },
  async throwLog(log, places) {
    await throwFirewood(log, places);
    await Promise.all([get().load(), usePlaces.getState().load()]);
  },
  async remove(id) {
    await deleteRestLog(id);
    await Promise.all([get().load(), usePlaces.getState().load()]);
  },
}));
