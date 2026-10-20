// 이장네 장부(행사 · 성취) · 스킨 스토어

import { create } from 'zustand';

import { deleteEvent, listAchievements, listEvents, saveEvent } from '../data/events';
import { exchangeSkin, loadSkins, setSkinEquipped } from '../data/skins';
import type { DayKey } from '../domain/day';
import type { VillageEvent } from '../domain/events';
import { useFarm } from './farm';

type LedgerState = {
  events: VillageEvent[];
  achievements: { date: DayKey; text: string }[];
  loaded: boolean;
  load: () => Promise<void>;
  save: (e: VillageEvent) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useLedger = create<LedgerState>((set, get) => ({
  events: [],
  achievements: [],
  loaded: false,
  async load() {
    const [events, achievements] = await Promise.all([listEvents(), listAchievements()]);
    set({ events, achievements, loaded: true });
  },
  async save(e) {
    await saveEvent(e);
    await get().load();
  },
  async remove(id) {
    await deleteEvent(id);
    await get().load();
  },
}));

type SkinsState = {
  owned: Set<string>;
  equipped: Set<string>;
  load: () => Promise<void>;
  exchange: (id: string) => Promise<boolean>;
  setEquipped: (id: string, on: boolean) => Promise<void>;
};

export const useSkins = create<SkinsState>((set, get) => ({
  owned: new Set(),
  equipped: new Set(),
  async load() {
    set(await loadSkins());
  },
  async exchange(id) {
    const ok = await exchangeSkin(id);
    await Promise.all([get().load(), useFarm.getState().load()]);
    return ok;
  },
  async setEquipped(id, on) {
    await setSkinEquipped(id, on);
    await get().load();
  },
}));
