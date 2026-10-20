// 이웃 스토어

import { create } from 'zustand';

import { listNeighbors, type NeighborWithStats } from '../data/neighbors';

type State = {
  list: NeighborWithStats[];
  loaded: boolean;
  load: () => Promise<void>;
};

export const useNeighbors = create<State>((set) => ({
  list: [],
  loaded: false,
  async load() {
    const list = await listNeighbors();
    set({ list, loaded: true });
  },
}));
